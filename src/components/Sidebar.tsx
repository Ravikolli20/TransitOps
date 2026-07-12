import React from "react";
import { 
  LayoutDashboard, Truck, Users, MapPin, Wrench, 
  Flame, DollarSign, BarChart3, FileText, Lock, ShieldCheck 
} from "lucide-react";
import { UserRole } from "../types.js";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  allowedRoles: UserRole[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.SAFETY_OFFICER, UserRole.FINANCIAL_ANALYST] },
  { id: "vehicles", label: "Vehicle Fleet", icon: Truck, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER] },
  { id: "drivers", label: "Driver Registry", icon: Users, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.SAFETY_OFFICER] },
  { id: "trips", label: "Trip Dispatch", icon: MapPin, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER] },
  { id: "maintenance", label: "Maintenance", icon: Wrench, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER] },
  { id: "fuel", label: "Fuel Tracking", icon: Flame, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.SAFETY_OFFICER] },
  { id: "expenses", label: "Expense Board", icon: DollarSign, allowedRoles: [UserRole.ADMIN, UserRole.FINANCIAL_ANALYST] },
  { id: "analytics", label: "Operations Analytics", icon: BarChart3, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER, UserRole.FINANCIAL_ANALYST] },
  { id: "reports", label: "Reporting Center", icon: FileText, allowedRoles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST] }
];

export default function Sidebar({ currentTab, setCurrentTab, userRole, onRoleChange }: SidebarProps) {
  const handleItemClick = (item: MenuItem) => {
    if (item.allowedRoles.includes(userRole)) {
      setCurrentTab(item.id);
    }
  };

  return (
    <aside id="transitops-sidebar" className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs select-none">TO</div>
          <div>
            <h1 className="font-display font-bold text-base tracking-tight text-white leading-none">TransitOps</h1>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider block mt-1 uppercase">Enterprise OS</span>
          </div>
        </div>
      </div>

      {/* Role-Based Impersonation Dropdown (The RBAC Sandbox Controller) */}
      <div className="px-4 py-4 border-b border-slate-800/60 bg-slate-950/40">
        <label className="block text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-400" /> ACTIVE SECURITY ROLE
        </label>
        <select
          value={userRole}
          onChange={(e) => {
            const nextRole = e.target.value as UserRole;
            onRoleChange(nextRole);
            // Auto redirect if current tab is forbidden
            const allowedTabs = MENU_ITEMS.filter(item => item.allowedRoles.includes(nextRole)).map(item => item.id);
            if (!allowedTabs.includes(currentTab)) {
              setCurrentTab("dashboard");
            }
          }}
          className="w-full bg-slate-800 text-xs border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value={UserRole.ADMIN}>Admin (Superuser)</option>
          <option value={UserRole.FLEET_MANAGER}>Fleet Manager</option>
          <option value={UserRole.DISPATCHER}>Dispatcher</option>
          <option value={UserRole.SAFETY_OFFICER}>Safety Officer</option>
          <option value={UserRole.FINANCIAL_ANALYST}>Financial Analyst</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1.5 italic font-sans leading-normal">
          Toggle above to view permission-restricted fields, tabs, and action controls.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const isAllowed = item.allowedRoles.includes(userRole);
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={!isAllowed}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-400"
                  : isAllowed
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-400" : isAllowed ? "text-slate-400" : "text-slate-700"}`} />
                <span>{item.label}</span>
              </span>
              {!isAllowed && (
                <Lock className="h-3.5 w-3.5 text-slate-700 shrink-0" title="Restricted Access" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
        v1.0.4-RELEASE &copy; 2026
      </div>
    </aside>
  );
}
