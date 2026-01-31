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
 * ADMIN: LOG MONTHLY METRICS ENDPOINT
 * 
 * Capability: Log monthly revenue, MRR, engagements for all businesses
 * Security: Domain-verified, admin-password-verified, input-validated
 * 
 * Supported operations:
 * - logElkPeakRevenue: Log monthly revenue for Elk Peak
 * - logElkPeakMRR: Log monthly MRR for Elk Peak
 * - logElkPeakEngagements: Log monthly engagements for Elk Peak
 * - logLifeOrganizerRevenue: Log monthly revenue (KDP, Notion, Etsy, Gumroad)
 * - logFriendlyTechMetrics: Log monthly revenue and tech days
 * - logRuntimePMMetrics: Log monthly active users, revenue, subscriptions
 * - deleteMonthlyLog: Delete a monthly log entry
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

function validateYearMonth(year: any, month: any): { valid: boolean; error?: string } {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { valid: false, error: "Year must be a valid year between 2020 and 2100" };
  }
  
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, error: "Month must be between 1 and 12" };
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
    const { operation, data } = body;

    const validOperations = [
      "logElkPeakRevenue",
      "logElkPeakMRR",
      "logElkPeakEngagements",
      "logLifeOrganizerRevenue",
      "logFriendlyTechMetrics",
      "logRuntimePMMetrics",
      "logOrganizationCosts",
      "deleteMonthlyLog",
    ];

    if (!operation || !validOperations.includes(operation)) {
      return new Response(
        JSON.stringify({ error: "Invalid operation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate year/month for all operations
    const { year, month } = data;
    const ymValidation = validateYearMonth(year, month);
    if (!ymValidation.valid) {
      return new Response(
        JSON.stringify({ error: ymValidation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;
    let error;

    switch (operation) {
      case "logElkPeakRevenue": {
        const { revenue, notes } = data;
        if (typeof revenue !== "number" || revenue < 0) {
          return new Response(
            JSON.stringify({ error: "Revenue must be a positive number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("elk_peak_monthly_revenue")
          .upsert({ year, month, revenue, notes: notes || null }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logElkPeakMRR": {
        const { mrr, notes } = data;
        if (typeof mrr !== "number" || mrr < 0) {
          return new Response(
            JSON.stringify({ error: "MRR must be a positive number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("elk_peak_monthly_mrr")
          .upsert({ year, month, mrr, notes: notes || null }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logElkPeakEngagements": {
        const { count, notes } = data;
        if (!Number.isInteger(count) || count < 0) {
          return new Response(
            JSON.stringify({ error: "Count must be a positive integer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("elk_peak_monthly_engagements")
          .upsert({ year, month, count, notes: notes || null }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logLifeOrganizerRevenue": {
        const { kdp_revenue, notion_revenue, etsy_revenue, gumroad_revenue, notes } = data;
        const revenues = [kdp_revenue, notion_revenue, etsy_revenue, gumroad_revenue];
        if (revenues.some(r => typeof r !== "number" || r < 0)) {
          return new Response(
            JSON.stringify({ error: "All revenue values must be positive numbers" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("life_organizer_monthly_revenue")
          .upsert({
            year,
            month,
            kdp_revenue: kdp_revenue || 0,
            notion_revenue: notion_revenue || 0,
            etsy_revenue: etsy_revenue || 0,
            gumroad_revenue: gumroad_revenue || 0,
            notes: notes || null,
          }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logFriendlyTechMetrics": {
        const { revenue, tech_days, notes } = data;
        if (typeof revenue !== "number" || revenue < 0) {
          return new Response(
            JSON.stringify({ error: "Revenue must be a positive number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!Number.isInteger(tech_days) || tech_days < 0) {
          return new Response(
            JSON.stringify({ error: "Tech days must be a positive integer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("friendly_tech_monthly_metrics")
          .upsert({ year, month, revenue, tech_days, notes: notes || null }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logRuntimePMMetrics": {
        const { active_users, revenue, active_subscriptions, notes } = data;
        if (!Number.isInteger(active_users) || active_users < 0) {
          return new Response(
            JSON.stringify({ error: "Active users must be a positive integer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (typeof revenue !== "number" || revenue < 0) {
          return new Response(
            JSON.stringify({ error: "Revenue must be a positive number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!Number.isInteger(active_subscriptions) || active_subscriptions < 0) {
          return new Response(
            JSON.stringify({ error: "Active subscriptions must be a positive integer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("runtime_pm_monthly_metrics")
          .upsert({
            year,
            month,
            active_users,
            revenue,
            active_subscriptions,
            notes: notes || null,
          }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "logOrganizationCosts": {
        const { cost, notes } = data;
        if (typeof cost !== "number" || cost < 0) {
          return new Response(
            JSON.stringify({ error: "Cost must be a positive number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: upsertResult, error: upsertError } = await supabase
          .from("organization_monthly_costs")
          .upsert({ year, month, cost, notes: notes || null }, { onConflict: "year,month" })
          .select()
          .single();
        result = upsertResult;
        error = upsertError;
        break;
      }

      case "deleteMonthlyLog": {
        const { table } = data;
        const validTables = [
          "elk_peak_monthly_revenue",
          "elk_peak_monthly_mrr",
          "elk_peak_monthly_engagements",
          "life_organizer_monthly_revenue",
          "friendly_tech_monthly_metrics",
          "runtime_pm_monthly_metrics",
          "organization_monthly_costs",
        ];
        
        if (!validTables.includes(table)) {
          return new Response(
            JSON.stringify({ error: "Invalid table" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq("year", year)
          .eq("month", month);
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
    console.error("Error in admin-log-metrics:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
