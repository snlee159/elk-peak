import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify a password against a stored PBKDF2 hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 3) return false;
    
    const [iterationsStr, saltBase64, hashBase64] = parts;
    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations)) return false;
    
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const storedHashBytes = Uint8Array.from(atob(hashBase64), c => c.charCodeAt(0));
    
    const passwordBuffer = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveBits"]);
    
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
      key,
      32 * 8
    );
    
    const hashBytes = new Uint8Array(hashBuffer);
    if (hashBytes.length !== storedHashBytes.length) return false;
    
    let diff = 0;
    for (let i = 0; i < hashBytes.length; i++) {
      diff |= hashBytes[i] ^ storedHashBytes[i];
    }
    
    return diff === 0;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * ADMIN: MANAGE BUSINESS DATA ENDPOINT
 * 
 * Capability: List, create, update, delete business records (clients, projects, sales, etc.)
 * Security: Domain-verified, admin-password-verified, input-validated
 * 
 * Allowed tables (explicit allowlist):
 * - elk_peak_clients
 * - elk_peak_projects
 * - life_organizer_kdp_sales
 * - life_organizer_notion_sales
 * - friendly_tech_days
 * - friendly_tech_hoa_clients
 * - runtime_pm_users
 * - runtime_pm_subscriptions
 * - quarter_goal
 * 
 * Operations: list, create, update, delete
 * List operation supports optional filters.
 * Each operation validates input and restricts fields that can be modified.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const ALLOWED_TABLES = [
  "elk_peak_clients",
  "elk_peak_projects",
  "life_organizer_kdp_sales",
  "life_organizer_notion_sales",
  "friendly_tech_days",
  "friendly_tech_hoa_clients",
  "runtime_pm_users",
  "runtime_pm_subscriptions",
  "quarter_goal",
];

// Define allowed fields per table to prevent injection of system fields
const TABLE_ALLOWED_FIELDS: Record<string, string[]> = {
  elk_peak_clients: ["name", "status", "monthly_revenue", "start_date", "notes"],
  elk_peak_projects: ["name", "client_id", "revenue", "status", "start_date", "end_date", "notes"],
  life_organizer_kdp_sales: ["date", "units", "revenue", "product_name", "notes"],
  life_organizer_notion_sales: ["date", "units", "revenue", "product_name", "notes"],
  friendly_tech_days: ["date", "hoa_client_id", "revenue", "hours", "sessions_count", "notes"],
  friendly_tech_hoa_clients: ["name", "status", "contact_email", "contact_phone", "address", "notes"],
  runtime_pm_users: ["email", "status", "signup_date", "last_active_date", "subscription_tier", "notes"],
  runtime_pm_subscriptions: ["user_id", "status", "monthly_amount", "start_date", "end_date", "notes"],
  quarter_goal: ["name", "target_value", "current_value", "quarter", "year", "metric_type", "order"],
};

function getRateLimitKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for") || 
             req.headers.get("x-real-ip") || 
             "unknown";
  return ip;
}

function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
  
  const allowOrigin = allowedOrigins.length === 0 
    ? (origin || "*")
    : (origin && allowedOrigins.some(o => origin.includes(o.trim()))) 
      ? origin 
      : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

async function verifyAdminPassword(supabase: any, password: string): Promise<boolean> {
  const { data: adminRecords, error } = await supabase
    .from("admin_password")
    .select("password_hash, is_admin")
    .eq("is_admin", true);

  if (error || !adminRecords || adminRecords.length === 0) {
    return false;
  }

  // Check password against all admin accounts
  for (const admin of adminRecords) {
    try {
      const isMatch = await verifyPassword(password, admin.password_hash);
      if (isMatch) {
        return true;
      }
    } catch (err) {
      // Invalid hash format - skip this record
      continue;
    }
  }

  return false;
}

function validateTableAccess(table: string): { valid: boolean; error?: string } {
  if (!ALLOWED_TABLES.includes(table)) {
    return { valid: false, error: "Table not allowed" };
  }
  return { valid: true };
}

function validateFields(table: string, data: any): { valid: boolean; error?: string } {
  const allowedFields = TABLE_ALLOWED_FIELDS[table];
  if (!allowedFields) {
    return { valid: false, error: "No field configuration for table" };
  }

  const providedFields = Object.keys(data);
  const invalidFields = providedFields.filter(f => !allowedFields.includes(f));
  
  if (invalidFields.length > 0) {
    return { valid: false, error: `Invalid fields: ${invalidFields.join(", ")}` };
  }

  return { valid: true };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Check origin allowlist
    const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
    if (allowedOrigins.length > 0) {
      const referer = req.headers.get("referer");
      const isAllowed = 
        (origin && allowedOrigins.some(o => origin.includes(o.trim()))) ||
        (referer && allowedOrigins.some(o => referer.includes(o.trim())));
      
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: "Origin not allowed" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin password
    const adminPassword = req.headers.get("x-admin-password");
    if (!adminPassword) {
      return new Response(
        JSON.stringify({ error: "Admin authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isAdmin = await verifyAdminPassword(supabase, adminPassword);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Invalid admin credentials" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const body = await req.json();
    const { operation, table, data, id, filters } = body;

    // Validate operation
    if (!operation || !["create", "update", "delete", "list"].includes(operation)) {
      return new Response(
        JSON.stringify({ error: "Invalid operation. Must be: create, update, delete, or list" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate table
    const tableValidation = validateTableAccess(table);
    if (!tableValidation.valid) {
      return new Response(
        JSON.stringify({ error: tableValidation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Execute operation
    let result;
    let error;

    switch (operation) {
      case "list": {
        // List records with optional filters
        let query = supabase.from(table).select("*");
        
        // Apply filters if provided
        if (filters && typeof filters === "object") {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data: listData, error: listError } = await query;
        result = listData;
        error = listError;
        break;
      }

      case "create": {
        if (!data || typeof data !== "object") {
          return new Response(
            JSON.stringify({ error: "Data object is required for create" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const fieldsValidation = validateFields(table, data);
        if (!fieldsValidation.valid) {
          return new Response(
            JSON.stringify({ error: fieldsValidation.error }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: createResult, error: createError } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        result = createResult;
        error = createError;
        break;
      }

      case "update": {
        if (!id || typeof id !== "string") {
          return new Response(
            JSON.stringify({ error: "Valid ID is required for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!data || typeof data !== "object") {
          return new Response(
            JSON.stringify({ error: "Data object is required for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const fieldsValidation = validateFields(table, data);
        if (!fieldsValidation.valid) {
          return new Response(
            JSON.stringify({ error: fieldsValidation.error }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updateResult, error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq("id", id)
          .select()
          .single();
        result = updateResult;
        error = updateError;
        break;
      }

      case "delete": {
        if (!id || typeof id !== "string") {
          return new Response(
            JSON.stringify({ error: "Valid ID is required for delete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq("id", id);
        error = deleteError;
        result = { success: true };
        break;
      }
    }

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database operation failed", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-manage-data:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
