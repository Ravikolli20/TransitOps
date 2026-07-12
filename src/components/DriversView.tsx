import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, AlertTriangle, CheckCircle2, ShieldAlert, Phone, ShieldCheck, X } from "lucide-react";
import { Driver, DriverStatus, UserRole } from "../types.js";

interface DriversViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function DriversView({ userRole, onRefreshTrigger }: DriversViewProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [error, setError] = useState("");

  // Form states
  const [dName, setDName] = useState("");
  const [dLicense, setDLicense] = useState("");
  const [dCategory, setDCategory] = useState("Class A CDL");
  const [dExpiry, setDExpiry] = useState("2027-01-01");
  const [dContact, setDContact] = useState("");
  const [dEmergency, setDEmergency] = useState("");
  const [dScore, setDScore] = useState(95);
  const [dStatus, setDStatus] = useState<DriverStatus>(DriverStatus.AVAILABLE);

  // Check RBAC
  const canWrite = userRole === UserRole.ADMIN || userRole === UserRole.FLEET_MANAGER || userRole === UserRole.SAFETY_OFFICER;

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers");
      if (res.ok) {
        setDrivers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to dismiss this driver from the active operations roster?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDrivers();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedDriverId("");
    setError("");
    setDName("");
    setDLicense("");
    setDCategory("Class A CDL");
    setDExpiry("2027-12-31");
    setDContact("");
    setDEmergency("");
    setDScore(95);
    setDStatus(DriverStatus.AVAILABLE);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setModalMode("edit");
    setSelectedDriverId(d.id);
    setError("");
    setDName(d.name);
    setDLicense(d.licenseNumber);
    setDCategory(d.licenseCategory);
    setDExpiry(d.licenseExpiryDate);
    setDContact(d.contactNumber);
    setDEmergency(d.emergencyContact);
    setDScore(d.safetyScore);
    setDStatus(d.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dName || !dLicense || !dContact) {
      setError("Please fill out Name, License Number, and Contact Number.");
      return;
    }

    const payload = {
      id: modalMode === "edit" ? selectedDriverId : undefined,
      name: dName,
      licenseNumber: dLicense,
      licenseCategory: dCategory,
      licenseExpiryDate: dExpiry,
      contactNumber: dContact,
      emergencyContact: dEmergency,
      safetyScore: Number(dScore),
      status: dStatus
    };

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchDrivers();
        onRefreshTrigger();
      } else {
        setError(data.error || "Failed to commit driver record.");
      }
    } catch (err) {
      setError("Communication failed with server.");
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
                          d.contactNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Roster */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Driver Compliance Registry</h2>
          <p className="text-slate-500 text-xs mt-1">Manage driver files, licensing CDL compliance, emergency contacts, and commercial safety scores.</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Commercial Driver</span>
          </button>
        )}
      </div>

      {/* Control Roster */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers by name, CDL license numbers, contact phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Driver Statuses</option>
            <option value={DriverStatus.AVAILABLE}>Available</option>
            <option value={DriverStatus.ON_TRIP}>On Active Trip</option>
            <option value={DriverStatus.OFF_DUTY}>Off Duty / Rest</option>
            <option value={DriverStatus.SUSPENDED}>Suspended</option>
          </select>
        </div>
      </div>

      {/* Driver List Display */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Querying driver registries...</div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No commercial operators on roster match search queries.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((d) => {
            const isLicenseNearExpiry = new Date(d.licenseExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const isLicenseExpired = new Date(d.licenseExpiryDate) < new Date();
            
            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                
                {/* Score highlight on border */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  d.safetyScore >= 90 ? "bg-emerald-500" :
                  d.safetyScore >= 75 ? "bg-indigo-500" :
                  d.safetyScore >= 60 ? "bg-amber-500" : "bg-red-500"
                }`} />

                <div>
                  {/* Status & Category */}
                  <div className="flex justify-between items-start mb-3 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                      {d.licenseCategory}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      d.status === DriverStatus.AVAILABLE ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      d.status === DriverStatus.ON_TRIP ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      d.status === DriverStatus.OFF_DUTY ? "bg-slate-100 text-slate-600 border border-slate-200" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {d.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Driver Name & CDL */}
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">{d.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">License: {d.licenseNumber}</p>
                  </div>

                  {/* Expiry Alerts */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] bg-slate-50/80 p-2 rounded border border-slate-100">
                      <span className="text-slate-500">License Expiry:</span>
                      <span className={`font-mono font-semibold flex items-center gap-1 ${
                        isLicenseExpired ? "text-red-600" :
                        isLicenseNearExpiry ? "text-amber-600" : "text-slate-700"
                      }`}>
                        {isLicenseExpired && <ShieldAlert className="h-3 w-3 text-red-500" />}
                        {isLicenseNearExpiry && !isLicenseExpired && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        {d.licenseExpiryDate}
                      </span>
                    </div>

                    {/* Contacts info */}
                    <div className="text-[11px] text-slate-600 space-y-1 pl-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{d.contactNumber}</span>
                      </div>
                      {d.emergencyContact && (
                        <div className="text-[10px] text-slate-400 italic">
                          Emg: {d.emergencyContact}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Safety Score meter */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Safety Score:</span>
                    <span className={`font-mono text-sm font-bold ${
                      d.safetyScore >= 90 ? "text-emerald-600" :
                      d.safetyScore >= 75 ? "text-indigo-600" :
                      d.safetyScore >= 60 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {d.safetyScore}/100
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {canWrite && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Driver"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="De-register Driver"
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

      {/* Driver Add/Edit Modal */}
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
              {modalMode === "add" ? "Roster New Operator" : "Modify Operator Compliance Specifications"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Complete all driver licensing documentation records carefully.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">FULL LEGAL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain James Logan"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* License Number */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">CDL LICENSE NUMBER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CDL-TX-8871"
                    value={dLicense}
                    onChange={(e) => setDLicense(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">CDL CATEGORY CLASS</label>
                  <select
                    value={dCategory}
                    onChange={(e) => setDCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Class A CDL">Class A CDL (Semi-Tractor Trailer)</option>
                    <option value="Class B CDL">Class B CDL (Single Heavy/Box)</option>
                    <option value="Class C CDL">Class C CDL (Delivery/Hazmat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">CDL EXPIRY DATE</label>
                  <input
                    type="date"
                    required
                    value={dExpiry}
                    onChange={(e) => setDExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Safety Score */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">SAFETY SCORE COMPLIANCE (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={dScore}
                    onChange={(e) => setDScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contact Phone */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">CONTACT PHONE NUMBER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 321-9876"
                    value={dContact}
                    onChange={(e) => setDContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">EMERGENCY CONTACT NAME & PHONE</label>
                  <input
                    type="text"
                    placeholder="e.g. Helen (Wife) - +1 (555)..."
                    value={dEmergency}
                    onChange={(e) => setDEmergency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">ACTIVE STATUS</label>
                <select
                  value={dStatus}
                  onChange={(e) => setDStatus(e.target.value as DriverStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={DriverStatus.AVAILABLE}>Available / Off-Duty</option>
                  <option value={DriverStatus.ON_TRIP}>On Trip (Assigned)</option>
                  <option value={DriverStatus.OFF_DUTY}>Off Duty / Rest</option>
                  <option value={DriverStatus.SUSPENDED}>Suspended / Non-Compliant</option>
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
                  {modalMode === "add" ? "Register Operator" : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
