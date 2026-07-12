import { useState, useEffect } from "react";
import { Bell, RefreshCw, LogOut, CheckCircle2, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { User, SystemNotification, UserRole } from "../types.js";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onResetDB: () => void;
}

export default function Header({ user, onLogout, onResetDB }: HeaderProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the database to factory defaults? All manual edits will be re-seeded.")) {
      setLoading(true);
      await onResetDB();
      await fetchNotifications();
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header id="transitops-header" className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-sm">
      {/* Title Area */}
      <div className="flex items-center gap-3">
        <h2 className="font-display font-semibold text-slate-800 text-sm md:text-base tracking-tight">
          Operational Terminal
        </h2>
        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded uppercase font-bold tracking-wider hidden sm:inline-block">
          Region: North America
        </span>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-6">
        {/* Reset Database Button */}
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
          title="Reset database to fresh default state"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span className="hidden sm:inline">Reset Fleet DB</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Safety & Compliance Alerts</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono">
                  {unreadCount} New
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active warnings or notices.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === "error" ? (
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                        ) : n.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-medium text-slate-800 truncate">{n.title}</p>
                          {!n.read && <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Info */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{user.role.replace("_", " ")}</div>
            </div>
            
            {/* Simple Letter Avatar */}
            <div className="h-8.5 w-8.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200">
              {user.name.charAt(0)}
            </div>

            {/* Logout Trigger */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ml-1"
              title="Sign Out of Terminal"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
