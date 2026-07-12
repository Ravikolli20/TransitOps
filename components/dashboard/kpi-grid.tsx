import type { DashboardKpis } from '@/types';
import { KpiCard } from './kpi-card';

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <KpiCard label="Active Vehicles" value={String(kpis.activeVehicles)} />
      <KpiCard label="Available Vehicles" value={String(kpis.availableVehicles)} tone="success" />
      <KpiCard label="Vehicles in Maintenance" value={String(kpis.vehiclesInMaintenance)} tone="warning" />
      <KpiCard label="Active Trips" value={String(kpis.activeTrips)} />
      <KpiCard label="Pending Trips" value={String(kpis.pendingTrips)} />
      <KpiCard label="Drivers On Duty" value={String(kpis.driversOnDuty)} />
      <KpiCard label="Fleet Utilization" value={`${kpis.fleetUtilizationPct}%`} />
      <KpiCard label="Fuel Cost" value={currency(kpis.fuelCost)} />
      <KpiCard label="Maintenance Cost" value={currency(kpis.maintenanceCost)} />
      <KpiCard label="Revenue" value={currency(kpis.revenue)} tone="success" />
      <KpiCard
        label="Profit Margin"
        value={`${kpis.profitMarginPct}%`}
        tone={kpis.profitMarginPct >= 0 ? 'success' : 'destructive'}
      />
    </div>
  );
}
