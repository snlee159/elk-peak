import React from "react";
import { Heading, Text, Card } from "@/catalyst";

export default function MetricsDashboard({ isAdmin }) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Heading>Metrics Dashboard</Heading>
          <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
            Track metrics across all business units
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Placeholder metric cards */}
          <Card className="p-6">
            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Elk Peak Consulting
            </Text>
            <Heading className="text-2xl">-</Heading>
            <Text className="text-xs text-zinc-500 mt-1">Active Clients</Text>
          </Card>

          <Card className="p-6">
            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Life Organizer Guru
            </Text>
            <Heading className="text-2xl">-</Heading>
            <Text className="text-xs text-zinc-500 mt-1">Total Revenue</Text>
          </Card>

          <Card className="p-6">
            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              The Friendly Tech Help
            </Text>
            <Heading className="text-2xl">-</Heading>
            <Text className="text-xs text-zinc-500 mt-1">Active HOA Clients</Text>
          </Card>

          <Card className="p-6">
            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Runtime PM
            </Text>
            <Heading className="text-2xl">-</Heading>
            <Text className="text-xs text-zinc-500 mt-1">Active Users</Text>
          </Card>
        </div>

        {isAdmin && (
          <Card className="p-6">
            <Heading className="text-lg mb-4">Admin Controls</Heading>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Admin features will be available here
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
