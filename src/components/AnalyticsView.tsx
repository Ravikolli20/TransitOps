import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Sparkles, Award, ShieldCheck, Flame, Wrench, ShieldAlert } from "lucide-react";
import { Vehicle, Driver, Trip, FuelLog, MaintenanceLog } from "../types.js";

export default function AnalyticsView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, dRes, tRes, fRes, mRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/trips"),
        fetch("/api/fuel"),
        fetch("/api/maintenance")
      ]);
      if (vRes.ok && dRes.ok && tRes.ok && fRes.ok && mRes.ok) {
        setVehicles(await vRes.json());
        setDrivers(await dRes.json());
        setTrips(await tRes.json());
        setFuelLogs(await fRes.json());
        setMaintenance(await mRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center p-12 text-slate-500 text-xs font-mono">Running complex financial analytics audits...</div>;
  }

  // Calculate advanced vehicle metrics & ROI
  // Formula: (Revenue - Fuel Cost - Maintenance Cost) / Acquisition Cost
  const vehicleROIStats = vehicles.map(v => {
    // 1. Revenue
    const vehicleTrips = trips.filter(t => t.vehicleId === v.id);
    const vehicleRevenue = vehicleTrips.reduce((acc, t) => acc + t.revenueGenerated, 0);

    // 2. Fuel Cost
    const vehicleFuelLogs = fuelLogs.filter(f => f.vehicleId === v.id);
    const vehicleFuelCost = vehicleFuelLogs.reduce((acc, f) => acc + f.cost, 0);

    // 3. Maintenance Cost
    const vehicleMaintenance = maintenance.filter(m => m.vehicleId === v.id);
    const vehicleMaintenanceCost = vehicleMaintenance.reduce((acc, m) => acc + m.cost, 0);

    // 4. ROI
    const netReturn = vehicleRevenue - vehicleFuelCost - vehicleMaintenanceCost;
    const roiPercentage = v.acquisitionCost > 0 ? (netReturn / v.acquisitionCost) * 100 : 0;

    // Fuel Efficiency (total distance traveled / total fuel liters)
    // we assume a default base distance + actual distance
    const totalDistance = vehicleTrips.reduce((acc, t) => acc + (t.actualDistance || t.plannedDistance), 0);
    const totalLiters = vehicleFuelLogs.reduce((acc, f) => acc + f.liters, 0);
    const efficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : "0.00"; // km/L

    return {
      ...v,
      revenue: vehicleRevenue,
      fuelCost: vehicleFuelCost,
      maintenanceCost: vehicleMaintenanceCost,
      netReturn,
      roi: roiPercentage.toFixed(2),
      efficiency,
      totalDistance
    };
  }).filter(item => item.status !== "RETIRED"); // Hide retired from ROI analysis

  // Drivers Leaderboard sorted by Safety Score
  const sortedDrivers = [...drivers].sort((a, b) => b.safetyScore - a.safetyScore);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Operations Analytics Center</h2>
        <p className="text-slate-500 text-xs mt-1">Real-time calculations of heavy machinery ROI margins, fuel utilization curves, and commercial safety rankings.</p>
      </div>

      {/* Advanced ROI Formula Display Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
          <Sparkles className="h-44 w-44 text-indigo-400" />
        </div>
        <div className="max-w-xl">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider block w-fit mb-2">
            REGULATORY ACCOUNTING FORMULA
          </span>
          <h3 className="font-display font-bold text-base mb-1.5">Fleet Return on Investment (ROI)</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Every heavy logistical machinery asset tracks custom yields in real-time under the formula:
          </p>
          <div className="my-3 p-3 bg-slate-950/80 rounded-lg font-mono text-xs text-indigo-300 border border-slate-800/60 text-center">
            ROI % = (Revenue - Fuel Cost - Maintenance Cost) / Acquisition Cost
          </div>
          <p className="text-[10px] text-slate-500 leading-normal italic">
            Refueling logs, parts replacement billing, and completed dispatch fees update the ledger coefficients automatically.
          </p>
        </div>
      </div>

      {/* Grid: ROI Table + Drivers Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ROI Table Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm xl:col-span-2 space-y-4 flex flex-col">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Heavy Asset ROI Matrix</h3>
            <p className="text-[10px] text-slate-400">Current yield performance parameters per vehicle</p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                  <th className="px-4 py-2 font-bold">Vehicle Info</th>
                  <th className="px-4 py-2 font-bold text-right font-mono">Revenue</th>
                  <th className="px-4 py-2 font-bold text-right font-mono">OpEx (Fuel/Shop)</th>
                  <th className="px-4 py-2 font-bold text-right font-mono">ROI %</th>
                  <th className="px-4 py-2 font-bold text-right font-mono">Fuel Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleROIStats.map(stat => {
                  const opex = stat.fuelCost + stat.maintenanceCost;
                  const roiNum = Number(stat.roi);

                  return (
                    <tr key={stat.id} className="hover:bg-slate-50/40">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-slate-850 text-xs">{stat.vehicleName}</div>
                          <span className="font-mono text-[9px] text-slate-400">{stat.registrationNumber} ({stat.vehicleType})</span>
                        </div>
                      </td>

                      {/* Rev */}
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                        ${stat.revenue.toLocaleString()}
                      </td>

                      {/* OpEx */}
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ${opex.toLocaleString()}
                      </td>

                      {/* ROI */}
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                          roiNum > 0 ? "bg-emerald-50 text-emerald-700 font-bold" :
                          roiNum === 0 ? "bg-slate-50 text-slate-600" : "bg-red-50 text-red-700"
                        }`}>
                          {roiNum > 0 ? "+" : ""}{stat.roi}%
                        </span>
                      </td>

                      {/* Efficiency */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                        {stat.efficiency !== "0.00" ? `${stat.efficiency} km/L` : "No logs"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Leaderboard Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Operator Safety Standing</span>
            </h3>
            <p className="text-[10px] text-slate-400">Roster compliance sorted by safety parameters</p>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1">
            {sortedDrivers.map((driver, index) => {
              const isExcellent = driver.safetyScore >= 90;
              const isWarning = driver.safetyScore < 70;

              return (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 w-4">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 text-xs block truncate">{driver.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono tracking-wide uppercase">{driver.licenseCategory}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExcellent && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                    {isWarning && <ShieldAlert className="h-4 w-4 text-red-500" />}
                    <span className={`font-mono font-bold text-xs ${
                      isExcellent ? "text-emerald-600" :
                      isWarning ? "text-red-600" : "text-slate-700"
                    }`}>
                      {driver.safetyScore}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
