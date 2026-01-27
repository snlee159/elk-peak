import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ADMIN: VIEW CONTACT SUBMISSIONS ENDPOINT
 * 
 * Capability: View and manage contact form submissions
 * Security: Admin-password-required, rate-limited, domain-verified
 * 
 * Operations:
 * - list: Get all contact submissions (with filters)
 * - updateStatus: Mark submission as read/replied/archived
 * - addNotes: Add admin notes to a submission
 * - delete: Delete a submission
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
  const { data, error } = await supabase
    .from("admin_password")
    .select("password, is_admin")
    .eq("password", password)
    .eq("is_admin", true)
    .single();

  return !error && data !== null;
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

    let result;
    let error;

    switch (operation) {
      case "list": {
        const { status, limit = 50 } = data || {};
        
        let query = supabase
          .from("contact_submissions")
          .select("*")
          .order("submitted_at", { ascending: false })
          .limit(limit);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: submissions, error: listError } = await query;
        result = submissions;
        error = listError;
        break;
      }

      case "updateStatus": {
        const { id, status: newStatus } = data;
        
        if (!id || !newStatus) {
          return new Response(
            JSON.stringify({ error: "ID and status are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validStatuses = ["new", "read", "replied", "archived"];
        if (!validStatuses.includes(newStatus)) {
          return new Response(
            JSON.stringify({ error: "Invalid status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from("contact_submissions")
          .update({ status: newStatus })
          .eq("id", id)
          .select()
          .single();

        result = updated;
        error = updateError;
        break;
      }

      case "addNotes": {
        const { id, notes } = data;
        
        if (!id || typeof notes !== "string") {
          return new Response(
            JSON.stringify({ error: "ID and notes are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from("contact_submissions")
          .update({ notes })
          .eq("id", id)
          .select()
          .single();

        result = updated;
        error = updateError;
        break;
      }

      case "delete": {
        const { id } = data;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await supabase
          .from("contact_submissions")
          .delete()
          .eq("id", id);

        error = deleteError;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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
    console.error("Error in admin-contacts:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
