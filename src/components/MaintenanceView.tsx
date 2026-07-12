import React, { useState, useEffect } from "react";
import { Plus, Search, Wrench, Calendar, DollarSign, Trash2, CheckCircle2, Hammer, X } from "lucide-react";
import { MaintenanceLog, MaintenanceStatus, Vehicle, VehicleStatus, UserRole } from "../types.js";

interface MaintenanceViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function MaintenanceView({ userRole, onRefreshTrigger }: MaintenanceViewProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedLogId, setSelectedLogId] = useState("");

  // Form fields
  const [vehicleId, setVehicleId] = useState("");
  const [issue, setIssue] = useState("");
  const [mType, setMType] = useState("Routine");
  const [cost, setCost] = useState(500);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [mStatus, setMStatus] = useState<MaintenanceStatus>(MaintenanceStatus.SCHEDULED);

  // RBAC checks
  const canWrite = userRole === UserRole.ADMIN || userRole === UserRole.FLEET_MANAGER || userRole === UserRole.SAFETY_OFFICER;

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        fetch("/api/maintenance"),
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
    setModalMode("add");
    setSelectedLogId("");
    setVehicleId("");
    setIssue("");
    setMType("Routine");
    setCost(500);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setMStatus(MaintenanceStatus.SCHEDULED);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: MaintenanceLog) => {
    setError("");
    setModalMode("edit");
    setSelectedLogId(log.id);
    setVehicleId(log.vehicleId);
    setIssue(log.issue);
    setMType(log.maintenanceType);
    setCost(log.cost);
    setStartDate(log.startDate);
    setEndDate(log.endDate || "");
    setMStatus(log.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!vehicleId || !issue) {
      setError("Please select a vehicle and specify the maintenance issue.");
      return;
    }

    const payload = {
      id: modalMode === "edit" ? selectedLogId : undefined,
      vehicleId,
      issue,
      maintenanceType: mType,
      cost: Number(cost),
      startDate,
      endDate: endDate || undefined,
      status: mStatus
    };

    try {
      const res = await fetch("/api/maintenance", {
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
        setError(data.error || "Failed to submit maintenance log.");
      }
    } catch (err) {
      setError("Server communication failure.");
    }
  };

  const handleResolveLog = async (log: MaintenanceLog) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...log,
          endDate: new Date().toISOString().split("T")[0],
          status: MaintenanceStatus.COMPLETED
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this maintenance entry?")) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredLogs = logs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const textStr = `${log.issue} ${log.maintenanceType} ${vehicle?.vehicleName || ""}`;
    return textStr.toLowerCase().includes(search.toLowerCase());
  });

  const totalCost = filteredLogs.reduce((acc, log) => acc + log.cost, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Maintenance & Shop Logs</h2>
          <p className="text-slate-500 text-xs mt-1">Schedule inspections, track repairs, and monitor mechanical downtime costs.</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Shop Repair</span>
          </button>
        )}
      </div>

      {/* Stats Board & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cost widget */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Total Shop Cost (Filtered)</span>
            <span className="font-display font-bold text-xl text-slate-900">${totalCost.toLocaleString()}</span>
          </div>
          <div className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl md:col-span-2 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by issues (manifold, brakes, oil, inspection, align)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Querying shop schedules...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No shop services logged.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="px-6 py-3.5 font-bold">Vehicle</th>
                  <th className="px-6 py-3.5 font-bold">Issue Details</th>
                  <th className="px-6 py-3.5 font-bold">Maintenance Type</th>
                  <th className="px-6 py-3.5 font-bold font-mono">Cost</th>
                  <th className="px-6 py-3.5 font-bold">Timing</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredLogs.map((log) => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-950">{vehicle ? vehicle.vehicleName : "Unknown Vehicle"}</div>
                          <span className="font-mono text-[10px] text-slate-400">{vehicle ? vehicle.registrationNumber : "---"}</span>
                        </div>
                      </td>

                      {/* Issue Details */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800 max-w-sm truncate" title={log.issue}>
                          {log.issue}
                        </p>
                      </td>

                      {/* Maintenance Type */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          log.maintenanceType === "Repair" ? "bg-red-50 text-red-700 border-red-100" :
                          log.maintenanceType === "Routine" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {log.maintenanceType}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        ${log.cost.toLocaleString()}
                      </td>

                      {/* Timing */}
                      <td className="px-6 py-4 font-mono text-[10px] space-y-0.5 text-slate-500">
                        <div>Start: {log.startDate}</div>
                        <div>End: {log.endDate || "In Shop"}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          log.status === MaintenanceStatus.COMPLETED ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          log.status === MaintenanceStatus.IN_PROGRESS ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <>
                              {log.status !== MaintenanceStatus.COMPLETED && (
                                <button
                                  onClick={() => handleResolveLog(log)}
                                  className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-semibold border border-emerald-100 transition-all flex items-center gap-1"
                                  title="Complete & Release Vehicle"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Complete</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenEdit(log)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              >
                                <Hammer className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
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
              {modalMode === "add" ? "Schedule Heavy Maintenance" : "Modify Shop Service Records"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Complete maintenance fields. If set to In Progress, the vehicle is set to In Shop.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Vehicle Select */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT FLEET VEHICLE</label>
                <select
                  value={vehicleId}
                  required
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber}) - {v.status}</option>
                  ))}
                </select>
              </div>

              {/* Issue Details */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">MAINTENANCE ISSUE DESCRIPTION</label>
                <textarea
                  required
                  placeholder="e.g. CDL Pre-trip alignment adjustments or manifold gaskets leak"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Maintenance Type */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">MAINTENANCE CATEGORY</label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Routine">Routine Service</option>
                    <option value="Repair">Critical Repair</option>
                    <option value="Inspection">Inspection Check</option>
                  </select>
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">REPAIR / PARTS COST (USD)</label>
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
                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">START DATE</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">COMPLETED DATE (OPTIONAL)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">MAINTENANCE STATUS</label>
                <select
                  value={mStatus}
                  onChange={(e) => setMStatus(e.target.value as MaintenanceStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={MaintenanceStatus.SCHEDULED}>Scheduled (No state change)</option>
                  <option value={MaintenanceStatus.IN_PROGRESS}>In Progress (Vehicle goes In Shop)</option>
                  <option value={MaintenanceStatus.COMPLETED}>Completed (Vehicle goes Available)</option>
                </select>
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
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
