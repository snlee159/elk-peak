import React, { useState, useEffect } from "react";
import { Card, CardTitle, CardBody } from "@/catalyst/card";
import { Button } from "@/catalyst/button";
import { Text, Heading, Input, Field, Label } from "@/catalyst";
import { Dialog } from "@/catalyst/dialog";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getMetrics,
  listQuarterGoals,
  createQuarterGoal,
  updateQuarterGoal,
  deleteQuarterGoal,
  updateMetricOverride,
  deleteMetricOverride,
  logMonthlyRevenue,
  logMonthlyEngagements,
  logMonthlyMRR,
  deleteMonthlyRevenue,
  deleteMonthlyEngagements,
  deleteMonthlyMRR,
} from "@/services/api-secure";

export default function MetricsDashboard({ isAdmin = false }) {
  const [metrics, setMetrics] = useState({
    elkPeak: {},
    lifeOrganizer: {},
    friendlyTech: {},
    runtimePM: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [quarterGoals, setQuarterGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editingMetric, setEditingMetric] = useState(null);
  const [metricEditValue, setMetricEditValue] = useState("");
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueModalData, setRevenueModalData] = useState({});
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [engagementModalData, setEngagementModalData] = useState({});

  useEffect(() => {
    // Only fetch data if admin authenticated
    if (isAdmin) {
      fetchMetrics();
      fetchQuarterGoals();
    }
  }, [isAdmin]);

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return { quarter, year: now.getFullYear() };
  };

  const fetchQuarterGoals = async () => {
    try {
      const { quarter, year } = getCurrentQuarter();
      const data = await listQuarterGoals(quarter, year);

      const sortedGoals = (data || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((goal) => {
          let currentValue = goal.current_value || 0;
          // Auto-calculate based on metric type
          if (goal.metric_type === "elk_peak_mrr") {
            currentValue = metrics.elkPeak.monthlyRecurringRevenue || 0;
          } else if (goal.metric_type === "life_organizer_revenue") {
            currentValue = metrics.lifeOrganizer.totalRevenue || 0;
          } else if (goal.metric_type === "friendly_tech_revenue") {
            currentValue = metrics.friendlyTech.totalRevenue || 0;
          } else if (goal.metric_type === "runtime_pm_users") {
            currentValue = metrics.runtimePM.activeUsers || 0;
          } else if (goal.metric_type === "runtime_pm_mrr") {
            currentValue = metrics.runtimePM.monthlyRecurringRevenue || 0;
          }
          return { ...goal, currentValue };
        });

      setQuarterGoals(sortedGoals);
    } catch (error) {
      console.error("Error fetching quarter goals:", error);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchQuarterGoals();
    }
  }, [metrics, isLoading]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await getMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Failed to load metrics data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value || 0);
  };

  const handleSaveGoal = async () => {
    try {
      const { quarter, year } = getCurrentQuarter();

      if (editingGoal) {
        // Update - only send mutable fields (immutable: id, quarter, year, metric_type)
        const updates = {
          name: editValues.goalName || "",
          target_value: parseFloat(editValues.targetValue) || 0,
          current_value: parseFloat(editValues.currentValue) || 0,
          order: parseInt(editValues.order) || 0,
        };
        await updateQuarterGoal(editingGoal.id, updates);
        toast.success("Goal updated");
      } else {
        // Create - send all fields
        const goalData = {
          name: editValues.goalName || "",
          target_value: parseFloat(editValues.targetValue) || 0,
          current_value: parseFloat(editValues.currentValue) || 0,
          quarter,
          year,
          metric_type: editValues.metricType || "custom",
          order: parseInt(editValues.order) || 0,
        };
        await createQuarterGoal(goalData);
        toast.success("Goal added");
      }

      setShowGoalModal(false);
      setEditingGoal(null);
      setEditValues({});
      fetchQuarterGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      const errorMessage = error.message || "Failed to save goal";
      toast.error(errorMessage);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteQuarterGoal(id);
      toast.success("Goal deleted");
      fetchQuarterGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      const errorMessage = error.message || "Failed to delete goal";
      toast.error(errorMessage);
    }
  };

  const openGoalModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setEditValues({
        goalName: goal.name || "",
        targetValue: goal.target_value || 0,
        currentValue: goal.currentValue || goal.current_value || 0,
        metricType: goal.metric_type || "custom",
        order: goal.order || 0,
      });
    } else {
      setEditingGoal(null);
      setEditValues({
        metricType: "custom",
        order: quarterGoals.length,
      });
    }
    setShowGoalModal(true);
  };

  const getQuarterLabel = () => {
    const { quarter, year } = getCurrentQuarter();
    return `Q${quarter} ${year}`;
  };

  const handleSaveMetric = async (company, metricKey) => {
    try {
      const value = parseFloat(metricEditValue);
      if (isNaN(value)) {
        toast.error("Please enter a valid number");
        return;
      }

      // Special handling for MRR - log it for the current month instead of overriding
      if (company === "elkPeak" && metricKey === "monthlyRecurringRevenue") {
        const now = new Date();
        const year = metrics.elkPeak.currentMonthMRRYear || now.getFullYear();
        const month =
          metrics.elkPeak.currentMonthMRRMonth || now.getMonth() + 1;
        await logMonthlyMRR(year, month, value, "");
        toast.success("MRR logged for current month");
      } else {
        await updateMetricOverride(company, metricKey, value);
        toast.success("Metric updated");
      }

      setEditingMetric(null);
      setMetricEditValue("");
      fetchMetrics();
    } catch (error) {
      console.error("Error updating metric:", error);
      const errorMessage = error.message || "Failed to update metric";
      toast.error(errorMessage);
      // If password is missing, don't reload - just show the error
      // User can refresh manually if needed
    }
  };

  const handleStartEdit = (company, metricKey, currentValue) => {
    setEditingMetric(`${company}:${metricKey}`);
    setMetricEditValue(currentValue.toString());
  };

  const openRevenueModal = (business, year = null, month = null) => {
    const now = new Date();
    const selectedYear = year || now.getFullYear();
    const selectedMonth = month || now.getMonth() + 1;

    // Check if data already exists for this month/year
    let existingData = {};

    if (business === "elkPeak") {
      // Check for revenue data
      if (metrics.elkPeak.monthlyRevenue) {
        const existing = metrics.elkPeak.monthlyRevenue.find(
          (m) => m.year === selectedYear && m.month === selectedMonth,
        );
        if (existing) {
          existingData.revenue = existing.revenue || 0;
          existingData.revenueNotes = existing.notes || "";
        }
      }
      // Check for engagement data
      if (metrics.elkPeak.monthlyEngagements) {
        const existing = metrics.elkPeak.monthlyEngagements.find(
          (m) => m.year === selectedYear && m.month === selectedMonth,
        );
        if (existing) {
          existingData.engagementCount = existing.count || 0;
          // Use engagement notes if revenue notes don't exist
          if (!existingData.notes) {
            existingData.notes = existing.notes || "";
          }
        }
      }
    } else if (
      business === "lifeOrganizer" &&
      metrics.lifeOrganizer.monthlyRevenue
    ) {
      const existing = metrics.lifeOrganizer.monthlyRevenue.find(
        (m) => m.year === selectedYear && m.month === selectedMonth,
      );
      if (existing) {
        existingData = {
          kdp_revenue: existing.kdp_revenue || 0,
          notion_revenue: existing.notion_revenue || 0,
          etsy_revenue: existing.etsy_revenue || 0,
          gumroad_revenue: existing.gumroad_revenue || 0,
          notes: existing.notes || "",
        };
      }
    } else if (
      business === "friendlyTech" &&
      metrics.friendlyTech.monthlyMetrics
    ) {
      const existing = metrics.friendlyTech.monthlyMetrics.find(
        (m) => m.year === selectedYear && m.month === selectedMonth,
      );
      if (existing) {
        existingData = {
          revenue: existing.revenue || 0,
          tech_days: existing.tech_days || 0,
          notes: existing.notes || "",
        };
      }
    } else if (business === "runtimePM" && metrics.runtimePM.monthlyMetrics) {
      const existing = metrics.runtimePM.monthlyMetrics.find(
        (m) => m.year === selectedYear && m.month === selectedMonth,
      );
      if (existing) {
        existingData = {
          active_users: existing.active_users || 0,
          revenue: existing.revenue || 0,
          active_subscriptions: existing.active_subscriptions || 0,
          notes: existing.notes || "",
        };
      }
    }

    setRevenueModalData({
      business,
      year: selectedYear,
      month: selectedMonth,
      revenue: existingData.revenue || 0,
      engagementCount: existingData.engagementCount || 0,
      kdp_revenue: existingData.kdp_revenue || 0,
      notion_revenue: existingData.notion_revenue || 0,
      etsy_revenue: existingData.etsy_revenue || 0,
      gumroad_revenue: existingData.gumroad_revenue || 0,
      tech_days: existingData.tech_days || 0,
      active_users: existingData.active_users || 0,
      active_subscriptions: existingData.active_subscriptions || 0,
      notes: existingData.notes || "",
    });
    setShowRevenueModal(true);
  };

  const openEngagementModal = (year = null, month = null) => {
    const now = new Date();
    const selectedYear = year || now.getFullYear();
    const selectedMonth = month || now.getMonth() + 1;

    // Check if data already exists for this month/year
    let existingData = {};
    if (metrics.elkPeak.monthlyEngagements) {
      const existing = metrics.elkPeak.monthlyEngagements.find(
        (m) => m.year === selectedYear && m.month === selectedMonth,
      );
      if (existing) {
        existingData = {
          count: existing.count || 0,
          notes: existing.notes || "",
        };
      }
    }

    setEngagementModalData({
      year: selectedYear,
      month: selectedMonth,
      count: existingData.count || 0,
      notes: existingData.notes || "",
    });
    setShowEngagementModal(true);
  };

  const handleSaveRevenue = async () => {
    try {
      const { business, year, month, engagementCount, ...revenueData } =
        revenueModalData;
      let table;

      if (business === "elkPeak") {
        table = "elk_peak_monthly_revenue";
        // Save revenue
        await logMonthlyRevenue(table, year, month, revenueData);
        // Save engagements if provided (use same notes field)
        if (engagementCount !== undefined) {
          await logMonthlyEngagements(
            year,
            month,
            engagementCount || 0,
            revenueData.notes || "",
          );
        }
        toast.success("Monthly metrics logged successfully");
      } else if (business === "lifeOrganizer") {
        table = "life_organizer_monthly_revenue";
        await logMonthlyRevenue(table, year, month, revenueData);
        toast.success("Monthly revenue logged successfully");
      } else if (business === "friendlyTech") {
        table = "friendly_tech_monthly_metrics";
        await logMonthlyRevenue(table, year, month, revenueData);
        toast.success("Monthly metrics logged successfully");
      } else if (business === "runtimePM") {
        table = "runtime_pm_monthly_metrics";
        await logMonthlyRevenue(table, year, month, revenueData);
        toast.success("Monthly metrics logged successfully");
      }

      setShowRevenueModal(false);
      setRevenueModalData({});
      fetchMetrics();
    } catch (error) {
      console.error("Error saving metrics:", error);
      toast.error(error.message || "Failed to save metrics");
    }
  };

  const handleSaveEngagement = async () => {
    try {
      const { year, month, count, notes } = engagementModalData;
      await logMonthlyEngagements(year, month, count, notes);
      toast.success("Monthly engagements logged successfully");
      setShowEngagementModal(false);
      setEngagementModalData({});
      fetchMetrics();
    } catch (error) {
      console.error("Error saving engagement:", error);
      toast.error(error.message || "Failed to save engagement");
    }
  };

  const formatMonthLabel = (year, month) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteRevenue = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the metrics entry for ${formatMonthLabel(revenueModalData.year, revenueModalData.month)}?`,
      )
    ) {
      return;
    }

    try {
      const { business, year, month } = revenueModalData;
      let table;

      if (business === "elkPeak") {
        table = "elk_peak_monthly_revenue";
        // Delete both revenue and engagements for Elk Peak
        await deleteMonthlyRevenue(table, year, month);
        await deleteMonthlyEngagements(year, month);
        toast.success("Monthly metrics deleted successfully");
      } else if (business === "lifeOrganizer") {
        table = "life_organizer_monthly_revenue";
        await deleteMonthlyRevenue(table, year, month);
        toast.success("Monthly revenue deleted successfully");
      } else if (business === "friendlyTech") {
        table = "friendly_tech_monthly_metrics";
        await deleteMonthlyRevenue(table, year, month);
        toast.success("Monthly metrics deleted successfully");
      } else if (business === "runtimePM") {
        table = "runtime_pm_monthly_metrics";
        await deleteMonthlyRevenue(table, year, month);
        toast.success("Monthly metrics deleted successfully");
      }

      setShowRevenueModal(false);
      setRevenueModalData({});
      fetchMetrics();
    } catch (error) {
      console.error("Error deleting metrics:", error);
      toast.error(error.message || "Failed to delete metrics");
    }
  };

  const handleDeleteEngagement = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the engagement entry for ${formatMonthLabel(engagementModalData.year, engagementModalData.month)}?`,
      )
    ) {
      return;
    }

    try {
      const { year, month } = engagementModalData;
      await deleteMonthlyEngagements(year, month);
      toast.success("Monthly engagements deleted successfully");
      setShowEngagementModal(false);
      setEngagementModalData({});
      fetchMetrics();
    } catch (error) {
      console.error("Error deleting engagement:", error);
      toast.error(error.message || "Failed to delete engagement");
    }
  };

  const getMonthName = (monthNumber) => {
    const date = new Date(2000, monthNumber - 1);
    return date.toLocaleDateString("en-US", { month: "long" });
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));

  const prepareChartData = (monthlyData, valueKey) => {
    if (!monthlyData || monthlyData.length === 0) return [];
    return monthlyData
      .slice()
      .reverse()
      .map((item) => ({
        month: formatMonthLabel(item.year, item.month),
        value: item[valueKey] || 0,
      }));
  };

  const prepareMultiSeriesChartData = (monthlyData, keys) => {
    if (!monthlyData || monthlyData.length === 0) return [];
    return monthlyData
      .slice()
      .reverse()
      .map((item) => {
        const data = {
          month: formatMonthLabel(item.year, item.month),
        };
        keys.forEach((key) => {
          data[key] = item[key] || 0;
        });
        // Calculate total if this is Life Organizer data
        if (
          keys.includes("kdp_revenue") &&
          keys.includes("notion_revenue") &&
          keys.includes("etsy_revenue") &&
          keys.includes("gumroad_revenue")
        ) {
          data.total =
            (item.kdp_revenue || 0) +
            (item.notion_revenue || 0) +
            (item.etsy_revenue || 0) +
            (item.gumroad_revenue || 0);
        }
        return data;
      });
  };

  if (isLoading) {
    return (
      <div className="h-svh flex justify-center items-center">
        <Text>Loading dashboard...</Text>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Heading>Elk Peak Consulting Metrics Dashboard</Heading>
            <Text className="mt-2 text-zinc-500 dark:text-zinc-400">
              Track performance across all businesses
            </Text>
          </div>
        </div>

        {/* Quarter Goals Section */}
        <Card className="mb-6 w-full !max-w-none" style={{ maxWidth: "100%" }}>
          <CardTitle className="flex justify-between items-center mb-4">
            <span>Current Quarter Goals ({getQuarterLabel()})</span>
            {isAdmin && (
              <Button
                onClick={() => openGoalModal()}
                outline
                className="text-xs ml-4"
              >
                Add Goal
              </Button>
            )}
          </CardTitle>
          <CardBody>
            {quarterGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quarterGoals.map((goal) => {
                  const progress = Math.min(
                    (goal.currentValue / goal.target_value) * 100,
                    100,
                  );
                  const isComplete = goal.currentValue >= goal.target_value;
                  return (
                    <div
                      key={goal.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-zinc-950 dark:text-white">
                          {goal.name}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => openGoalModal(goal)}
                              outline
                              className="text-xs px-2 py-1"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteGoal(goal.id)}
                              outline
                              className="text-xs px-2 py-1 text-red-600"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {goal.metric_type?.includes("revenue") ||
                            goal.metric_type?.includes("mrr")
                              ? formatCurrency(goal.currentValue)
                              : formatNumber(goal.currentValue)}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {goal.metric_type?.includes("revenue") ||
                            goal.metric_type?.includes("mrr")
                              ? formatCurrency(goal.target_value)
                              : formatNumber(goal.target_value)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete
                                ? "bg-green-500"
                                : progress >= 75
                                  ? "bg-teal-500"
                                  : progress >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Text className="text-zinc-500 dark:text-zinc-400">
                No goals set for this quarter.
                {isAdmin && " Click 'Add Goal' to create one."}
              </Text>
            )}
          </CardBody>
        </Card>

        {/* Business Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Elk Peak Consulting */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle className="flex justify-between items-center">
              <span>Elk Peak Consulting</span>
              {isAdmin && (
                <Button
                  onClick={() => openRevenueModal("elkPeak")}
                  outline
                  className="text-xs ml-6"
                >
                  Log Monthly Metrics
                </Button>
              )}
            </CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.activeClients || 0}
                  label="Number of Clients"
                  formatValue={formatNumber}
                  company="elkPeak"
                  metricKey="activeClients"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.recurringClients || 0}
                  label="Number of Recurring Clients"
                  formatValue={formatNumber}
                  company="elkPeak"
                  metricKey="recurringClients"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.monthlyRecurringRevenue || 0}
                  label={`Current MRR${metrics.elkPeak.currentMonthMRRYear && metrics.elkPeak.currentMonthMRRMonth ? ` (${formatMonthLabel(metrics.elkPeak.currentMonthMRRYear, metrics.elkPeak.currentMonthMRRMonth)})` : ""}`}
                  formatValue={formatCurrency}
                  company="elkPeak"
                  metricKey="monthlyRecurringRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <div>
                  <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(metrics.elkPeak.totalRevenue || 0)}
                  </div>
                  <Text className="text-sm">Total Revenue</Text>
                </div>
                {metrics.elkPeak.monthlyRevenue &&
                  metrics.elkPeak.monthlyRevenue.length > 0 && (
                    <div className="mt-4">
                      <Text className="text-sm font-semibold mb-2">
                        Monthly Revenue
                      </Text>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={prepareChartData(
                            metrics.elkPeak.monthlyRevenue,
                            "revenue",
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                {metrics.elkPeak.monthlyMRR &&
                  metrics.elkPeak.monthlyMRR.length > 0 && (
                    <div className="mt-4">
                      <Text className="text-sm font-semibold mb-2">
                        Monthly MRR
                      </Text>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={prepareChartData(
                            metrics.elkPeak.monthlyMRR,
                            "mrr",
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#82ca9d"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                {metrics.elkPeak.monthlyEngagements &&
                  metrics.elkPeak.monthlyEngagements.length > 0 && (
                    <div className="mt-4">
                      <Text className="text-sm font-semibold mb-2">
                        One-Off Engagements per Month
                      </Text>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={prepareChartData(
                            metrics.elkPeak.monthlyEngagements,
                            "count",
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </div>
            </CardBody>
          </Card>

          {/* Life Organizer Guru */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle className="flex justify-between items-center">
              <span>Life Organizer Guru</span>
              {isAdmin && (
                <Button
                  onClick={() => openRevenueModal("lifeOrganizer")}
                  outline
                  className="text-xs ml-6"
                >
                  Log Monthly Metrics
                </Button>
              )}
            </CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(metrics.lifeOrganizer.totalRevenue || 0)}
                  </div>
                  <Text className="text-sm">Total Revenue</Text>
                </div>
                <div>
                  <Text className="text-sm font-semibold mb-2">
                    Revenue Breakdown
                  </Text>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>KDP Revenue:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          metrics.lifeOrganizer.totalKDPRevenue || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notion Templates:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          metrics.lifeOrganizer.totalNotionRevenue || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Etsy Revenue:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          metrics.lifeOrganizer.totalEtsyRevenue || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gumroad Revenue:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          metrics.lifeOrganizer.totalGumroadRevenue || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                {metrics.lifeOrganizer.monthlyRevenue &&
                  metrics.lifeOrganizer.monthlyRevenue.length > 0 && (
                    <div className="mt-4">
                      <Text className="text-sm font-semibold mb-2">
                        Monthly Revenue by Source
                      </Text>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={prepareMultiSeriesChartData(
                            metrics.lifeOrganizer.monthlyRevenue,
                            [
                              "kdp_revenue",
                              "notion_revenue",
                              "etsy_revenue",
                              "gumroad_revenue",
                            ],
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="kdp_revenue"
                            stroke="#8884d8"
                            strokeWidth={2}
                            name="KDP"
                          />
                          <Line
                            type="monotone"
                            dataKey="notion_revenue"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            name="Notion"
                          />
                          <Line
                            type="monotone"
                            dataKey="etsy_revenue"
                            stroke="#ffc658"
                            strokeWidth={2}
                            name="Etsy"
                          />
                          <Line
                            type="monotone"
                            dataKey="gumroad_revenue"
                            stroke="#ff7300"
                            strokeWidth={2}
                            name="Gumroad"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#000000"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            name="Total Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </div>
            </CardBody>
          </Card>

          {/* The Friendly Tech Help */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle className="flex justify-between items-center">
              <span>The Friendly Tech Help</span>
              {isAdmin && (
                <Button
                  onClick={() => openRevenueModal("friendlyTech")}
                  outline
                  className="text-xs ml-6"
                >
                  Log Monthly Metrics
                </Button>
              )}
            </CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(metrics.friendlyTech.totalRevenue || 0)}
                  </div>
                  <Text className="text-sm">Total Revenue</Text>
                </div>
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.friendlyTech.activeHOAClients || 0}
                  label="Number of Active HOA Clients"
                  formatValue={formatNumber}
                  company="friendlyTech"
                  metricKey="activeHOAClients"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                {metrics.friendlyTech.monthlyMetrics &&
                  metrics.friendlyTech.monthlyMetrics.length > 0 && (
                    <>
                      <div>
                        <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                          {formatNumber(
                            metrics.friendlyTech.monthlyMetrics[0].tech_days ||
                              0,
                          )}
                        </div>
                        <Text className="text-sm">
                          Tech Days This Month (
                          {formatMonthLabel(
                            metrics.friendlyTech.monthlyMetrics[0].year,
                            metrics.friendlyTech.monthlyMetrics[0].month,
                          )}
                          )
                        </Text>
                      </div>
                      <div className="mt-4">
                        <Text className="text-sm font-semibold mb-2">
                          Monthly Revenue
                        </Text>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart
                            data={prepareChartData(
                              metrics.friendlyTech.monthlyMetrics,
                              "revenue",
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#8884d8"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <Text className="text-sm font-semibold mb-2">
                          Tech Days per Month
                        </Text>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={prepareChartData(
                              metrics.friendlyTech.monthlyMetrics,
                              "tech_days",
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
              </div>
            </CardBody>
          </Card>

          {/* Runtime PM */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle className="flex justify-between items-center">
              <span>Runtime PM</span>
              {isAdmin && (
                <Button
                  onClick={() => openRevenueModal("runtimePM")}
                  outline
                  className="text-xs ml-6"
                >
                  Log Monthly Metrics
                </Button>
              )}
            </CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(metrics.runtimePM.totalRevenue || 0)}
                  </div>
                  <Text className="text-sm">Total Revenue</Text>
                </div>
                {metrics.runtimePM.monthlyMetrics &&
                  metrics.runtimePM.monthlyMetrics.length > 0 && (
                    <>
                      <div className="mt-4">
                        <Text className="text-sm font-semibold mb-2">
                          Active Users by Month
                        </Text>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart
                            data={prepareChartData(
                              metrics.runtimePM.monthlyMetrics,
                              "active_users",
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#8884d8"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <Text className="text-sm font-semibold mb-2">
                          Monthly Revenue
                        </Text>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart
                            data={prepareChartData(
                              metrics.runtimePM.monthlyMetrics,
                              "revenue",
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#82ca9d"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <Text className="text-sm font-semibold mb-2">
                          Active Subscriptions per Month
                        </Text>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={prepareChartData(
                              metrics.runtimePM.monthlyMetrics,
                              "active_subscriptions",
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Goal Modal */}
        <Dialog open={showGoalModal} onClose={() => setShowGoalModal(false)}>
          <div className="p-6">
            <Heading className="mb-4">
              {editingGoal ? "Edit Goal" : "Add Goal"}
            </Heading>
            <div className="space-y-4">
              <Field>
                <Label>Goal Name</Label>
                <Input
                  value={editValues.goalName || ""}
                  onChange={(e) =>
                    setEditValues({ ...editValues, goalName: e.target.value })
                  }
                  placeholder="e.g., Reach $10K MRR"
                />
              </Field>
              <Field>
                <Label>Metric Type</Label>
                <select
                  value={editValues.metricType || "custom"}
                  onChange={(e) =>
                    setEditValues({ ...editValues, metricType: e.target.value })
                  }
                  className="w-full rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2"
                >
                  <option value="elk_peak_mrr">
                    Elk Peak MRR (Auto-calculated)
                  </option>
                  <option value="life_organizer_revenue">
                    Life Organizer Revenue (Auto-calculated)
                  </option>
                  <option value="friendly_tech_revenue">
                    Friendly Tech Revenue (Auto-calculated)
                  </option>
                  <option value="runtime_pm_users">
                    Runtime PM Users (Auto-calculated)
                  </option>
                  <option value="runtime_pm_mrr">
                    Runtime PM MRR (Auto-calculated)
                  </option>
                  <option value="custom">Custom (Manual)</option>
                </select>
              </Field>
              <Field>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={editValues.targetValue || 0}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      targetValue: e.target.value,
                    })
                  }
                />
              </Field>
              {editValues.metricType === "custom" && (
                <Field>
                  <Label>Current Value</Label>
                  <Input
                    type="number"
                    value={editValues.currentValue || 0}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        currentValue: e.target.value,
                      })
                    }
                  />
                </Field>
              )}
              <Field>
                <Label>Order (for sorting)</Label>
                <Input
                  type="number"
                  value={editValues.order || 0}
                  onChange={(e) =>
                    setEditValues({ ...editValues, order: e.target.value })
                  }
                />
              </Field>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowGoalModal(false)} outline>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal}>Save</Button>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Monthly Revenue Modal */}
        <Dialog
          open={showRevenueModal}
          onClose={() => setShowRevenueModal(false)}
        >
          <div className="p-6">
            <Heading className="mb-4">
              {revenueModalData.year &&
              revenueModalData.month &&
              ((revenueModalData.business === "elkPeak" &&
                (metrics.elkPeak.monthlyRevenue?.some(
                  (m) =>
                    m.year === revenueModalData.year &&
                    m.month === revenueModalData.month,
                ) ||
                  metrics.elkPeak.monthlyEngagements?.some(
                    (m) =>
                      m.year === revenueModalData.year &&
                      m.month === revenueModalData.month,
                  ))) ||
                (revenueModalData.business === "lifeOrganizer" &&
                  metrics.lifeOrganizer.monthlyRevenue?.some(
                    (m) =>
                      m.year === revenueModalData.year &&
                      m.month === revenueModalData.month,
                  )) ||
                (revenueModalData.business === "friendlyTech" &&
                  metrics.friendlyTech.monthlyMetrics?.some(
                    (m) =>
                      m.year === revenueModalData.year &&
                      m.month === revenueModalData.month,
                  )) ||
                (revenueModalData.business === "runtimePM" &&
                  metrics.runtimePM.monthlyMetrics?.some(
                    (m) =>
                      m.year === revenueModalData.year &&
                      m.month === revenueModalData.month,
                  )))
                ? "Edit Monthly Metrics"
                : "Log Monthly Metrics"}
            </Heading>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={revenueModalData.year || ""}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      const month = revenueModalData.month;
                      const business = revenueModalData.business;

                      // Find existing data for new year/month
                      let existingData = {};
                      if (month && business === "elkPeak") {
                        if (metrics.elkPeak.monthlyRevenue) {
                          const existing = metrics.elkPeak.monthlyRevenue.find(
                            (m) => m.year === newYear && m.month === month,
                          );
                          if (existing) {
                            existingData.revenue = existing.revenue || 0;
                            existingData.notes = existing.notes || "";
                          }
                        }
                        if (metrics.elkPeak.monthlyEngagements) {
                          const existing =
                            metrics.elkPeak.monthlyEngagements.find(
                              (m) => m.year === newYear && m.month === month,
                            );
                          if (existing) {
                            existingData.engagementCount = existing.count || 0;
                            existingData.engagementNotes = existing.notes || "";
                          }
                        }
                      } else if (
                        month &&
                        business === "lifeOrganizer" &&
                        metrics.lifeOrganizer.monthlyRevenue
                      ) {
                        const existing =
                          metrics.lifeOrganizer.monthlyRevenue.find(
                            (m) => m.year === newYear && m.month === month,
                          );
                        if (existing) {
                          existingData = {
                            kdp_revenue: existing.kdp_revenue || 0,
                            notion_revenue: existing.notion_revenue || 0,
                            etsy_revenue: existing.etsy_revenue || 0,
                            gumroad_revenue: existing.gumroad_revenue || 0,
                            notes: existing.notes || "",
                          };
                        }
                      } else if (
                        month &&
                        business === "friendlyTech" &&
                        metrics.friendlyTech.monthlyMetrics
                      ) {
                        const existing =
                          metrics.friendlyTech.monthlyMetrics.find(
                            (m) => m.year === newYear && m.month === month,
                          );
                        if (existing) {
                          existingData = {
                            revenue: existing.revenue || 0,
                            tech_days: existing.tech_days || 0,
                            notes: existing.notes || "",
                          };
                        }
                      } else if (
                        month &&
                        business === "runtimePM" &&
                        metrics.runtimePM.monthlyMetrics
                      ) {
                        const existing = metrics.runtimePM.monthlyMetrics.find(
                          (m) => m.year === newYear && m.month === month,
                        );
                        if (existing) {
                          existingData = {
                            active_users: existing.active_users || 0,
                            revenue: existing.revenue || 0,
                            active_subscriptions:
                              existing.active_subscriptions || 0,
                            notes: existing.notes || "",
                          };
                        }
                      }

                      setRevenueModalData({
                        ...revenueModalData,
                        year: newYear,
                        ...existingData,
                      });
                    }}
                  />
                </Field>
                <Field>
                  <Label>Month</Label>
                  <select
                    value={revenueModalData.month || ""}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      const year = revenueModalData.year;
                      const business = revenueModalData.business;

                      // Find existing data for year/new month
                      let existingData = {};
                      if (year && business === "elkPeak") {
                        if (metrics.elkPeak.monthlyRevenue) {
                          const existing = metrics.elkPeak.monthlyRevenue.find(
                            (m) => m.year === year && m.month === newMonth,
                          );
                          if (existing) {
                            existingData.revenue = existing.revenue || 0;
                            existingData.notes = existing.notes || "";
                          }
                        }
                        if (metrics.elkPeak.monthlyEngagements) {
                          const existing =
                            metrics.elkPeak.monthlyEngagements.find(
                              (m) => m.year === year && m.month === newMonth,
                            );
                          if (existing) {
                            existingData.engagementCount = existing.count || 0;
                            if (!existingData.notes) {
                              existingData.notes = existing.notes || "";
                            }
                          }
                        }
                      } else if (
                        year &&
                        business === "lifeOrganizer" &&
                        metrics.lifeOrganizer.monthlyRevenue
                      ) {
                        const existing =
                          metrics.lifeOrganizer.monthlyRevenue.find(
                            (m) => m.year === year && m.month === newMonth,
                          );
                        if (existing) {
                          existingData = {
                            kdp_revenue: existing.kdp_revenue || 0,
                            notion_revenue: existing.notion_revenue || 0,
                            etsy_revenue: existing.etsy_revenue || 0,
                            gumroad_revenue: existing.gumroad_revenue || 0,
                            notes: existing.notes || "",
                          };
                        }
                      } else if (
                        year &&
                        business === "friendlyTech" &&
                        metrics.friendlyTech.monthlyMetrics
                      ) {
                        const existing =
                          metrics.friendlyTech.monthlyMetrics.find(
                            (m) => m.year === year && m.month === newMonth,
                          );
                        if (existing) {
                          existingData = {
                            revenue: existing.revenue || 0,
                            tech_days: existing.tech_days || 0,
                            notes: existing.notes || "",
                          };
                        }
                      } else if (
                        year &&
                        business === "runtimePM" &&
                        metrics.runtimePM.monthlyMetrics
                      ) {
                        const existing = metrics.runtimePM.monthlyMetrics.find(
                          (m) => m.year === year && m.month === newMonth,
                        );
                        if (existing) {
                          existingData = {
                            active_users: existing.active_users || 0,
                            revenue: existing.revenue || 0,
                            active_subscriptions:
                              existing.active_subscriptions || 0,
                            notes: existing.notes || "",
                          };
                        }
                      }

                      setRevenueModalData({
                        ...revenueModalData,
                        month: newMonth,
                        ...existingData,
                      });
                    }}
                    className="w-full rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2"
                  >
                    <option value="">Select month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {revenueModalData.business === "elkPeak" && (
                <>
                  <Field>
                    <Label>Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>One-Off Engagements</Label>
                    <Input
                      type="number"
                      value={revenueModalData.engagementCount || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          engagementCount: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              {revenueModalData.business === "lifeOrganizer" && (
                <>
                  <Field>
                    <Label>KDP Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.kdp_revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          kdp_revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Notion Templates Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.notion_revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          notion_revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Etsy Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.etsy_revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          etsy_revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Gumroad Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.gumroad_revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          gumroad_revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              {revenueModalData.business === "friendlyTech" && (
                <>
                  <Field>
                    <Label>Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Tech Days</Label>
                    <Input
                      type="number"
                      value={revenueModalData.tech_days || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          tech_days: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              {revenueModalData.business === "runtimePM" && (
                <>
                  <Field>
                    <Label>Active Users</Label>
                    <Input
                      type="number"
                      value={revenueModalData.active_users || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          active_users: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Revenue</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenueModalData.revenue || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          revenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Active Subscriptions</Label>
                    <Input
                      type="number"
                      value={revenueModalData.active_subscriptions || ""}
                      onChange={(e) =>
                        setRevenueModalData({
                          ...revenueModalData,
                          active_subscriptions: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              <Field>
                <Label>Notes (optional)</Label>
                <Input
                  value={revenueModalData.notes || ""}
                  onChange={(e) =>
                    setRevenueModalData({
                      ...revenueModalData,
                      notes: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex gap-2 justify-end">
                {revenueModalData.year &&
                  revenueModalData.month &&
                  ((revenueModalData.business === "elkPeak" &&
                    (metrics.elkPeak.monthlyRevenue?.some(
                      (m) =>
                        m.year === revenueModalData.year &&
                        m.month === revenueModalData.month,
                    ) ||
                      metrics.elkPeak.monthlyEngagements?.some(
                        (m) =>
                          m.year === revenueModalData.year &&
                          m.month === revenueModalData.month,
                      ))) ||
                    (revenueModalData.business === "lifeOrganizer" &&
                      metrics.lifeOrganizer.monthlyRevenue?.some(
                        (m) =>
                          m.year === revenueModalData.year &&
                          m.month === revenueModalData.month,
                      )) ||
                    (revenueModalData.business === "friendlyTech" &&
                      metrics.friendlyTech.monthlyMetrics?.some(
                        (m) =>
                          m.year === revenueModalData.year &&
                          m.month === revenueModalData.month,
                      )) ||
                    (revenueModalData.business === "runtimePM" &&
                      metrics.runtimePM.monthlyMetrics?.some(
                        (m) =>
                          m.year === revenueModalData.year &&
                          m.month === revenueModalData.month,
                      ))) && (
                    <Button
                      onClick={handleDeleteRevenue}
                      outline
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  )}
                <Button onClick={() => setShowRevenueModal(false)} outline>
                  Cancel
                </Button>
                <Button onClick={handleSaveRevenue}>Save</Button>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Monthly Engagement Modal */}
        <Dialog
          open={showEngagementModal}
          onClose={() => setShowEngagementModal(false)}
        >
          <div className="p-6">
            <Heading className="mb-4">
              {engagementModalData.year &&
              engagementModalData.month &&
              metrics.elkPeak.monthlyEngagements?.some(
                (m) =>
                  m.year === engagementModalData.year &&
                  m.month === engagementModalData.month,
              )
                ? "Edit Monthly One-Off Engagements"
                : "Log Monthly One-Off Engagements"}
            </Heading>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={engagementModalData.year || ""}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      const month = engagementModalData.month;

                      // Find existing data for new year/month
                      let existingData = {};
                      if (month && metrics.elkPeak.monthlyEngagements) {
                        const existing =
                          metrics.elkPeak.monthlyEngagements.find(
                            (m) => m.year === newYear && m.month === month,
                          );
                        if (existing) {
                          existingData = {
                            count: existing.count || 0,
                            notes: existing.notes || "",
                          };
                        }
                      }

                      setEngagementModalData({
                        ...engagementModalData,
                        year: newYear,
                        ...existingData,
                      });
                    }}
                  />
                </Field>
                <Field>
                  <Label>Month</Label>
                  <select
                    value={engagementModalData.month || ""}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      const year = engagementModalData.year;

                      // Find existing data for year/new month
                      let existingData = {};
                      if (year && metrics.elkPeak.monthlyEngagements) {
                        const existing =
                          metrics.elkPeak.monthlyEngagements.find(
                            (m) => m.year === year && m.month === newMonth,
                          );
                        if (existing) {
                          existingData = {
                            count: existing.count || 0,
                            notes: existing.notes || "",
                          };
                        }
                      }

                      setEngagementModalData({
                        ...engagementModalData,
                        month: newMonth,
                        ...existingData,
                      });
                    }}
                    className="w-full rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2"
                  >
                    <option value="">Select month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field>
                <Label>Number of Engagements</Label>
                <Input
                  type="number"
                  value={engagementModalData.count || ""}
                  onChange={(e) =>
                    setEngagementModalData({
                      ...engagementModalData,
                      count: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              <Field>
                <Label>Notes (optional)</Label>
                <Input
                  value={engagementModalData.notes || ""}
                  onChange={(e) =>
                    setEngagementModalData({
                      ...engagementModalData,
                      notes: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex gap-2 justify-end">
                {engagementModalData.year &&
                  engagementModalData.month &&
                  metrics.elkPeak.monthlyEngagements?.some(
                    (m) =>
                      m.year === engagementModalData.year &&
                      m.month === engagementModalData.month,
                  ) && (
                    <Button
                      onClick={handleDeleteEngagement}
                      outline
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  )}
                <Button onClick={() => setShowEngagementModal(false)} outline>
                  Cancel
                </Button>
                <Button onClick={handleSaveEngagement}>Save</Button>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

// MetricRow component for inline editing
function MetricRow({
  isAdmin,
  value,
  label,
  formatValue,
  company,
  metricKey,
  editingMetric,
  setEditingMetric,
  metricEditValue,
  setMetricEditValue,
  onSave,
  handleStartEdit,
}) {
  const metricId = `${company}:${metricKey}`;
  const isEditing = editingMetric === metricId;

  if (isEditing) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Input
            type="number"
            value={metricEditValue}
            onChange={(e) => setMetricEditValue(e.target.value)}
            className="text-2xl font-bold flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSave(company, metricKey);
              } else if (e.key === "Escape") {
                setEditingMetric(null);
                setMetricEditValue("");
              }
            }}
          />
          <Button
            onClick={() => onSave(company, metricKey)}
            className="text-xs px-2 py-1"
          >
            Save
          </Button>
          <Button
            onClick={() => {
              setEditingMetric(null);
              setMetricEditValue("");
            }}
            outline
            className="text-xs px-2 py-1"
          >
            Cancel
          </Button>
        </div>
        <Text className="text-sm">{label}</Text>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold text-zinc-950 dark:text-white">
          {formatValue(value)}
        </div>
        {isAdmin && (
          <Button
            onClick={() => handleStartEdit(company, metricKey, value)}
            outline
            className="text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Edit
          </Button>
        )}
      </div>
      <Text className="text-sm">{label}</Text>
    </div>
  );
}
