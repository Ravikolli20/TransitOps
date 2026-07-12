import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.tsx";
import Header from "./components/Header.tsx";
import AuthView from "./components/AuthView.tsx";
import DashboardView from "./components/DashboardView.tsx";
import VehiclesView from "./components/VehiclesView.tsx";
import DriversView from "./components/DriversView.tsx";
import TripsView from "./components/TripsView.tsx";
import MaintenanceView from "./components/MaintenanceView.tsx";
import FuelView from "./components/FuelView.tsx";
import ExpensesView from "./components/ExpensesView.tsx";
import AnalyticsView from "./components/AnalyticsView.tsx";
import ReportsView from "./components/ReportsView.tsx";
import { User, UserRole } from "./types.ts";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Sync session on load
  useEffect(() => {
    const savedToken = localStorage.getItem("transitops_token");
    const savedUser = localStorage.getItem("transitops_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setToken(sessionToken);
    setUser(loggedInUser);
    localStorage.setItem("transitops_token", sessionToken);
    localStorage.setItem("transitops_user", JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
  };

  const handleRoleChange = (nextRole: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role: nextRole };
      setUser(updatedUser);
      localStorage.setItem("transitops_user", JSON.stringify(updatedUser));
    }
  };

  // Triggers state refresh across components on state transitions (e.g. dispatching)
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleResetDB = async () => {
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      if (res.ok) {
        triggerRefresh();
        alert("Database returned to default seeds.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Non-authenticated View
  if (!token || !user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
      
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={user.role}
        onRoleChange={handleRoleChange}
      />

      {/* Main Terminal Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Terminal Header */}
        <Header
          user={user}
          onLogout={handleLogout}
          onResetDB={handleResetDB}
        />

        {/* View Workspace panel */}
        <main id="transitops-workspace" className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {currentTab === "dashboard" && (
              <DashboardView onRefreshTrigger={refreshKey} />
            )}

            {currentTab === "vehicles" && (
              <VehiclesView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "drivers" && (
              <DriversView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "trips" && (
              <TripsView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "maintenance" && (
              <MaintenanceView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "fuel" && (
              <FuelView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "expenses" && (
              <ExpensesView userRole={user.role} onRefreshTrigger={triggerRefresh} />
            )}

            {currentTab === "analytics" && (
              <AnalyticsView />
            )}

            {currentTab === "reports" && (
              <ReportsView />
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
