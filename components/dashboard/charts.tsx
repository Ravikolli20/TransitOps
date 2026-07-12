'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DashboardCharts } from '@/types';

const AXIS_STYLE = { fontSize: 12 };

export function FuelExpensesChart({ data }: { data: DashboardCharts['monthlyFuelExpenses'] }) {
  return (
    <ChartCard title="Monthly Fuel Expenses">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={false} name="Fuel cost" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CostTrendsChart({ data }: { data: DashboardCharts['monthlyCostTrends'] }) {
  return (
    <ChartCard title="Cost Trends">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="fuel" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={false} name="Fuel" />
          <Line type="monotone" dataKey="maintenance" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} name="Maintenance" />
          <Line type="monotone" dataKey="expenses" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Other expenses" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueTrendsChart({ data }: { data: DashboardCharts['monthlyRevenueTrends'] }) {
  return (
    <ChartCard title="Revenue Trends">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function VehicleUtilizationChart({ data }: { data: DashboardCharts['vehicleUtilizationByType'] }) {
  return (
    <ChartCard title="Vehicle Utilization by Type">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="vehicleType" tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} unit="%" />
          <Tooltip />
          <Bar dataKey="utilizationPct" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} name="Utilization %" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="mb-2 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
