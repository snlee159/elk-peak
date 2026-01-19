import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(origin: string | null, allowedDomains: string[]): HeadersInit {
  const headers: HeadersInit = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedDomains.length === 0) {
    headers["Access-Control-Allow-Origin"] = origin || "*";
    return headers;
  }

  if (origin) {
    const isAllowed = allowedDomains.some((domain) => {
      const trimmedDomain = domain.trim();
      return (
        origin.includes(trimmedDomain) ||
        origin === `http://${trimmedDomain}` ||
        origin === `https://${trimmedDomain}`
      );
    });
    if (isAllowed) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
      return headers;
    }
  }

  headers["Access-Control-Allow-Origin"] = origin || "*";
  return headers;
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    const allowedDomains =
      Deno.env.get("ALLOWED_DOMAINS")?.split(",").map((d) => d.trim()) || [];
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Max-Age": "86400",
    };
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const allowedDomains =
    Deno.env.get("ALLOWED_DOMAINS")?.split(",").map((d) => d.trim()) || [];

  try {
    const referer = req.headers.get("referer");
    const isAllowed =
      allowedDomains.length === 0 ||
      (origin && allowedDomains.some((domain) => origin.includes(domain))) ||
      (referer && allowedDomains.some((domain) => referer.includes(domain)));

    const corsHeaders = getCorsHeaders(origin, allowedDomains);

    if (!isAllowed && allowedDomains.length > 0) {
      return new Response(JSON.stringify({ error: "Domain not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Domain verified - get keys from Supabase secrets
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error - missing environment variables",
          authenticated: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { password } = requestBody;

    if (!password) {
      return new Response(JSON.stringify({ error: "Password is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role key for admin password verification (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin password and admin status
    const { data: adminData, error: adminError } = await supabase
      .from("admin_password")
      .select("*")
      .eq("password", password)
      .maybeSingle();

    if (adminError) {
      return new Response(
        JSON.stringify({
          error: "Database error",
          details: adminError.message,
          authenticated: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!adminData) {
      return new Response(
        JSON.stringify({
          error: "Invalid password",
          authenticated: false,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        isAdmin: adminData.is_admin || false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const corsHeaders = getCorsHeaders(origin, allowedDomains);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        authenticated: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

