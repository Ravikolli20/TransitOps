import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, Edit, FileText, Upload, Calendar, Layers, ShieldAlert, X } from "lucide-react";
import { Vehicle, VehicleStatus, UserRole } from "../types.js";

interface VehiclesViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function VehiclesView({ userRole, onRefreshTrigger }: VehiclesViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [error, setError] = useState("");

  // Form Fields
  const [regNum, setRegNum] = useState("");
  const [vName, setVName] = useState("");
  const [vModel, setVModel] = useState("");
  const [vType, setVType] = useState("Semi-Truck");
  const [vLoad, setVLoad] = useState(25000);
  const [vOdo, setVOdo] = useState(120000);
  const [vCost, setVCost] = useState(140000);
  const [vPurchaseDate, setVPurchaseDate] = useState("2025-01-01");
  const [vStatus, setVStatus] = useState<VehicleStatus>(VehicleStatus.AVAILABLE);
  const [vInsurance, setVInsurance] = useState("2027-01-01");
  const [vRegistration, setVRegistration] = useState("2027-01-01");

  // Document attachment simulated field
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("PDF");
  const [showDocUploadId, setShowDocUploadId] = useState<string | null>(null);

  // Check RBAC permissions for edit/write
  const canWrite = userRole === UserRole.ADMIN || userRole === UserRole.FLEET_MANAGER;

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to retire or delete this vehicle from active operations?")) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVehicles();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedVehicleId("");
    setError("");
    setRegNum("");
    setVName("");
    setVModel("");
    setVType("Semi-Truck");
    setVLoad(25000);
    setVOdo(120000);
    setVCost(140000);
    setVPurchaseDate("2025-01-01");
    setVStatus(VehicleStatus.AVAILABLE);
    setVInsurance("2027-01-01");
    setVRegistration("2027-01-01");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setModalMode("edit");
    setSelectedVehicleId(v.id);
    setError("");
    setRegNum(v.registrationNumber);
    setVName(v.vehicleName);
    setVModel(v.model);
    setVType(v.vehicleType);
    setVLoad(v.maxLoadCapacity);
    setVOdo(v.odometer);
    setVCost(v.acquisitionCost);
    setVPurchaseDate(v.purchaseDate);
    setVStatus(v.status);
    setVInsurance(v.insuranceExpiry);
    setVRegistration(v.registrationExpiry);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple standard client side validations
    if (!regNum || !vName || !vModel) {
      setError("Please fill out all required fields.");
      return;
    }

    const payload = {
      id: modalMode === "edit" ? selectedVehicleId : undefined,
      registrationNumber: regNum,
      vehicleName: vName,
      model: vModel,
      vehicleType: vType,
      maxLoadCapacity: Number(vLoad),
      odometer: Number(vOdo),
      acquisitionCost: Number(vCost),
      purchaseDate: vPurchaseDate,
      status: vStatus,
      insuranceExpiry: vInsurance,
      registrationExpiry: vRegistration
    };

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchVehicles();
        onRefreshTrigger();
      } else {
        setError(data.error || "Failed to commit vehicle to registry.");
      }
    } catch (err) {
      setError("Server communications failure.");
    }
  };

  const handleDocUpload = async (e: React.FormEvent, vehicleId: string) => {
    e.preventDefault();
    if (!docName) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: docName, fileType: docType })
      });
      if (res.ok) {
        setDocName("");
        setShowDocUploadId(null);
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search computation
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
                          v.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
                          v.model.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? v.vehicleType === typeFilter : true;
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Vehicle Fleet Registry</h2>
          <p className="text-slate-500 text-xs mt-1">Digitized asset registry containing capacities, registration limits, and maintenance logs.</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Heavy Vehicle</span>
          </button>
        )}
      </div>

      {/* Control Bar: Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration, heavy machinery name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Vehicle Types</option>
            <option value="Semi-Truck">Semi-Trucks</option>
            <option value="Box Truck">Box Trucks</option>
            <option value="Delivery Van">Delivery Vans</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value={VehicleStatus.AVAILABLE}>Available</option>
            <option value={VehicleStatus.ON_TRIP}>On Trip</option>
            <option value={VehicleStatus.IN_SHOP}>In Shop / Repair</option>
            <option value={VehicleStatus.RETIRED}>Retired</option>
          </select>
        </div>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Querying asset files...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No vehicles in active fleet match search parameters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="px-6 py-3.5 font-bold">Registration & Name</th>
                  <th className="px-6 py-3.5 font-bold">Specs</th>
                  <th className="px-6 py-3.5 font-bold">Acquisition / Odometer</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Regulatory Compliance</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredVehicles.map((v) => {
                  const isNearExpiry = new Date(v.registrationExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date(v.insuranceExpiry) < new Date();
                  
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold inline-block mb-1 border border-slate-200">
                            {v.registrationNumber}
                          </span>
                          <div className="font-semibold text-slate-900 text-xs">{v.vehicleName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{v.model}</span>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-medium inline-block">
                            {v.vehicleType}
                          </span>
                          <div className="text-[11px] text-slate-600 font-medium">
                            Cap: <span className="font-mono">{(v.maxLoadCapacity / 1000).toFixed(1)}t</span> ({v.maxLoadCapacity.toLocaleString()} kg)
                          </div>
                        </div>
                      </td>

                      {/* Financial / Odo */}
                      <td className="px-6 py-4 font-mono">
                        <div className="text-[11px] font-semibold text-slate-800">${v.acquisitionCost.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{v.odometer.toLocaleString()} km</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          v.status === VehicleStatus.AVAILABLE
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.status === VehicleStatus.ON_TRIP
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : v.status === VehicleStatus.IN_SHOP
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${
                            v.status === VehicleStatus.AVAILABLE ? "bg-emerald-500" :
                            v.status === VehicleStatus.ON_TRIP ? "bg-blue-500" :
                            v.status === VehicleStatus.IN_SHOP ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          {v.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Regulatory Expiry */}
                      <td className="px-6 py-4 text-[11px] space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Reg:</span>
                          <span className={`font-mono font-medium ${isNearExpiry ? "text-amber-600 font-bold" : "text-slate-700"}`}>
                            {v.registrationExpiry}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Ins:</span>
                          <span className={`font-mono font-medium ${isExpired ? "text-red-600 font-bold" : "text-slate-700"}`}>
                            {v.insuranceExpiry}
                          </span>
                        </div>

                        {/* Documents Section */}
                        {v.documents && v.documents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {v.documents.map((d) => (
                              <span key={d.id} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono inline-flex items-center gap-1" title={d.fileName}>
                                <FileText className="h-2.5 w-2.5 text-indigo-500" />
                                <span className="truncate max-w-[90px]">{d.fileName}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <>
                              {/* Attach document button */}
                              <button
                                onClick={() => setShowDocUploadId(v.id)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                title="Attach documents"
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleOpenEdit(v)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                title="Edit vehicle details"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDelete(v.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                                title="Retire/delete vehicle"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Doc upload toggle form block */}
                        {showDocUploadId === v.id && (
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left absolute right-16 z-10 w-64 shadow-md font-sans">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-slate-700">Attach Official Permit</span>
                              <button onClick={() => setShowDocUploadId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <form onSubmit={(e) => handleDocUpload(e, v.id)} className="space-y-2">
                              <input
                                type="text"
                                placeholder="File Name (e.g. CDL Permit)"
                                value={docName}
                                required
                                onChange={(e) => setDocName(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px]"
                              />
                              <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px]"
                              >
                                <option value="PDF">PDF Document</option>
                                <option value="PNG">PNG Image</option>
                                <option value="EXCEL">Excel Sheet</option>
                              </select>
                              <button type="submit" className="w-full bg-indigo-600 text-white text-[10px] font-medium py-1 rounded hover:bg-indigo-700">
                                Upload File
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
              {modalMode === "add" ? "Register Heavy Vehicle" : "Update Fleet Machinery Specs"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Complete logistical registry specifications correctly below.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Registration Number */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">REGISTRATION NUMBER (UNIQUE)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TX-9921-X"
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">MACHINERY BRAND & NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenworth Sleeper"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Model */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">MODEL CODE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T680 Next Gen"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">VEHICLE TYPE</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Delivery Van">Delivery Van</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Max load */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">LOAD CAPACITY (KG)</label>
                  <input
                    type="number"
                    required
                    value={vLoad}
                    onChange={(e) => setVLoad(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Odometer */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">ODOMETER (KM)</label>
                  <input
                    type="number"
                    required
                    value={vOdo}
                    onChange={(e) => setVOdo(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Acquisition Cost */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">ACQUISITION COST (USD)</label>
                  <input
                    type="number"
                    required
                    value={vCost}
                    onChange={(e) => setVCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Purchase Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">PURCHASE DATE</label>
                  <input
                    type="date"
                    required
                    value={vPurchaseDate}
                    onChange={(e) => setVPurchaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">INITIAL STATUS</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as VehicleStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value={VehicleStatus.AVAILABLE}>Available</option>
                    <option value={VehicleStatus.ON_TRIP}>On Trip</option>
                    <option value={VehicleStatus.IN_SHOP}>In Shop / Maintenance</option>
                    <option value={VehicleStatus.RETIRED}>Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Insurance Expiry */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">INSURANCE EXPIRY</label>
                  <input
                    type="date"
                    required
                    value={vInsurance}
                    onChange={(e) => setVInsurance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Registration Expiry */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">REGISTRATION EXPIRY</label>
                  <input
                    type="date"
                    required
                    value={vRegistration}
                    onChange={(e) => setVRegistration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
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
                  {modalMode === "add" ? "Register Machinery" : "Commit Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
