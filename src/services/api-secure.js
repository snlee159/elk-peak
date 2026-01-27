/**
 * SECURE API SERVICE
 * 
 * This service uses capability-based Edge Functions instead of direct Supabase access.
 * All database operations go through validated, rate-limited endpoints.
 * 
 * Architecture:
 * - NO direct supabase.from() calls
 * - All requests go through Edge Functions
 * - Edge Functions validate input, check origin, rate limit
 * - Admin operations require password in header
 */

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Store admin password in memory (cleared on page refresh for security)
let adminPassword = null;

export function setAdminPassword(password) {
  adminPassword = password;
}

export function clearAdminPassword() {
  adminPassword = null;
}

export function hasAdminPassword() {
  return adminPassword !== null;
}

/**
 * Make a request to an Edge Function
 */
async function callEdgeFunction(functionName, body = {}, requiresAdmin = false) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
  };

  // Add admin password to header if required and available
  if (requiresAdmin) {
    if (!adminPassword) {
      throw new Error("Admin authentication required");
    }
    headers["x-admin-password"] = adminPassword;
  }

  const response = await fetch(`${BASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return await response.json();
}

// ============================================
// ADMIN APIs (require admin password)
// ============================================

/**
 * Get all business metrics for dashboard
 * Endpoint: /functions/v1/public-metrics
 * Returns aggregated metrics only, no raw data
 * Requires admin authentication
 */
export async function getMetrics() {
  return await callEdgeFunction("public-metrics", {}, true);
}

/**
 * Submit contact form
 * Endpoint: /functions/v1/contact-submit
 * Validates input, rate-limited per IP
 * Stores submission in database + sends email via EmailJS (server-side)
 */
export async function submitContactForm(name, email, message, company = null) {
  return await callEdgeFunction("contact-submit", {
    name,
    email,
    message,
    company,
  });
}

/**
 * List contact submissions (admin only)
 * Endpoint: /functions/v1/admin-contacts
 */
export async function listContactSubmissions(status = null, limit = 50) {
  return await callEdgeFunction(
    "admin-contacts",
    { operation: "list", data: { status, limit } },
    true
  );
}

/**
 * Update contact submission status (admin only)
 */
export async function updateContactStatus(id, status) {
  return await callEdgeFunction(
    "admin-contacts",
    { operation: "updateStatus", data: { id, status } },
    true
  );
}

/**
 * Add notes to contact submission (admin only)
 */
export async function addContactNotes(id, notes) {
  return await callEdgeFunction(
    "admin-contacts",
    { operation: "addNotes", data: { id, notes } },
    true
  );
}

/**
 * Delete contact submission (admin only)
 */
export async function deleteContactSubmission(id) {
  return await callEdgeFunction(
    "admin-contacts",
    { operation: "delete", data: { id } },
    true
  );
}

/**
 * Verify password and get admin status
 * Endpoint: /functions/v1/auth-verify
 * Rate-limited: 10 attempts per 5 minutes per IP
 */
export async function verifyPassword(password) {
  const result = await callEdgeFunction("auth-verify", { password });
  
  if (result.valid) {
    // Store password for subsequent admin requests
    setAdminPassword(password);
  }
  
  return result;
}

/**
 * Quarter Goal Management
 * Endpoint: /functions/v1/admin-update-goal
 */
export async function createQuarterGoal(goalData) {
  return await callEdgeFunction(
    "admin-update-goal",
    { operation: "create", data: goalData },
    true
  );
}

export async function updateQuarterGoal(id, updates) {
  return await callEdgeFunction(
    "admin-update-goal",
    { operation: "update", data: { id, updates } },
    true
  );
}

export async function deleteQuarterGoal(id) {
  return await callEdgeFunction(
    "admin-update-goal",
    { operation: "delete", data: { id } },
    true
  );
}

/**
 * Monthly Metrics Logging
 * Endpoint: /functions/v1/admin-log-metrics
 */
export async function logElkPeakRevenue(year, month, revenue, notes = null) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logElkPeakRevenue",
      data: { year, month, revenue, notes },
    },
    true
  );
}

export async function logElkPeakMRR(year, month, mrr, notes = null) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logElkPeakMRR",
      data: { year, month, mrr, notes },
    },
    true
  );
}

export async function logElkPeakEngagements(year, month, count, notes = null) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logElkPeakEngagements",
      data: { year, month, count, notes },
    },
    true
  );
}

export async function logLifeOrganizerRevenue(
  year,
  month,
  kdp_revenue = 0,
  notion_revenue = 0,
  etsy_revenue = 0,
  gumroad_revenue = 0,
  notes = null
) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logLifeOrganizerRevenue",
      data: {
        year,
        month,
        kdp_revenue,
        notion_revenue,
        etsy_revenue,
        gumroad_revenue,
        notes,
      },
    },
    true
  );
}

export async function logFriendlyTechMetrics(year, month, revenue, tech_days, notes = null) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logFriendlyTechMetrics",
      data: { year, month, revenue, tech_days, notes },
    },
    true
  );
}

export async function logRuntimePMMetrics(
  year,
  month,
  active_users,
  revenue,
  active_subscriptions,
  notes = null
) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "logRuntimePMMetrics",
      data: {
        year,
        month,
        active_users,
        revenue,
        active_subscriptions,
        notes,
      },
    },
    true
  );
}

export async function deleteMonthlyLog(table, year, month) {
  return await callEdgeFunction(
    "admin-log-metrics",
    {
      operation: "deleteMonthlyLog",
      data: { table, year, month },
    },
    true
  );
}

/**
 * Business Data Management (CRUD)
 * Endpoint: /functions/v1/admin-manage-data
 * 
 * Allowed tables:
 * - elk_peak_clients
 * - elk_peak_projects
 * - life_organizer_kdp_sales
 * - life_organizer_notion_sales
 * - friendly_tech_days
 * - friendly_tech_hoa_clients
 * - runtime_pm_users
 * - runtime_pm_subscriptions
 */
export async function createRecord(table, data) {
  return await callEdgeFunction(
    "admin-manage-data",
    { operation: "create", table, data },
    true
  );
}

export async function updateRecord(table, id, data) {
  return await callEdgeFunction(
    "admin-manage-data",
    { operation: "update", table, id, data },
    true
  );
}

export async function deleteRecord(table, id) {
  return await callEdgeFunction(
    "admin-manage-data",
    { operation: "delete", table, id },
    true
  );
}

// Convenience functions for common operations
export async function createClient(clientData) {
  return createRecord("elk_peak_clients", clientData);
}

export async function updateClient(id, updates) {
  return updateRecord("elk_peak_clients", id, updates);
}

export async function deleteClient(id) {
  return deleteRecord("elk_peak_clients", id);
}

export async function createProject(projectData) {
  return createRecord("elk_peak_projects", projectData);
}

export async function updateProject(id, updates) {
  return updateRecord("elk_peak_projects", id, updates);
}

export async function deleteProject(id) {
  return deleteRecord("elk_peak_projects", id);
}

// ============================================
// Legacy compatibility layer (for gradual migration)
// ============================================
// These functions maintain the same interface as the old API
// but use the new secure endpoints under the hood

export async function listQuarterGoals(quarter, year) {
  return await callEdgeFunction(
    "admin-manage-data",
    {
      operation: "list",
      table: "quarter_goal",
      filters: { quarter, year },
    },
    true
  );
}

export async function createMetric(table, data) {
  return createRecord(table, data);
}

export async function updateMetric(table, id, updates) {
  return updateRecord(table, id, updates);
}

export async function deleteMetric(table, id) {
  return deleteRecord(table, id);
}

export async function logMonthlyRevenue(table, year, month, revenueData) {
  // Route to appropriate endpoint based on table
  if (table === "elk_peak_monthly_revenue") {
    return logElkPeakRevenue(year, month, revenueData.revenue, revenueData.notes);
  } else if (table === "life_organizer_monthly_revenue") {
    return logLifeOrganizerRevenue(
      year,
      month,
      revenueData.kdp_revenue,
      revenueData.notion_revenue,
      revenueData.etsy_revenue,
      revenueData.gumroad_revenue,
      revenueData.notes
    );
  } else if (table === "friendly_tech_monthly_metrics") {
    return logFriendlyTechMetrics(
      year,
      month,
      revenueData.revenue,
      revenueData.tech_days,
      revenueData.notes
    );
  } else if (table === "runtime_pm_monthly_metrics") {
    return logRuntimePMMetrics(
      year,
      month,
      revenueData.active_users,
      revenueData.revenue,
      revenueData.active_subscriptions,
      revenueData.notes
    );
  }
  throw new Error(`Unsupported table: ${table}`);
}

export async function logMonthlyEngagements(year, month, count, notes) {
  return logElkPeakEngagements(year, month, count, notes);
}

export async function logMonthlyMRR(year, month, mrr, notes) {
  return logElkPeakMRR(year, month, mrr, notes);
}

export async function deleteMonthlyRevenue(table, year, month) {
  return deleteMonthlyLog(table, year, month);
}

export async function deleteMonthlyEngagements(year, month) {
  return deleteMonthlyLog("elk_peak_monthly_engagements", year, month);
}

export async function deleteMonthlyMRR(year, month) {
  return deleteMonthlyLog("elk_peak_monthly_mrr", year, month);
}

export async function updateMetricOverride(company, metricKey, value) {
  // Check if override already exists
  const existing = await callEdgeFunction(
    "admin-manage-data",
    {
      operation: "list",
      table: "business_metrics_overrides",
      filters: { company, metric_key: metricKey },
    },
    true
  );

  if (existing && existing.length > 0) {
    // Update existing override
    return await callEdgeFunction(
      "admin-manage-data",
      {
        operation: "update",
        table: "business_metrics_overrides",
        id: existing[0].id,
        data: { value, updated_at: new Date().toISOString() },
      },
      true
    );
  } else {
    // Create new override
    return await callEdgeFunction(
      "admin-manage-data",
      {
        operation: "create",
        table: "business_metrics_overrides",
        data: { company, metric_key: metricKey, value },
      },
      true
    );
  }
}

export async function deleteMetricOverride(company, metricKey) {
  // Find the override first
  const existing = await callEdgeFunction(
    "admin-manage-data",
    {
      operation: "list",
      table: "business_metrics_overrides",
      filters: { company, metric_key: metricKey },
    },
    true
  );

  if (existing && existing.length > 0) {
    // Delete the override
    return await callEdgeFunction(
      "admin-manage-data",
      {
        operation: "delete",
        table: "business_metrics_overrides",
        id: existing[0].id,
      },
      true
    );
  }

  return { success: true }; // Already doesn't exist
}
