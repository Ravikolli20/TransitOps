import { apiFetch } from '@/lib/api-client';
import type { DashboardKpis, DashboardCharts } from '@/types';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { FilterBar } from '@/components/dashboard/filter-bar';
import {
  FuelExpensesChart,
  CostTrendsChart,
  RevenueTrendsChart,
  VehicleUtilizationChart,
} from '@/components/dashboard/charts';

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const qs = buildQueryString(searchParams);

  // Fetched in parallel; both hit the same date/vehicle filters so KPI cards
  // and charts stay consistent with each other.
  const [kpis, charts] = await Promise.all([
    apiFetch<DashboardKpis>(`/dashboard/kpis${qs}`),
    apiFetch<DashboardCharts>(`/dashboard/charts${qs}`),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fleet-wide operational and financial snapshot.
        </p>
      </div>

      <FilterBar />

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FuelExpensesChart data={charts.monthlyFuelExpenses} />
        <RevenueTrendsChart data={charts.monthlyRevenueTrends} />
        <CostTrendsChart data={charts.monthlyCostTrends} />
        <VehicleUtilizationChart data={charts.vehicleUtilizationByType} />
      </div>
    </div>
  );
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}
