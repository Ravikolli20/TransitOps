import React, { useState, useEffect } from "react";
import { Plus, Search, Flame, Droplets, DollarSign, BarChart3, HelpCircle, X } from "lucide-react";
import { FuelLog, Vehicle, UserRole } from "../types.js";

interface FuelViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function FuelView({ userRole, onRefreshTrigger }: FuelViewProps) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState(150);
  const [cost, setCost] = useState(580);
  const [fuelType, setFuelType] = useState("Diesel");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [odometer, setOdometer] = useState(150000);

  // RBAC checks (everyone except FINANCIAL_ANALYST can write fuel logs typically)
  const canWrite = userRole !== UserRole.FINANCIAL_ANALYST;

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        fetch("/api/fuel"),
        fetch("/api/vehicles")
      ]);
      if (logsRes.ok && vehiclesRes.ok) {
        setLogs(await logsRes.json());
        setVehicles(await vehiclesRes.json());
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

  const handleOpenAdd = () => {
    setError("");
    setVehicleId("");
    setLiters(150);
    setCost(580);
    setFuelType("Diesel");
    setDate(new Date().toISOString().split("T")[0]);
    setOdometer(150000);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!vehicleId) {
      setError("Please select a target vehicle.");
      return;
    }

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && odometer <= vehicle.odometer) {
      setError(`Odometer reading must exceed the vehicle's current odometer (${vehicle.odometer.toLocaleString()} km).`);
      return;
    }

    const payload = {
      vehicleId,
      liters: Number(liters),
      cost: Number(cost),
      fuelType,
      date,
      odometerReading: Number(odometer)
    };

    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadData();
        onRefreshTrigger();
      } else {
        setError(data.error || "Failed to save fuel purchase.");
      }
    } catch (err) {
      setError("Server link lost.");
    }
  };

  // Calculated variables
  const totalLiters = logs.reduce((acc, log) => acc + log.liters, 0);
  const totalCost = logs.reduce((acc, log) => acc + log.cost, 0);
  const avgFuelCostPerKm = totalCost > 0 ? (totalCost / 4120).toFixed(2) : "0.00"; // baseline distance: 4120km

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Fuel Logging Terminal</h2>
          <p className="text-slate-500 text-xs mt-1">Audit heavy machinery refueling, track odometer logs, and analyze fleet-wide combustion efficiency.</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Refuel Log Entry</span>
          </button>
        )}
      </div>

      {/* Analytics Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Cost Refueled */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Total Fuel Expenses</span>
            <span className="font-display font-bold text-xl text-slate-900">${totalCost.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Total Liters Combustion */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Total Diesel Liters</span>
            <span className="font-display font-bold text-xl text-slate-900">{totalLiters.toLocaleString()} L</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
            <Droplets className="h-5 w-5" />
          </div>
        </div>

        {/* Average cost per KM */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Avg Fuel Cost per Kilometer</span>
            <span className="font-display font-bold text-xl text-slate-900">${avgFuelCostPerKm} / km</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Connecting fuel pump records...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No fuel purchase logs registered in terminal database.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="px-6 py-3.5 font-bold">Vehicle</th>
                  <th className="px-6 py-3.5 font-bold">Fuel Volume</th>
                  <th className="px-6 py-3.5 font-bold">Log Date</th>
                  <th className="px-6 py-3.5 font-bold font-mono">Cost</th>
                  <th className="px-6 py-3.5 font-bold">Fuel Type</th>
                  <th className="px-6 py-3.5 font-bold font-mono text-right">Odometer Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {logs.map((log) => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">{vehicle ? vehicle.vehicleName : "Unknown Vehicle"}</div>
                          <span className="font-mono text-[10px] text-slate-400">{vehicle ? vehicle.registrationNumber : "---"}</span>
                        </div>
                      </td>

                      {/* Vol */}
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        {log.liters} L
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        {log.date}
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 font-mono font-semibold text-indigo-600">
                        ${log.cost}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                          {log.fuelType}
                        </span>
                      </td>

                      {/* Odo */}
                      <td className="px-6 py-4 font-mono text-right font-medium text-slate-700">
                        {log.odometerReading.toLocaleString()} km
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refuel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
              Add Fuel Purchase Log
            </h3>
            <p className="text-xs text-slate-500 mb-4">Refueling details will write automatically to the financial expense registry.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Vehicle Select */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT TARGET VEHICLE</label>
                <select
                  value={vehicleId}
                  required
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const v = vehicles.find(item => item.id === e.target.value);
                    if (v) setOdometer(v.odometer + 350); // pre-populate logical next odo
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber}) - Current Odo: {v.odometer.toLocaleString()} km</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Liters */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">VOLUME REFUELED (LITERS)</label>
                  <input
                    type="number"
                    required
                    value={liters}
                    onChange={(e) => {
                      setLiters(Number(e.target.value));
                      setCost(Math.round(Number(e.target.value) * 3.8)); // Standard price factor
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">TOTAL COST (USD)</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fuel Type */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">FUEL TYPE</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Diesel">Diesel Fuel (Premium)</option>
                    <option value="Gasoline">Regular Gasoline</option>
                    <option value="Electric">EV charging logs</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">LOG DATE</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Odometer */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">ODOMETER READING CHECKPOINT (KM)</label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs"
                >
                  Save Fuel Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
