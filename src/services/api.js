import { supabase } from "@/lib/supabase";

// Admin auth function - must be called before any data access
export async function adminAuth(password) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
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
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }
    const errorMessage =
      error.message || error.error || error.details || "Authentication failed";
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
      monthlyRecurringRevenue: applyOverride("elkPeak", "monthlyRecurringRevenue", metrics.elkPeak.monthlyRecurringRevenue),
      totalRevenue: applyOverride("elkPeak", "totalRevenue", metrics.elkPeak.totalRevenue),
      totalProjects: applyOverride("elkPeak", "totalProjects", metrics.elkPeak.totalProjects),
    },
    lifeOrganizer: {
      ...metrics.lifeOrganizer,
      totalKDPRevenue: applyOverride("lifeOrganizer", "totalKDPRevenue", metrics.lifeOrganizer.totalKDPRevenue),
      totalNotionRevenue: applyOverride("lifeOrganizer", "totalNotionRevenue", metrics.lifeOrganizer.totalNotionRevenue),
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
  const { data: clients } = await supabase
    .from("elk_peak_clients")
    .select("*");

  const { data: projects } = await supabase
    .from("elk_peak_projects")
    .select("*");

  const activeClients = clients?.filter((c) => c.status === "active").length || 0;
  const totalRevenue =
    projects?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0;
  const monthlyRecurringRevenue =
    clients?.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0) || 0;

  return {
    activeClients,
    totalRevenue,
    monthlyRecurringRevenue,
    totalProjects: projects?.length || 0,
    clients: clients || [],
    projects: projects || [],
  };
}

// Life Organizer Guru Metrics
async function getLifeOrganizerMetrics() {
  const { data: kdpSales } = await supabase
    .from("life_organizer_kdp_sales")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  const { data: notionSales } = await supabase
    .from("life_organizer_notion_sales")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  const { data: runtimePMUsers } = await supabase
    .from("runtime_pm_users")
    .select("*");

  const totalKDPRevenue =
    kdpSales?.reduce((sum, s) => sum + (s.revenue || 0), 0) || 0;
  const totalNotionRevenue =
    notionSales?.reduce((sum, s) => sum + (s.revenue || 0), 0) || 0;
  const activeRuntimePMUsers =
    runtimePMUsers?.filter((u) => u.status === "active").length || 0;

  return {
    totalKDPRevenue,
    totalNotionRevenue,
    activeRuntimePMUsers,
    totalKDPUnits: kdpSales?.reduce((sum, s) => sum + (s.units || 0), 0) || 0,
    totalNotionUnits:
      notionSales?.reduce((sum, s) => sum + (s.units || 0), 0) || 0,
    kdpSales: kdpSales || [],
    notionSales: notionSales || [],
    runtimePMUsers: runtimePMUsers || [],
  };
}

// The Friendly Tech Help Metrics
async function getFriendlyTechMetrics() {
  const { data: techDays } = await supabase
    .from("friendly_tech_days")
    .select("*")
    .order("date", { ascending: false });

  const { data: hoaClients } = await supabase
    .from("friendly_tech_hoa_clients")
    .select("*");

  const totalRevenue =
    techDays?.reduce((sum, t) => sum + (t.revenue || 0), 0) || 0;
  const activeHOAClients =
    hoaClients?.filter((c) => c.status === "active").length || 0;
  const totalSessions = techDays?.length || 0;

  return {
    totalRevenue,
    activeHOAClients,
    totalSessions,
    techDays: techDays || [],
    hoaClients: hoaClients || [],
  };
}

// Runtime PM Metrics
async function getRuntimePMMetrics() {
  const { data: users } = await supabase.from("runtime_pm_users").select("*");

  const { data: subscriptions } = await supabase
    .from("runtime_pm_subscriptions")
    .select("*");

  const activeUsers = users?.filter((u) => u.status === "active").length || 0;
  const totalSubscriptions =
    subscriptions?.filter((s) => s.status === "active").length || 0;
  const monthlyRecurringRevenue =
    subscriptions?.reduce((sum, s) => sum + (s.monthly_amount || 0), 0) || 0;

  return {
    activeUsers,
    totalSubscriptions,
    monthlyRecurringRevenue,
    users: users || [],
    subscriptions: subscriptions || [],
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
  const password = getAdminPassword();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        password,
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
  const password = getAdminPassword();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        password,
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
  const password = getAdminPassword();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        password,
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

// Get admin password from session storage
function getAdminPassword() {
  const authData = sessionStorage.getItem("elkPeakAuth");
  if (!authData) {
    throw new Error("Not authenticated");
  }
  const parsed = JSON.parse(authData);
  if (!parsed.password) {
    throw new Error("Password not found in session");
  }
  return parsed.password;
}

// Update a business metric override (requires admin authentication)
export async function updateMetricOverride(company, metricKey, value) {
  const password = getAdminPassword();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        password,
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
