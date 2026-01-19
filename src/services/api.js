import { supabase } from "@/lib/supabase";

// Verify password function - checks domain and password, returns admin status
export async function verifyPassword(password) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ password }),
    }
  );

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      throw new Error(
        `Password verification failed: ${response.status} ${response.statusText}`
      );
    }
    const errorMessage =
      error.message || error.error || error.details || "Invalid password";
    console.error("Supabase Edge Function error:", error);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

// Get metric overrides
async function getMetricOverrides() {
  const { data, error } = await supabase
    .from("business_metrics_overrides")
    .select("*");
  if (error) {
    console.error("Error fetching metric overrides:", error);
    return {};
  }
  
  // Convert array to object keyed by "company:metric_key"
  const overrides = {};
  data?.forEach((override) => {
    const key = `${override.company}:${override.metric_key}`;
    overrides[key] = override.value;
  });
  return overrides;
}

// Apply overrides to metrics
function applyOverrides(metrics, overrides) {
  const applyOverride = (company, key, defaultValue) => {
    const overrideKey = `${company}:${key}`;
    return overrides[overrideKey] !== undefined ? overrides[overrideKey] : defaultValue;
  };

  return {
    elkPeak: {
      ...metrics.elkPeak,
      activeClients: applyOverride("elkPeak", "activeClients", metrics.elkPeak.activeClients),
      recurringClients: applyOverride("elkPeak", "recurringClients", metrics.elkPeak.recurringClients),
      monthlyRecurringRevenue: applyOverride("elkPeak", "monthlyRecurringRevenue", metrics.elkPeak.monthlyRecurringRevenue),
      totalRevenue: applyOverride("elkPeak", "totalRevenue", metrics.elkPeak.totalRevenue),
      totalProjects: applyOverride("elkPeak", "totalProjects", metrics.elkPeak.totalProjects),
    },
    lifeOrganizer: {
      ...metrics.lifeOrganizer,
      totalKDPRevenue: applyOverride("lifeOrganizer", "totalKDPRevenue", metrics.lifeOrganizer.totalKDPRevenue),
      totalNotionRevenue: applyOverride("lifeOrganizer", "totalNotionRevenue", metrics.lifeOrganizer.totalNotionRevenue),
      totalEtsyRevenue: applyOverride("lifeOrganizer", "totalEtsyRevenue", metrics.lifeOrganizer.totalEtsyRevenue),
      totalGumroadRevenue: applyOverride("lifeOrganizer", "totalGumroadRevenue", metrics.lifeOrganizer.totalGumroadRevenue),
      totalRevenue: applyOverride("lifeOrganizer", "totalRevenue", metrics.lifeOrganizer.totalRevenue),
      activeRuntimePMUsers: applyOverride("lifeOrganizer", "activeRuntimePMUsers", metrics.lifeOrganizer.activeRuntimePMUsers),
    },
    friendlyTech: {
      ...metrics.friendlyTech,
      totalRevenue: applyOverride("friendlyTech", "totalRevenue", metrics.friendlyTech.totalRevenue),
      activeHOAClients: applyOverride("friendlyTech", "activeHOAClients", metrics.friendlyTech.activeHOAClients),
      totalSessions: applyOverride("friendlyTech", "totalSessions", metrics.friendlyTech.totalSessions),
    },
    runtimePM: {
      ...metrics.runtimePM,
      activeUsers: applyOverride("runtimePM", "activeUsers", metrics.runtimePM.activeUsers),
      monthlyRecurringRevenue: applyOverride("runtimePM", "monthlyRecurringRevenue", metrics.runtimePM.monthlyRecurringRevenue),
      totalSubscriptions: applyOverride("runtimePM", "totalSubscriptions", metrics.runtimePM.totalSubscriptions),
      totalRevenue: applyOverride("runtimePM", "totalRevenue", metrics.runtimePM.totalRevenue),
    },
  };
}

// Get all metrics for all businesses
export async function getMetrics() {
  const [elkPeakData, lifeOrganizerData, friendlyTechData, runtimePMData, overrides] =
    await Promise.all([
      getElkPeakMetrics(),
      getLifeOrganizerMetrics(),
      getFriendlyTechMetrics(),
      getRuntimePMMetrics(),
      getMetricOverrides(),
    ]);

  const metrics = {
    elkPeak: elkPeakData,
    lifeOrganizer: lifeOrganizerData,
    friendlyTech: friendlyTechData,
    runtimePM: runtimePMData,
  };

  return applyOverrides(metrics, overrides);
}

// Elk Peak Consulting Metrics
async function getElkPeakMetrics() {
  const [clients, projects, monthlyRevenue, monthlyEngagements, monthlyMRR] = await Promise.all([
    supabase.from("elk_peak_clients").select("*"),
    supabase.from("elk_peak_projects").select("*"),
    supabase.from("elk_peak_monthly_revenue").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
    supabase.from("elk_peak_monthly_engagements").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
    supabase.from("elk_peak_monthly_mrr").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
  ]);

  const activeClients = clients.data?.filter((c) => c.status === "active").length || 0;
  const recurringClients = clients.data?.filter((c) => c.status === "active" && (c.monthly_revenue || 0) > 0).length || 0;
  
  // Calculate total revenue from monthly logs
  const totalRevenue = monthlyRevenue.data?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0;
  
  // Get current month MRR from MRR logs (most recent month)
  const currentMonthMRR = monthlyMRR.data?.[0]?.mrr || 0;
  const currentMonthMRRYear = monthlyMRR.data?.[0]?.year;
  const currentMonthMRRMonth = monthlyMRR.data?.[0]?.month;
  
  // Fallback to client-based MRR if no monthly MRR logs
  const monthlyRecurringRevenue = currentMonthMRR > 0 
    ? currentMonthMRR 
    : clients.data?.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0) || 0;

  return {
    activeClients,
    recurringClients,
    totalRevenue,
    monthlyRecurringRevenue,
    currentMonthMRRYear,
    currentMonthMRRMonth,
    totalProjects: projects.data?.length || 0,
    clients: clients.data || [],
    projects: projects.data || [],
    monthlyRevenue: monthlyRevenue.data || [],
    monthlyEngagements: monthlyEngagements.data || [],
    monthlyMRR: monthlyMRR.data || [],
  };
}

// Life Organizer Guru Metrics
async function getLifeOrganizerMetrics() {
  const [kdpSales, notionSales, runtimePMUsers, monthlyRevenue] = await Promise.all([
    supabase.from("life_organizer_kdp_sales").select("*").order("date", { ascending: false }).limit(30),
    supabase.from("life_organizer_notion_sales").select("*").order("date", { ascending: false }).limit(30),
    supabase.from("runtime_pm_users").select("*"),
    supabase.from("life_organizer_monthly_revenue").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
  ]);

  // Calculate totals from monthly revenue logs
  const totalKDPRevenue = monthlyRevenue.data?.reduce((sum, m) => sum + (m.kdp_revenue || 0), 0) || 0;
  const totalNotionRevenue = monthlyRevenue.data?.reduce((sum, m) => sum + (m.notion_revenue || 0), 0) || 0;
  const totalEtsyRevenue = monthlyRevenue.data?.reduce((sum, m) => sum + (m.etsy_revenue || 0), 0) || 0;
  const totalGumroadRevenue = monthlyRevenue.data?.reduce((sum, m) => sum + (m.gumroad_revenue || 0), 0) || 0;
  const totalRevenue = totalKDPRevenue + totalNotionRevenue + totalEtsyRevenue + totalGumroadRevenue;
  
  const activeRuntimePMUsers =
    runtimePMUsers.data?.filter((u) => u.status === "active").length || 0;

  return {
    totalKDPRevenue,
    totalNotionRevenue,
    totalEtsyRevenue,
    totalGumroadRevenue,
    totalRevenue,
    activeRuntimePMUsers,
    totalKDPUnits: kdpSales.data?.reduce((sum, s) => sum + (s.units || 0), 0) || 0,
    totalNotionUnits:
      notionSales.data?.reduce((sum, s) => sum + (s.units || 0), 0) || 0,
    kdpSales: kdpSales.data || [],
    notionSales: notionSales.data || [],
    runtimePMUsers: runtimePMUsers.data || [],
    monthlyRevenue: monthlyRevenue.data || [],
  };
}

// The Friendly Tech Help Metrics
async function getFriendlyTechMetrics() {
  const [techDays, hoaClients, monthlyMetrics] = await Promise.all([
    supabase.from("friendly_tech_days").select("*").order("date", { ascending: false }),
    supabase.from("friendly_tech_hoa_clients").select("*"),
    supabase.from("friendly_tech_monthly_metrics").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
  ]);

  // Calculate total revenue from monthly logs
  const totalRevenue = monthlyMetrics.data?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0;
  const activeHOAClients =
    hoaClients.data?.filter((c) => c.status === "active").length || 0;
  const totalSessions = techDays.data?.length || 0;

  return {
    totalRevenue,
    activeHOAClients,
    totalSessions,
    techDays: techDays.data || [],
    hoaClients: hoaClients.data || [],
    monthlyMetrics: monthlyMetrics.data || [],
  };
}

// Runtime PM Metrics
async function getRuntimePMMetrics() {
  const [users, subscriptions, monthlyMetrics] = await Promise.all([
    supabase.from("runtime_pm_users").select("*"),
    supabase.from("runtime_pm_subscriptions").select("*"),
    supabase.from("runtime_pm_monthly_metrics").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
  ]);

  // Get current month values from monthly metrics, fallback to calculated
  const currentMonth = monthlyMetrics.data?.[0];
  const activeUsers = currentMonth?.active_users || users.data?.filter((u) => u.status === "active").length || 0;
  const totalSubscriptions = currentMonth?.active_subscriptions || subscriptions.data?.filter((s) => s.status === "active").length || 0;
  const monthlyRecurringRevenue = currentMonth?.revenue || subscriptions.data?.reduce((sum, s) => sum + (s.monthly_amount || 0), 0) || 0;
  
  // Calculate total revenue from monthly logs
  const totalRevenue = monthlyMetrics.data?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0;

  return {
    activeUsers,
    totalSubscriptions,
    monthlyRecurringRevenue,
    totalRevenue,
    users: users.data || [],
    subscriptions: subscriptions.data || [],
    monthlyMetrics: monthlyMetrics.data || [],
  };
}

// Quarter Goals CRUD
export async function listQuarterGoals(quarter, year) {
  const { data, error } = await supabase
    .from("quarter_goal")
    .select("*")
    .eq("quarter", quarter)
    .eq("year", year)
    .order("order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createQuarterGoal(goal) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "createQuarterGoal",
        data: goal,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to create goal");
  }

  return await response.json();
}

export async function updateQuarterGoal(id, updates) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "updateQuarterGoal",
        id,
        updates,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to update goal");
  }

  return await response.json();
}

export async function deleteQuarterGoal(id) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "deleteQuarterGoal",
        id,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to delete goal");
  }

  return await response.json();
}

// Generic CRUD helpers for business metrics
export async function createMetric(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateMetric(table, id, updates) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMetric(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// Update a business metric override (domain verification handled by edge function)
export async function updateMetricOverride(company, metricKey, value) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "updateMetricOverride",
        data: {
          company,
          metricKey,
          value,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to update metric");
  }

  return await response.json();
}

// Delete a metric override (to revert to calculated value)
export async function deleteMetricOverride(company, metricKey) {
  // For now, we'll use direct Supabase since delete isn't critical
  // But ideally should go through admin-write function
  const { error } = await supabase
    .from("business_metrics_overrides")
    .delete()
    .eq("company", company)
    .eq("metric_key", metricKey);
  if (error) throw error;
}

// Log monthly revenue for businesses
export async function logMonthlyRevenue(table, year, month, revenueData) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "logMonthlyRevenue",
        data: {
          table,
          year,
          month,
          revenueData,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to log monthly revenue");
  }

  return await response.json();
}

// Log monthly engagements for Elk Peak
export async function logMonthlyEngagements(year, month, count, notes) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "logMonthlyEngagements",
        data: {
          year,
          month,
          count,
          notes,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to log monthly engagements");
  }

  return await response.json();
}

// Log monthly MRR for Elk Peak
export async function logMonthlyMRR(year, month, mrr, notes) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "logMonthlyMRR",
        data: {
          year,
          month,
          mrr,
          notes,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to log monthly MRR");
  }

  return await response.json();
}

// Delete monthly revenue
export async function deleteMonthlyRevenue(table, year, month) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "deleteMonthlyRevenue",
        data: {
          table,
          year,
          month,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to delete monthly revenue");
  }

  return await response.json();
}

// Delete monthly engagements
export async function deleteMonthlyEngagements(year, month) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "deleteMonthlyEngagements",
        data: {
          year,
          month,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to delete monthly engagements");
  }

  return await response.json();
}

// Delete monthly MRR
export async function deleteMonthlyMRR(year, month) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        operation: "deleteMonthlyMRR",
        data: {
          year,
          month,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Failed to delete monthly MRR");
  }

  return await response.json();
}
