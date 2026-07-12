import React, { useState, useEffect } from "react";
import { Plus, Search, MapPin, Truck, Users, Trash2, ShieldAlert, CheckCircle2, ArrowRightLeft, X, Check, XCircle } from "lucide-react";
import { Trip, TripStatus, Vehicle, Driver, VehicleStatus, DriverStatus, UserRole } from "../types.js";

interface TripsViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function TripsView({ userRole, onRefreshTrigger }: TripsViewProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Form states for Create Trip
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState(15000);
  const [plannedDistance, setPlannedDistance] = useState(400);
  const [revenue, setRevenue] = useState(3000);
  const [status, setStatus] = useState<TripStatus>(TripStatus.DRAFT);

  // Form states for Completing a Trip
  const [actualDistance, setActualDistance] = useState(405);
  const [fuelConsumed, setFuelConsumed] = useState(120);

  // Role check
  const canDispatch = userRole === UserRole.ADMIN || userRole === UserRole.FLEET_MANAGER || userRole === UserRole.DISPATCHER;

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch("/api/trips"),
        fetch("/api/vehicles"),
        fetch("/api/drivers")
      ]);
      if (tripsRes.ok && vehiclesRes.ok && driversRes.ok) {
        setTrips(await tripsRes.json());
        setVehicles(await vehiclesRes.json());
        setDrivers(await driversRes.json());
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
    setSource("");
    setDestination("");
    setVehicleId("");
    setDriverId("");
    setCargoWeight(15000);
    setPlannedDistance(400);
    setRevenue(3000);
    setStatus(TripStatus.DRAFT);
    setIsModalOpen(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!source || !destination || !vehicleId || !driverId) {
      setError("Please fill in source, destination, vehicle and driver.");
      return;
    }

    const payload = {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
      revenueGenerated: Number(revenue),
      status
    };

    try {
      const res = await fetch("/api/trips", {
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
        setError(data.error || "Failed to schedule active trip.");
      }
    } catch (err) {
      setError("Server link failure.");
    }
  };

  const handleDispatch = async (trip: Trip) => {
    setError("");
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trip,
          status: TripStatus.DISPATCHED
        })
      });
      const data = await res.json();
      if (res.ok) {
        loadData();
        onRefreshTrigger();
      } else {
        alert(`DISPATCH REJECTED: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenComplete = (trip: Trip) => {
    setSelectedTrip(trip);
    setActualDistance(trip.plannedDistance);
    setFuelConsumed(Math.round(trip.plannedDistance * 0.3)); // estimate: 30L/100km
    setIsCompleteModalOpen(true);
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedTrip,
          actualDistance: Number(actualDistance),
          fuelConsumed: Number(fuelConsumed),
          status: TripStatus.COMPLETED
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCompleteModalOpen(false);
        setSelectedTrip(null);
        loadData();
        onRefreshTrigger();
      } else {
        alert(`Error completing trip: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelTrip = async (trip: Trip) => {
    if (!confirm("Are you sure you want to cancel this trip? Handled assets will be returned to pool.")) return;
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trip,
          status: TripStatus.CANCELLED
        })
      });
      if (res.ok) {
        loadData();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm("Remove this trip from registry permanently?")) return;
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.source.toLowerCase().includes(search.toLowerCase()) ||
                          t.destination.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Filter lists for available assets
  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE);
  const availableDrivers = drivers.filter(d => d.status === DriverStatus.AVAILABLE);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Logistics Dispatch Terminal</h2>
          <p className="text-slate-500 text-xs mt-1">Schedule and monitor freight dispatches. The terminal strictly checks driver licenses, cargo weights, and vehicle status constraints.</p>
        </div>

        {canDispatch && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Plan Freight Trip</span>
          </button>
        )}
      </div>

      {/* Roster Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search active dispatches by origin or destination terminal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main timeline listing */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Connecting dispatch feeds...</div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No dispatches scheduled on active logs.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((t) => {
            const vehicle = vehicles.find(v => v.id === t.vehicleId);
            const driver = drivers.find(d => d.id === t.driverId);

            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Route indicators */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        t.status === TripStatus.DRAFT ? "bg-slate-100 text-slate-600 border border-slate-200" :
                        t.status === TripStatus.DISPATCHED ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse" :
                        t.status === TripStatus.COMPLETED ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">TRIP ID: {t.id}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 text-sm">{t.source}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-xs font-medium">&bull;&bull;&bull;&gt;</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-slate-900 text-sm">{t.destination}</span>
                      </div>
                    </div>

                    {/* Cargo Weight & Distance specs */}
                    <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
                      <div>Cargo Weight: <span className="font-semibold text-slate-700">{(t.cargoWeight / 1000).toFixed(1)}t</span> ({t.cargoWeight.toLocaleString()} kg)</div>
                      <div>Distance: <span className="font-semibold text-slate-700">{t.plannedDistance} km</span></div>
                      <div>Expected Rev: <span className="font-semibold text-slate-700">${t.revenueGenerated.toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Assigned Assets */}
                  <div className="flex flex-col sm:flex-row gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 lg:border-l lg:pl-6 max-w-sm w-full">
                    {/* Vehicle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-1">
                        <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" /> VEHICLE ASSET
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {vehicle ? vehicle.vehicleName : "Unknown Vehicle"}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {vehicle ? vehicle.registrationNumber : "---"}
                      </span>
                    </div>

                    {/* Driver */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-1">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" /> DISPATCHED DRIVER
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {driver ? driver.name : "Unknown Driver"}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        CDL Score: {driver ? `${driver.safetyScore}/100` : "---"}
                      </span>
                    </div>
                  </div>

                  {/* Completed actual specs (if completed) */}
                  {t.status === TripStatus.COMPLETED && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-mono text-slate-600 space-y-1 shrink-0">
                      <div>Actual Dist: <span className="font-semibold text-slate-800">{t.actualDistance} km</span></div>
                      <div>Fuel Consumed: <span className="font-semibold text-slate-800">{t.fuelConsumed} Liters</span></div>
                    </div>
                  )}

                  {/* Operational Controls */}
                  <div className="flex items-center lg:justify-end gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 shrink-0">
                    {canDispatch && (
                      <>
                        {t.status === TripStatus.DRAFT && (
                          <button
                            onClick={() => handleDispatch(t)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded text-[11px] transition-colors flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Dispatch</span>
                          </button>
                        )}
                        
                        {t.status === TripStatus.DISPATCHED && (
                          <button
                            onClick={() => handleOpenComplete(t)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded text-[11px] transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Complete</span>
                          </button>
                        )}

                        {t.status === TripStatus.DISPATCHED && (
                          <button
                            onClick={() => handleCancelTrip(t)}
                            className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded text-[11px] border border-slate-200 hover:border-red-200 transition-colors"
                          >
                            Cancel Trip
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTrip(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete trip schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
              Dispatch Planner Terminal
            </h3>
            <p className="text-xs text-slate-500 mb-4">Draft new cargo dispatches. All safety rules must be successfully resolved before dispatch.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Source */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">ORIGIN DEPARTURE TERMINAL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Houston, TX"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">DESTINATION TERMINAL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Los Angeles, CA"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT HEAVY VEHICLE</label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Vehicle...</option>
                    {/* Highlight available ones */}
                    <option disabled className="bg-slate-100 text-[10px] uppercase font-bold font-mono">-- AVAILABLE FLEET --</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber}) - Max: {(v.maxLoadCapacity/1000).toFixed(0)}t</option>
                    ))}
                    <option disabled className="bg-slate-100 text-[10px] uppercase font-bold font-mono">-- IN-USE / SHOP (TEST SAFELY RULES) --</option>
                    {vehicles.filter(v => v.status !== VehicleStatus.AVAILABLE).map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber}) - {v.status}</option>
                    ))}
                  </select>
                </div>

                {/* Driver Selection */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT CDL OPERATOR</label>
                  <select
                    value={driverId}
                    required
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Driver...</option>
                    <option disabled className="bg-slate-100 text-[10px] uppercase font-bold font-mono">-- AVAILABLE DRIVERS --</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (CDL: {d.licenseCategory})</option>
                    ))}
                    <option disabled className="bg-slate-100 text-[10px] uppercase font-bold font-mono">-- ON DUTY / SUSPENDED --</option>
                    {drivers.filter(d => d.status !== DriverStatus.AVAILABLE).map(d => (
                      <option key={d.id} value={d.id}>{d.name} - Status: {d.status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Cargo Weight */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">CARGO WEIGHT (KG)</label>
                  <input
                    type="number"
                    required
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Planned Distance */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">PLANNED DIST (KM)</label>
                  <input
                    type="number"
                    required
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Expected Revenue */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">REVENUE GEN (USD)</label>
                  <input
                    type="number"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">DISPATCH STATE</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TripStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={TripStatus.DRAFT}>Create as Draft (Scheduler)</option>
                  <option value={TripStatus.DISPATCHED}>Dispatch Active (Trigger State Changes)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
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
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Actual Details Modal */}
      {isCompleteModalOpen && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setIsCompleteModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
              Finalize Logged Trip
            </h3>
            <p className="text-xs text-slate-500 mb-4">Provide actual telematics data. This automatically logs fuel expenses and increments the vehicle's odometer.</p>

            <form onSubmit={handleCompleteTripSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">ACTUAL COMPLETED DISTANCE (KM)</label>
                <input
                  type="number"
                  required
                  value={actualDistance}
                  onChange={(e) => setActualDistance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">TOTAL DIESEL FUEL CONSUMED (LITERS)</label>
                <input
                  type="number"
                  required
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs animate-pulse"
                >
                  Complete & Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
