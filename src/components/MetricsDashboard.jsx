import React, { useState, useEffect } from "react";
import { Card, CardTitle, CardBody } from "@/catalyst/card";
import { Button } from "@/catalyst/button";
import { Text, Heading, Input, Field, Label } from "@/catalyst";
import { Dialog } from "@/catalyst/dialog";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  getMetrics,
  listQuarterGoals,
  createQuarterGoal,
  updateQuarterGoal,
  deleteQuarterGoal,
  updateMetricOverride,
  deleteMetricOverride,
} from "@/services/api";

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

  useEffect(() => {
    fetchMetrics();
    fetchQuarterGoals();
  }, []);

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
            currentValue =
              (metrics.lifeOrganizer.totalKDPRevenue || 0) +
              (metrics.lifeOrganizer.totalNotionRevenue || 0);
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
      const goalData = {
        id: editingGoal?.id || uuidv4(),
        name: editValues.goalName || "",
        target_value: parseFloat(editValues.targetValue) || 0,
        current_value: parseFloat(editValues.currentValue) || 0,
        quarter,
        year,
        metric_type: editValues.metricType || "custom",
        order: parseInt(editValues.order) || 0,
      };

      if (editingGoal) {
        await updateQuarterGoal(editingGoal.id, goalData);
        toast.success("Goal updated");
      } else {
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
      await updateMetricOverride(company, metricKey, value);
      toast.success("Metric updated");
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
              <Button onClick={() => openGoalModal()} outline className="text-xs ml-4">
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
                    100
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
            <CardTitle>Elk Peak Consulting</CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.activeClients || 0}
                  label="Active Clients"
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
                  value={metrics.elkPeak.monthlyRecurringRevenue || 0}
                  label="Monthly Recurring Revenue"
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
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.totalRevenue || 0}
                  label="Total Revenue"
                  formatValue={formatCurrency}
                  company="elkPeak"
                  metricKey="totalRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.elkPeak.totalProjects || 0}
                  label="Total Projects"
                  formatValue={formatNumber}
                  company="elkPeak"
                  metricKey="totalProjects"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
              </div>
            </CardBody>
          </Card>

          {/* Life Organizer Guru */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle>Life Organizer Guru</CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(
                      (metrics.lifeOrganizer.totalKDPRevenue || 0) +
                        (metrics.lifeOrganizer.totalNotionRevenue || 0)
                    )}
                  </div>
                  <Text className="text-sm">Total Revenue</Text>
                </div>
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.lifeOrganizer.totalKDPRevenue || 0}
                  label="KDP Revenue"
                  formatValue={formatCurrency}
                  company="lifeOrganizer"
                  metricKey="totalKDPRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.lifeOrganizer.totalNotionRevenue || 0}
                  label="Notion Templates Revenue"
                  formatValue={formatCurrency}
                  company="lifeOrganizer"
                  metricKey="totalNotionRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.lifeOrganizer.activeRuntimePMUsers || 0}
                  label="Active Runtime PM Users"
                  formatValue={formatNumber}
                  company="lifeOrganizer"
                  metricKey="activeRuntimePMUsers"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
              </div>
            </CardBody>
          </Card>

          {/* The Friendly Tech Help */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle>The Friendly Tech Help</CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.friendlyTech.totalRevenue || 0}
                  label="Total Revenue"
                  formatValue={formatCurrency}
                  company="friendlyTech"
                  metricKey="totalRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.friendlyTech.activeHOAClients || 0}
                  label="Active HOA Clients"
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
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.friendlyTech.totalSessions || 0}
                  label="Total Tech Days"
                  formatValue={formatNumber}
                  company="friendlyTech"
                  metricKey="totalSessions"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
              </div>
            </CardBody>
          </Card>

          {/* Runtime PM */}
          <Card className="h-full flex flex-col !max-w-none">
            <CardTitle>Runtime PM</CardTitle>
            <CardBody className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.runtimePM.activeUsers || 0}
                  label="Active Users"
                  formatValue={formatNumber}
                  company="runtimePM"
                  metricKey="activeUsers"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.runtimePM.monthlyRecurringRevenue || 0}
                  label="Monthly Recurring Revenue"
                  formatValue={formatCurrency}
                  company="runtimePM"
                  metricKey="monthlyRecurringRevenue"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
                <MetricRow
                  isAdmin={isAdmin}
                  value={metrics.runtimePM.totalSubscriptions || 0}
                  label="Active Subscriptions"
                  formatValue={formatNumber}
                  company="runtimePM"
                  metricKey="totalSubscriptions"
                  editingMetric={editingMetric}
                  setEditingMetric={setEditingMetric}
                  metricEditValue={metricEditValue}
                  setMetricEditValue={setMetricEditValue}
                  onSave={handleSaveMetric}
                  handleStartEdit={handleStartEdit}
                />
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
