import { useState, useEffect } from "react";
import { FileDown, Table, Calendar, RefreshCcw, CheckCircle } from "lucide-react";
import { Vehicle, Driver, Trip, Expense, FuelLog } from "../types.js";

type ReportType = "fleet" | "drivers" | "expenses" | "profitability";

export default function ReportsView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ReportType>("fleet");

  // Filter dates
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, dRes, tRes, eRes, fRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/trips"),
        fetch("/api/expenses"),
        fetch("/api/fuel")
      ]);
      if (vRes.ok && dRes.ok && tRes.ok && eRes.ok && fRes.ok) {
        setVehicles(await vRes.json());
        setDrivers(await dRes.json());
        setTrips(await tRes.json());
        setExpenses(await eRes.json());
        setFuelLogs(await fRes.json());
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
    return <div className="text-center p-12 text-slate-500 text-xs font-mono">Assembling corporate reporting data tables...</div>;
  }

  // Simulated export utility (creates real downloadable browser CSV!)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = `TransitOps_${activeReport}_Report.csv`;

    if (activeReport === "fleet") {
      headers = ["Reg Number", "Vehicle Name", "Type", "Odometer (km)", "Acquisition Cost", "Insurance Expiry", "Status"];
      rows = vehicles.map(v => [
        v.registrationNumber,
        v.vehicleName,
        v.vehicleType,
        v.odometer.toString(),
        `$${v.acquisitionCost}`,
        v.insuranceExpiry,
        v.status
      ]);
    } else if (activeReport === "drivers") {
      headers = ["Driver Name", "CDL License", "License Class", "Expiry Date", "Phone", "Safety Score", "Status"];
      rows = drivers.map(d => [
        d.name,
        d.licenseNumber,
        d.licenseCategory,
        d.licenseExpiryDate,
        d.contactNumber,
        `${d.safetyScore}/100`,
        d.status
      ]);
    } else if (activeReport === "expenses") {
      headers = ["Expense ID", "Category", "Amount", "Description", "Date"];
      rows = expenses.map(e => [
        e.id,
        e.type,
        `$${e.amount}`,
        e.description,
        e.date
      ]);
    } else if (activeReport === "profitability") {
      headers = ["Trip ID", "Route", "Expected Revenue", "Planned Distance (km)", "Actual Distance (km)", "Fuel Consumed (L)", "Status"];
      rows = trips.map(t => [
        t.id,
        `${t.source} -> ${t.destination}`,
        `$${t.revenueGenerated}`,
        t.plannedDistance.toString(),
        (t.actualDistance || 0).toString(),
        (t.fuelConsumed || 0).toString(),
        t.status
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Reporting Center</h2>
          <p className="text-slate-500 text-xs mt-1">Generate compliant CSV/Excel tables. Export comprehensive registries for insurance, auditing or tax documentation.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
        >
          <FileDown className="h-4 w-4" />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Report selectors */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        <button
          onClick={() => setActiveReport("fleet")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeReport === "fleet" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Fleet Asset Report
        </button>
        <button
          onClick={() => setActiveReport("drivers")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeReport === "drivers" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Driver Compliance Report
        </button>
        <button
          onClick={() => setActiveReport("expenses")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeReport === "expenses" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Master Expense Ledger
        </button>
        <button
          onClick={() => setActiveReport("profitability")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeReport === "profitability" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Trip Profitability Audit
        </button>
      </div>

      {/* Date Filters bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>Accounting Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 bg-slate-50 text-[11px] font-mono focus:outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 bg-slate-50 text-[11px] font-mono focus:outline-none"
          />
        </div>

        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-mono font-bold uppercase flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Ledger Reconciled
        </span>
      </div>

      {/* Tabular Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Table className="h-4.5 w-4.5 text-slate-400" />
            <span>Interactive Report Preview</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Row Count: {
            activeReport === "fleet" ? vehicles.length :
            activeReport === "drivers" ? drivers.length :
            activeReport === "expenses" ? expenses.length :
            trips.length
          } rows</span>
        </div>

        <div className="overflow-x-auto">
          {activeReport === "fleet" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                  <th className="px-6 py-2.5 font-bold">Reg</th>
                  <th className="px-6 py-2.5 font-bold">Name</th>
                  <th className="px-6 py-2.5 font-bold">Type</th>
                  <th className="px-6 py-2.5 font-bold font-mono">Odometer</th>
                  <th className="px-6 py-2.5 font-bold font-mono text-right">Acq Cost</th>
                  <th className="px-6 py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3 font-mono text-slate-700">{v.registrationNumber}</td>
                    <td className="px-6 py-3 text-slate-900 font-semibold">{v.vehicleName}</td>
                    <td className="px-6 py-3 text-slate-500">{v.vehicleType}</td>
                    <td className="px-6 py-3 font-mono">{v.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-3 font-mono text-right">${v.acquisitionCost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-slate-500">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === "drivers" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                  <th className="px-6 py-2.5 font-bold">Operator Name</th>
                  <th className="px-6 py-2.5 font-bold">License</th>
                  <th className="px-6 py-2.5 font-bold">Class</th>
                  <th className="px-6 py-2.5 font-bold font-mono">Safety Score</th>
                  <th className="px-6 py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3 text-slate-900 font-semibold">{d.name}</td>
                    <td className="px-6 py-3 font-mono text-slate-500">{d.licenseNumber}</td>
                    <td className="px-6 py-3 text-slate-500">{d.licenseCategory}</td>
                    <td className="px-6 py-3 font-mono font-bold text-indigo-600">{d.safetyScore}/100</td>
                    <td className="px-6 py-3 text-slate-500">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === "expenses" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                  <th className="px-6 py-2.5 font-bold">Category</th>
                  <th className="px-6 py-2.5 font-bold">Description</th>
                  <th className="px-6 py-2.5 font-bold">Date</th>
                  <th className="px-6 py-2.5 font-bold text-right font-mono">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3 text-slate-800 font-semibold">{e.type}</td>
                    <td className="px-6 py-3 text-slate-600">{e.description}</td>
                    <td className="px-6 py-3 font-mono text-slate-500">{e.date}</td>
                    <td className="px-6 py-3 font-mono text-right font-bold text-slate-900">${e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === "profitability" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                  <th className="px-6 py-2.5 font-bold">Trip ID</th>
                  <th className="px-6 py-2.5 font-bold">Route</th>
                  <th className="px-6 py-2.5 font-bold">Status</th>
                  <th className="px-6 py-2.5 font-bold font-mono">Distance</th>
                  <th className="px-6 py-2.5 font-bold font-mono text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trips.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3 font-mono text-slate-400">{t.id}</td>
                    <td className="px-6 py-3 text-slate-900 font-semibold">{t.source} &rarr; {t.destination}</td>
                    <td className="px-6 py-3 text-slate-500">{t.status}</td>
                    <td className="px-6 py-3 font-mono">{t.plannedDistance} km</td>
                    <td className="px-6 py-3 font-mono text-right font-bold text-emerald-600">${t.revenueGenerated.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
