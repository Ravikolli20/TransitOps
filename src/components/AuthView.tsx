import React, { useState } from "react";
import { Truck, Mail, Lock, User, ArrowRight, CornerDownRight, CheckCircle2, Shield } from "lucide-react";
import { UserRole } from "../types.js";

interface AuthViewProps {
  onLoginSuccess: (user: any, token: string) => void;
}

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setTimeout(() => setMode("reset"), 1500);
      } else {
        setError(data.error || "Operation failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "mock-reset-token", newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setTimeout(() => setMode("login"), 1500);
      } else {
        setError(data.error || "Reset failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const demoAccounts = [
    { label: "Admin (All Access)", email: "admin@transitops.com", role: "ADMIN" },
    { label: "Fleet Manager", email: "manager@transitops.com", role: "FLEET_MANAGER" },
    { label: "Dispatcher", email: "dispatcher@transitops.com", role: "DISPATCHER" },
    { label: "Safety Officer", email: "safety@transitops.com", role: "SAFETY_OFFICER" },
    { label: "Financial Analyst", email: "analyst@transitops.com", role: "FINANCIAL_ANALYST" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      
      {/* Left side: branding and description */}
      <div className="md:w-1/2 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-8 md:p-16 flex flex-col justify-between text-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
            <Truck className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">TransitOps</span>
        </div>

        <div className="my-12 max-w-md">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-6 leading-tight">
            The Intelligent Operating System for Enterprise Logistics.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Streamline fleet distribution, driver compliance rosters, real-time maintenance workflows, fuel logging records, and active profitability modeling in a secure, unified workspace.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Full Role-Based Access Control (RBAC) with 5 tailored views.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Safety validation safeguards for dispatch and operations.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Real-time profitability, cost per-km, and fleet ROI analytics.</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono tracking-wide">
          TRANSITOPS ENTERPRISE CORE ENGINE &bull; VERSION 1.0.4
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-white">
              {mode === "login" && "Sign In to Terminal"}
              {mode === "register" && "Create Operator Profile"}
              {mode === "forgot" && "Reset Operations Credentials"}
              {mode === "reset" && "Establish New Security Key"}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              {mode === "login" && "Select an official system email below or enter custom credentials."}
              {mode === "register" && "Assign roles carefully. Access permissions will match your security level."}
              {mode === "forgot" && "Provide your registry email. An auth confirmation token will be supplied."}
              {mode === "reset" && "Establish a robust new security code for your operations account."}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-200 text-xs px-4 py-3 rounded-lg mb-6 leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form blocks */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">REGISTRY EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., admin@transitops.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-mono text-slate-400">SECURITY CODE</label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot Code?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Authorize Access</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">FULL LEGAL NAME</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Captain Robert Vance"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">OFFICIAL EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., r.vance@transitops.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-indigo-400" /> SYSTEM DEPLOYMENT ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={UserRole.ADMIN}>Admin (Full Control)</option>
                  <option value={UserRole.FLEET_MANAGER}>Fleet Manager (Logistics)</option>
                  <option value={UserRole.DISPATCHER}>Dispatcher (Assignments)</option>
                  <option value={UserRole.SAFETY_OFFICER}>Safety Officer (Compliance)</option>
                  <option value={UserRole.FINANCIAL_ANALYST}>Financial Analyst (Expenses)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Register Operator Profile</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">REGISTRY EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registry email address"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Transmit Authorization Code</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">NEW SECURITY PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Finalize Password Key</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Toggle modes */}
          <div className="mt-8 pt-6 border-t border-slate-900 text-center text-xs space-x-2">
            {mode === "login" ? (
              <p className="text-slate-500">
                Need operator clearance?{" "}
                <button onClick={() => setMode("register")} className="text-indigo-400 hover:underline">
                  Create Profile
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                Already registered?{" "}
                <button onClick={() => setMode("login")} className="text-indigo-400 hover:underline">
                  Sign In
                </button>
              </p>
            )}
          </div>

          {/* Quick-select Demo Sandbox Accounts */}
          {mode === "login" && (
            <div className="mt-8 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase block mb-3">
                Operator Sandbox Accounts
              </span>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword("demoPassword123");
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/40 hover:border-indigo-500 hover:bg-slate-900 transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{account.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{account.email}</span>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-indigo-300 font-mono px-1.5 py-0.5 rounded uppercase">
                      {account.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
