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
 * PROTECTED METRICS ENDPOINT
 * 
 * Capability: Fetch aggregated business metrics and time-series data for dashboard
 * Security: Admin-password-required, rate-limited, domain-verified
 * 
 * This endpoint returns calculated metrics and historical time-series data
 * needed for dashboard charts. Requires admin authentication via x-admin-password header.
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
  const ua = req.headers.get("user-agent") || "unknown";
  return `${ip}:${ua.substring(0, 50)}`;
}

function checkRateLimit(key: string, maxRequests = 30, windowMs = 60000): boolean {
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

    // Rate limiting - 60 requests per minute per IP/UA combo
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey, 60)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
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

    // Fetch all data needed for metrics calculation
    const [
      elkClients,
      elkProjects,
      elkMonthlyRevenue,
      elkMonthlyEngagements,
      elkMonthlyMRR,
      loKdpSales,
      loNotionSales,
      loMonthlyRevenue,
      ftTechDays,
      ftHoaClients,
      ftMonthlyMetrics,
      rpmUsers,
      rpmSubscriptions,
      rpmMonthlyMetrics,
      metricOverrides,
    ] = await Promise.all([
      supabase.from("elk_peak_clients").select("*"),
      supabase.from("elk_peak_projects").select("*"),
      supabase.from("elk_peak_monthly_revenue").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("elk_peak_monthly_engagements").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("elk_peak_monthly_mrr").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("life_organizer_kdp_sales").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("life_organizer_notion_sales").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("life_organizer_monthly_revenue").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("friendly_tech_days").select("*").order("date", { ascending: false }),
      supabase.from("friendly_tech_hoa_clients").select("*"),
      supabase.from("friendly_tech_monthly_metrics").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("runtime_pm_users").select("*"),
      supabase.from("runtime_pm_subscriptions").select("*"),
      supabase.from("runtime_pm_monthly_metrics").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("business_metrics_overrides").select("*"),
    ]);

    // Build overrides map
    const overrides: Record<string, number> = {};
    metricOverrides.data?.forEach((override: any) => {
      const key = `${override.company}:${override.metric_key}`;
      overrides[key] = override.value;
    });

    // Calculate Elk Peak metrics
    const elkActiveClients = elkClients.data?.filter((c: any) => c.status === "active").length || 0;
    const elkRecurringClients = elkClients.data?.filter((c: any) => c.status === "active" && (c.monthly_revenue || 0) > 0).length || 0;
    const elkTotalRevenue = elkMonthlyRevenue.data?.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) || 0;
    const elkCurrentMRR = elkMonthlyMRR.data?.[0]?.mrr || 0;
    const elkMRR = elkCurrentMRR > 0 ? elkCurrentMRR : elkClients.data?.reduce((sum: number, c: any) => sum + (c.monthly_revenue || 0), 0) || 0;
    const elkTotalProjects = elkProjects.data?.length || 0;

    // Calculate Life Organizer metrics
    const loTotalKDP = loMonthlyRevenue.data?.reduce((sum: number, m: any) => sum + (m.kdp_revenue || 0), 0) || 0;
    const loTotalNotion = loMonthlyRevenue.data?.reduce((sum: number, m: any) => sum + (m.notion_revenue || 0), 0) || 0;
    const loTotalEtsy = loMonthlyRevenue.data?.reduce((sum: number, m: any) => sum + (m.etsy_revenue || 0), 0) || 0;
    const loTotalGumroad = loMonthlyRevenue.data?.reduce((sum: number, m: any) => sum + (m.gumroad_revenue || 0), 0) || 0;
    const loTotalRevenue = loTotalKDP + loTotalNotion + loTotalEtsy + loTotalGumroad;
    const loActiveRPMUsers = rpmUsers.data?.filter((u: any) => u.status === "active").length || 0;

    // Calculate Friendly Tech metrics
    const ftTotalRevenue = ftMonthlyMetrics.data?.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) || 0;
    const ftActiveHOA = ftHoaClients.data?.filter((c: any) => c.status === "active").length || 0;
    const ftTotalSessions = ftTechDays.data?.length || 0;

    // Calculate Runtime PM metrics
    const rpmActiveUsers = rpmMonthlyMetrics.data?.[0]?.active_users || rpmUsers.data?.filter((u: any) => u.status === "active").length || 0;
    const rpmActiveSubscriptions = rpmMonthlyMetrics.data?.[0]?.active_subscriptions || rpmSubscriptions.data?.filter((s: any) => s.status === "active").length || 0;
    const rpmMRR = rpmMonthlyMetrics.data?.[0]?.revenue || rpmSubscriptions.data?.reduce((sum: number, s: any) => sum + (s.monthly_amount || 0), 0) || 0;
    const rpmTotalRevenue = rpmMonthlyMetrics.data?.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) || 0;

    // Apply overrides
    const applyOverride = (company: string, key: string, value: number) => {
      const overrideKey = `${company}:${key}`;
      return overrides[overrideKey] !== undefined ? overrides[overrideKey] : value;
    };

    // Return aggregated metrics with time-series data for charts
    const metrics = {
      elkPeak: {
        activeClients: applyOverride("elkPeak", "activeClients", elkActiveClients),
        recurringClients: applyOverride("elkPeak", "recurringClients", elkRecurringClients),
        monthlyRecurringRevenue: applyOverride("elkPeak", "monthlyRecurringRevenue", elkMRR),
        totalRevenue: applyOverride("elkPeak", "totalRevenue", elkTotalRevenue),
        totalProjects: applyOverride("elkPeak", "totalProjects", elkTotalProjects),
        // Time-series data for charts
        monthlyRevenue: elkMonthlyRevenue.data || [],
        monthlyMRR: elkMonthlyMRR.data || [],
        monthlyEngagements: elkMonthlyEngagements.data || [],
      },
      lifeOrganizer: {
        totalKDPRevenue: applyOverride("lifeOrganizer", "totalKDPRevenue", loTotalKDP),
        totalNotionRevenue: applyOverride("lifeOrganizer", "totalNotionRevenue", loTotalNotion),
        totalEtsyRevenue: applyOverride("lifeOrganizer", "totalEtsyRevenue", loTotalEtsy),
        totalGumroadRevenue: applyOverride("lifeOrganizer", "totalGumroadRevenue", loTotalGumroad),
        totalRevenue: applyOverride("lifeOrganizer", "totalRevenue", loTotalRevenue),
        activeRuntimePMUsers: applyOverride("lifeOrganizer", "activeRuntimePMUsers", loActiveRPMUsers),
        // Time-series data for charts
        monthlyRevenue: loMonthlyRevenue.data || [],
      },
      friendlyTech: {
        totalRevenue: applyOverride("friendlyTech", "totalRevenue", ftTotalRevenue),
        activeHOAClients: applyOverride("friendlyTech", "activeHOAClients", ftActiveHOA),
        totalSessions: applyOverride("friendlyTech", "totalSessions", ftTotalSessions),
        // Time-series data for charts
        monthlyMetrics: ftMonthlyMetrics.data || [],
      },
      runtimePM: {
        activeUsers: applyOverride("runtimePM", "activeUsers", rpmActiveUsers),
        monthlyRecurringRevenue: applyOverride("runtimePM", "monthlyRecurringRevenue", rpmMRR),
        totalSubscriptions: applyOverride("runtimePM", "totalSubscriptions", rpmActiveSubscriptions),
        totalRevenue: applyOverride("runtimePM", "totalRevenue", rpmTotalRevenue),
        // Time-series data for charts
        monthlyMetrics: rpmMonthlyMetrics.data || [],
      },
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in public-metrics:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch metrics" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
