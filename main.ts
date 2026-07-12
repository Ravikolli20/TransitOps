import { Injectable } from '@nestjs/common';
import { Prisma, VehicleStatus, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

interface VehicleFilterInput {
  vehicleType?: string;
  region?: string;
  status?: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private vehicleWhere(filters: VehicleFilterInput): Prisma.VehicleWhereInput {
    return {
      ...(filters.vehicleType ? { vehicleType: filters.vehicleType } : {}),
      ...(filters.region ? { region: filters.region } : {}),
      ...(filters.status ? { status: filters.status as VehicleStatus } : {}),
    };
  }

  private dateRange(filters: DashboardQueryDto) {
    const gte = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    // Include the entire "to" day.
    const lte = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`) : undefined;
    return { gte, lte };
  }

  async getKpis(filters: DashboardQueryDto) {
    const vehicleWhere = this.vehicleWhere(filters);
    const { gte, lte } = this.dateRange(filters);
    const dateFilter = gte || lte ? { gte, lte } : undefined;

    const [
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fuelCostAgg,
      maintenanceCostAgg,
      revenueAgg,
    ] = await Promise.all([
      // "Active" = not retired.
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: { not: VehicleStatus.RETIRED } } }),
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.AVAILABLE } }),
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.IN_SHOP } }),
      this.prisma.trip.count({
        where: { status: TripStatus.DISPATCHED, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      }),
      this.prisma.trip.count({
        where: { status: TripStatus.DRAFT, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      }),
      // "On duty" = not off-duty and not suspended (i.e. available or currently on a trip).
      this.prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
      this.prisma.fuelLog.aggregate({
        _sum: { cost: true },
        where: {
          ...(dateFilter ? { date: dateFilter } : {}),
          vehicle: vehicleWhere,
        },
      }),
      this.prisma.maintenanceLog.aggregate({
        _sum: { cost: true },
        where: {
          ...(dateFilter ? { startDate: dateFilter } : {}),
          vehicle: vehicleWhere,
        },
      }),
      this.prisma.trip.aggregate({
        _sum: { revenueGenerated: true },
        where: {
          status: TripStatus.COMPLETED,
          ...(dateFilter ? { completedAt: dateFilter } : {}),
          vehicle: vehicleWhere,
        },
      }),
    ]);

    const onTripVehicles = await this.prisma.vehicle.count({
      where: { ...vehicleWhere, status: VehicleStatus.ON_TRIP },
    });

    const fuelCost = Number(fuelCostAgg._sum.cost ?? 0);
    const maintenanceCost = Number(maintenanceCostAgg._sum.cost ?? 0);
    const revenue = Number(revenueAgg._sum.revenueGenerated ?? 0);

    const fleetUtilizationPct = activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;
    const profitMarginPct = revenue > 0 ? ((revenue - fuelCost - maintenanceCost) / revenue) * 100 : 0;

    return {
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct: round2(fleetUtilizationPct),
      fuelCost: round2(fuelCost),
      maintenanceCost: round2(maintenanceCost),
      revenue: round2(revenue),
      profitMarginPct: round2(profitMarginPct),
    };
  }

  async getCharts(filters: DashboardQueryDto) {
    const { gte, lte } = this.dateRange(filters);
    // Default window: trailing 12 months if no explicit range given.
    const from = gte ?? new Date(new Date().setMonth(new Date().getMonth() - 11));
    const to = lte ?? new Date();

    const [monthlyFuelExpenses, monthlyCostTrends, monthlyRevenueTrends, vehicleUtilizationByType] =
      await Promise.all([
        this.prisma.$queryRaw<{ month: Date; total: number }[]>`
          SELECT date_trunc('month', "date") AS month, COALESCE(SUM(cost), 0)::float AS total
          FROM fuel_logs
          WHERE "date" BETWEEN ${from} AND ${to}
          GROUP BY 1 ORDER BY 1
        `,
        this.prisma.$queryRaw<{ month: Date; fuel: number; maintenance: number; expenses: number }[]>`
          SELECT
            month,
            COALESCE(f.total, 0)::float AS fuel,
            COALESCE(m.total, 0)::float AS maintenance,
            COALESCE(e.total, 0)::float AS expenses
          FROM generate_series(date_trunc('month', ${from}::timestamp), date_trunc('month', ${to}::timestamp), interval '1 month') AS month
          LEFT JOIN (
            SELECT date_trunc('month', "date") AS month, SUM(cost) AS total FROM fuel_logs GROUP BY 1
          ) f USING (month)
          LEFT JOIN (
            SELECT date_trunc('month', "startDate") AS month, SUM(cost) AS total FROM maintenance_logs GROUP BY 1
          ) m USING (month)
          LEFT JOIN (
            SELECT date_trunc('month', "date") AS month, SUM(amount) AS total FROM expenses GROUP BY 1
          ) e USING (month)
          ORDER BY month
        `,
        this.prisma.$queryRaw<{ month: Date; total: number }[]>`
          SELECT date_trunc('month', "completedAt") AS month, COALESCE(SUM("revenueGenerated"), 0)::float AS total
          FROM trips
          WHERE status = 'COMPLETED' AND "completedAt" BETWEEN ${from} AND ${to}
          GROUP BY 1 ORDER BY 1
        `,
        this.prisma.vehicle.groupBy({
          by: ['vehicleType', 'status'],
          _count: { _all: true },
        }),
      ]);

    return {
      monthlyFuelExpenses: monthlyFuelExpenses.map((r) => ({ month: formatMonth(r.month), total: r.total })),
      monthlyCostTrends: monthlyCostTrends.map((r) => ({
        month: formatMonth(r.month),
        fuel: r.fuel,
        maintenance: r.maintenance,
        expenses: r.expenses,
        total: r.fuel + r.maintenance + r.expenses,
      })),
      monthlyRevenueTrends: monthlyRevenueTrends.map((r) => ({ month: formatMonth(r.month), total: r.total })),
      vehicleUtilizationByType: aggregateUtilization(vehicleUtilizationByType),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMonth(d: Date): string {
  return new Date(d).toISOString().slice(0, 7); // "YYYY-MM"
}

function aggregateUtilization(
  rows: { vehicleType: string; status: VehicleStatus; _count: { _all: number } }[],
) {
  const byType = new Map<string, { total: number; onTrip: number }>();
  for (const row of rows) {
    const entry = byType.get(row.vehicleType) ?? { total: 0, onTrip: 0 };
    entry.total += row._count._all;
    if (row.status === 'ON_TRIP') entry.onTrip += row._count._all;
    byType.set(row.vehicleType, entry);
  }
  return Array.from(byType.entries()).map(([vehicleType, { total, onTrip }]) => ({
    vehicleType,
    utilizationPct: total > 0 ? round2((onTrip / total) * 100) : 0,
  }));
}
