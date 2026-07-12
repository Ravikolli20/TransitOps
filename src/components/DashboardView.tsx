import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Truck, Users, MapPin, 
  Wrench, Flame, DollarSign, Percent, ArrowUpRight, Filter, RefreshCcw 
} from "lucide-react";

interface DashboardViewProps {
  onRefreshTrigger?: number;
}

export default function DashboardView({ onRefreshTrigger = 0 }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [vehicleType, setVehicleType] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState("all");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (vehicleType) params.append("vehicleType", vehicleType);
      if (status) params.append("status", status);
      if (dateRange) params.append("dateRange", dateRange);

      const [statsRes, chartsRes] = await Promise.all([
        fetch(`/api/dashboard/stats?${params.toString()}`),
        fetch(`/api/dashboard/charts?${params.toString()}`)
      ]);

      if (statsRes.ok && chartsRes.ok) {
        setStats(await statsRes.json());
        setCharts(await chartsRes.json());
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [vehicleType, status, dateRange, onRefreshTrigger]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-500 text-xs mt-3 font-mono">Synchronizing telemetry data...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Active Vehicles", value: stats?.activeVehicles ?? 0, icon: Truck, color: "text-indigo-600 bg-indigo-50 border-indigo-100", trend: "+2 this week", isUp: true },
    { label: "Available Fleet", value: stats?.availableVehicles ?? 0, icon: Truck, color: "text-emerald-600 bg-emerald-50 border-emerald-100", trend: "Ready to dispatch", isUp: true },
    { label: "In Repair Shop", value: stats?.vehiclesInMaintenance ?? 0, icon: Wrench, color: "text-amber-600 bg-amber-50 border-amber-100", trend: "Active service logs", isUp: false },
    { label: "Active Trips", value: stats?.activeTrips ?? 0, icon: MapPin, color: "text-blue-600 bg-blue-50 border-blue-100", trend: "Real-time dispatch", isUp: true },
    { label: "Pending Drafts", value: stats?.pendingTrips ?? 0, icon: MapPin, color: "text-slate-500 bg-slate-50 border-slate-100", trend: "In scheduling queue", isUp: null },
    { label: "Drivers On Duty", value: stats?.driversOnDuty ?? 0, icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100", trend: "Active driver logs", isUp: true },
    { label: "Fleet Utilization", value: `${stats?.fleetUtilization ?? 0}%`, icon: Percent, color: "text-pink-600 bg-pink-50 border-pink-100", trend: "Target rate: 85%", isUp: true },
    { label: "Total Revenue", value: `$${(stats?.revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-violet-600 bg-violet-50 border-violet-100", trend: "Active operations", isUp: true },
    { label: "Fuel Expenses", value: `$${(stats?.fuelCost ?? 0).toLocaleString()}`, icon: Flame, color: "text-orange-600 bg-orange-50 border-orange-100", trend: "Avg: $3.80/L", isUp: false },
    { label: "Repair Expenses", value: `$${(stats?.maintenanceCost ?? 0).toLocaleString()}`, icon: Wrench, color: "text-red-600 bg-red-50 border-red-100", trend: "Preventative & Repairs", isUp: false },
    { label: "Profit Margin", value: `${stats?.profitMargin ?? 0}%`, icon: Percent, color: "text-teal-600 bg-teal-50 border-teal-100", trend: "Optimal profit metrics", isUp: true }
  ];

  const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">
            Control Dashboard
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Real-time logistical analytics, expense structures, and vehicle deployment metrics.
          </p>
        </div>

        {/* Filters control bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pr-2 border-r border-slate-200">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold hidden lg:inline">Filters:</span>
          </div>

          {/* Vehicle Type Filter */}
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Vehicles</option>
            <option value="Semi-Truck">Semi-Trucks</option>
            <option value="Box Truck">Box Trucks</option>
            <option value="Delivery Van">Delivery Vans</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">Lifetime Range</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="6months">Past 6 Months</option>
          </select>

          {/* Clear Filters */}
          {(vehicleType || dateRange !== "all") && (
            <button
              onClick={() => {
                setVehicleType("");
                setDateRange("all");
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Reset Filters"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm transition-transform hover:-translate-y-0.5 ${
                i >= 8 ? "col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide truncate">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 truncate">
                {kpi.isUp === true && <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />}
                {kpi.isUp === false && <TrendingDown className="h-3 w-3 text-amber-500 shrink-0" />}
                <span>{kpi.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue vs Expense Trend Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue vs Expense Trends</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Comparative operations profitability over consecutive months</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">USD</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            {charts?.revenueTrends ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" name="Operational Cost" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chart metrics available.</div>
            )}
          </div>
        </div>

        {/* Monthly Fuel Expenses Bar Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Monthly Fuel Expenditure</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Aggregate fuel logging costs across the logistics network</p>
            </div>
            <span className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-semibold">DIESEL</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            {charts?.monthlyFuel ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyFuel} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value) => [`$${value}`, "Fuel Cost"]} />
                  <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} name="Fuel Expense ($)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chart metrics available.</div>
            )}
          </div>
        </div>

        {/* Cost Allocation Pie Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col h-[320px]">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5">Operational Cost Allocation</h3>
            <p className="text-[10px] text-slate-400">Distribution of expenditures by operations categories</p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
            <div className="w-[180px] h-[180px]">
              {charts?.costTrends ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.costTrends}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charts.costTrends.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No metrics.</div>
              )}
            </div>

            {/* Legends */}
            <div className="flex-1 space-y-2 max-w-[200px]">
              {charts?.costTrends?.map((item: any, index: number) => {
                const total = charts.costTrends.reduce((acc: number, c: any) => acc + c.value, 0);
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-2 text-slate-600 truncate max-w-[120px]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono text-slate-800 shrink-0">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fleet Utilization Rate Line Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Fleet Utilization Metrics</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Calculated active vehicle dispatch ratios across months</p>
            </div>
            <span className="text-[10px] font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded font-semibold">% RATE</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            {charts?.vehicleUtilization ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.vehicleUtilization} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Utilization Rate"]} />
                  <Line type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={2.5} activeDot={{ r: 6 }} name="Utilization Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chart metrics available.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
