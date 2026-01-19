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

    const { operation, data, id, updates } = requestBody;

    if (!operation) {
      return new Response(JSON.stringify({ error: "Operation is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debug logging (remove in production)
    console.log("Received operation:", operation);

    // Domain already verified - use service role key for admin operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Perform the requested operation
    let result;
    let error;

    switch (operation) {
      case "updateMetricOverride":
        const { company, metricKey, value } = data;
        const overrideData = {
          company,
          metric_key: metricKey,
          value: parseFloat(value) || 0,
          updated_at: new Date().toISOString(),
        };
        const { data: overrideResult, error: overrideError } = await supabase
          .from("business_metrics_overrides")
          .upsert(overrideData, {
            onConflict: "company,metric_key",
          })
          .select()
          .single();
        result = overrideResult;
        error = overrideError;
        break;

      case "createQuarterGoal":
        const { data: createResult, error: createError } = await supabase
          .from("quarter_goal")
          .insert(data)
          .select()
          .single();
        result = createResult;
        error = createError;
        break;

      case "updateQuarterGoal":
        const { data: updateResult, error: updateError } = await supabase
          .from("quarter_goal")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        result = updateResult;
        error = updateError;
        break;

      case "deleteQuarterGoal":
        const { error: deleteGoalError } = await supabase
          .from("quarter_goal")
          .delete()
          .eq("id", id);
        error = deleteGoalError;
        result = { success: true };
        break;

      case "logMonthlyRevenue":
        const { table, year, month, revenueData } = data;
        let monthlyResult;
        let monthlyError;
        
        if (table === "elk_peak_monthly_revenue") {
          const { data: upsertResult, error: upsertError } = await supabase
            .from(table)
            .upsert({
              year,
              month,
              revenue: revenueData.revenue || 0,
              notes: revenueData.notes || null,
            }, {
              onConflict: "year,month",
            })
            .select()
            .single();
          monthlyResult = upsertResult;
          monthlyError = upsertError;
        } else if (table === "life_organizer_monthly_revenue") {
          const { data: upsertResult, error: upsertError } = await supabase
            .from(table)
            .upsert({
              year,
              month,
              kdp_revenue: revenueData.kdp_revenue || 0,
              notion_revenue: revenueData.notion_revenue || 0,
              etsy_revenue: revenueData.etsy_revenue || 0,
              gumroad_revenue: revenueData.gumroad_revenue || 0,
              notes: revenueData.notes || null,
            }, {
              onConflict: "year,month",
            })
            .select()
            .single();
          monthlyResult = upsertResult;
          monthlyError = upsertError;
        } else if (table === "friendly_tech_monthly_metrics") {
          const { data: upsertResult, error: upsertError } = await supabase
            .from(table)
            .upsert({
              year,
              month,
              revenue: revenueData.revenue || 0,
              tech_days: revenueData.tech_days || 0,
              notes: revenueData.notes || null,
            }, {
              onConflict: "year,month",
            })
            .select()
            .single();
          monthlyResult = upsertResult;
          monthlyError = upsertError;
        } else if (table === "runtime_pm_monthly_metrics") {
          const { data: upsertResult, error: upsertError } = await supabase
            .from(table)
            .upsert({
              year,
              month,
              active_users: revenueData.active_users || 0,
              revenue: revenueData.revenue || 0,
              active_subscriptions: revenueData.active_subscriptions || 0,
              notes: revenueData.notes || null,
            }, {
              onConflict: "year,month",
            })
            .select()
            .single();
          monthlyResult = upsertResult;
          monthlyError = upsertError;
        } else {
          return new Response(
            JSON.stringify({ error: "Invalid table for monthly revenue logging" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = monthlyResult;
        error = monthlyError;
        break;

      case "logMonthlyEngagements":
        const { year: engYear, month: engMonth, count } = data;
        const { data: engResult, error: engError } = await supabase
          .from("elk_peak_monthly_engagements")
          .upsert({
            year: engYear,
            month: engMonth,
            count: count || 0,
            notes: data.notes || null,
          }, {
            onConflict: "year,month",
          })
          .select()
          .single();
        result = engResult;
        error = engError;
        break;

      case "logMonthlyMRR":
        const { year: mrrYear, month: mrrMonth, mrr } = data;
        const { data: mrrResult, error: mrrError } = await supabase
          .from("elk_peak_monthly_mrr")
          .upsert({
            year: mrrYear,
            month: mrrMonth,
            mrr: mrr || 0,
            notes: data.notes || null,
          }, {
            onConflict: "year,month",
          })
          .select()
          .single();
        result = mrrResult;
        error = mrrError;
        break;

      case "deleteMonthlyRevenue":
        const { table: deleteTable, year: deleteYear, month: deleteMonth } = data;
        let deleteRevenueResult;
        let deleteRevenueError;
        
        if (deleteTable === "elk_peak_monthly_revenue") {
          const { error: delError } = await supabase
            .from(deleteTable)
            .delete()
            .eq("year", deleteYear)
            .eq("month", deleteMonth);
          deleteRevenueError = delError;
          deleteRevenueResult = { success: true };
        } else if (deleteTable === "life_organizer_monthly_revenue") {
          const { error: delError } = await supabase
            .from(deleteTable)
            .delete()
            .eq("year", deleteYear)
            .eq("month", deleteMonth);
          deleteRevenueError = delError;
          deleteRevenueResult = { success: true };
        } else if (deleteTable === "friendly_tech_monthly_metrics") {
          const { error: delError } = await supabase
            .from(deleteTable)
            .delete()
            .eq("year", deleteYear)
            .eq("month", deleteMonth);
          deleteRevenueError = delError;
          deleteRevenueResult = { success: true };
        } else if (deleteTable === "runtime_pm_monthly_metrics") {
          const { error: delError } = await supabase
            .from(deleteTable)
            .delete()
            .eq("year", deleteYear)
            .eq("month", deleteMonth);
          deleteRevenueError = delError;
          deleteRevenueResult = { success: true };
        } else {
          return new Response(
            JSON.stringify({ error: "Invalid table for deleting monthly revenue" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = deleteRevenueResult;
        error = deleteRevenueError;
        break;

      case "deleteMonthlyEngagements":
        const { year: delEngYear, month: delEngMonth } = data;
        const { error: delEngError } = await supabase
          .from("elk_peak_monthly_engagements")
          .delete()
          .eq("year", delEngYear)
          .eq("month", delEngMonth);
        error = delEngError;
        result = { success: true };
        break;

      case "deleteMonthlyMRR":
        const { year: delMRRYear, month: delMRRMonth } = data;
        const { error: delMRRError } = await supabase
          .from("elk_peak_monthly_mrr")
          .delete()
          .eq("year", delMRRYear)
          .eq("month", delMRRMonth);
        error = delMRRError;
        result = { success: true };
        break;

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
      return new Response(
        JSON.stringify({
          error: "Database error",
          details: error.message,
        }),
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
    const corsHeaders = getCorsHeaders(origin, allowedDomains);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

