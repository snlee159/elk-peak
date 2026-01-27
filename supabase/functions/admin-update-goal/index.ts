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
 * ADMIN: UPDATE QUARTER GOAL ENDPOINT
 * 
 * Capability: Create, update, or delete quarter goals
 * Security: Domain-verified, admin-password-verified, input-validated
 * 
 * This endpoint handles quarter goal management for authenticated admins only.
 * Operations: create, update, delete
 * 
 * All operations require:
 * 1. Request from allowed domain
 * 2. Valid admin password in Authorization header
 * 3. Validated input data
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

function getRateLimitKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for") || 
             req.headers.get("x-real-ip") || 
             "unknown";
  return ip;
}

function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): boolean {
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

function validateGoalData(operation: string, data: any): { valid: boolean; error?: string } {
  if (operation === "delete") {
    if (!data.id || typeof data.id !== "string") {
      return { valid: false, error: "Valid goal ID is required" };
    }
    return { valid: true };
  }

  if (operation === "update") {
    if (!data.id || typeof data.id !== "string") {
      return { valid: false, error: "Valid goal ID is required" };
    }
    if (!data.updates || typeof data.updates !== "object") {
      return { valid: false, error: "Updates object is required" };
    }
    // Validate allowed update fields
    const allowedFields = ["name", "target_value", "current_value", "order"];
    const updateFields = Object.keys(data.updates);
    const invalidFields = updateFields.filter(f => !allowedFields.includes(f));
    if (invalidFields.length > 0) {
      return { valid: false, error: `Invalid update fields: ${invalidFields.join(", ")}` };
    }
    return { valid: true };
  }

  if (operation === "create") {
    const { name, target_value, quarter, year, metric_type } = data;
    
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 200) {
      return { valid: false, error: "Name must be between 1 and 200 characters" };
    }
    
    if (typeof target_value !== "number" || target_value < 0) {
      return { valid: false, error: "Target value must be a positive number" };
    }
    
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return { valid: false, error: "Quarter must be between 1 and 4" };
    }
    
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return { valid: false, error: "Year must be a valid year" };
    }
    
    const validMetricTypes = ["elk_peak_mrr", "life_organizer_revenue", "friendly_tech_revenue", "runtime_pm_users", "runtime_pm_mrr", "custom"];
    if (metric_type && !validMetricTypes.includes(metric_type)) {
      return { valid: false, error: "Invalid metric type" };
    }
    
    return { valid: true };
  }

  return { valid: false, error: "Invalid operation" };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Check origin allowlist - required for admin operations
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

    // Verify admin password from header
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

    // Parse and validate request
    const body = await req.json();
    const { operation, data } = body;

    if (!operation || !["create", "update", "delete"].includes(operation)) {
      return new Response(
        JSON.stringify({ error: "Invalid operation. Must be: create, update, or delete" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validation = validateGoalData(operation, data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
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
      case "create": {
        const { data: createResult, error: createError } = await supabase
          .from("quarter_goal")
          .insert(data)
          .select()
          .single();
        result = createResult;
        error = createError;
        break;
      }

      case "update": {
        const { data: updateResult, error: updateError } = await supabase
          .from("quarter_goal")
          .update(data.updates)
          .eq("id", data.id)
          .select()
          .single();
        result = updateResult;
        error = updateError;
        break;
      }

      case "delete": {
        const { error: deleteError } = await supabase
          .from("quarter_goal")
          .delete()
          .eq("id", data.id);
        error = deleteError;
        result = { success: true };
        break;
      }
    }

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database operation failed" }),
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
    console.error("Error in admin-update-goal:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
