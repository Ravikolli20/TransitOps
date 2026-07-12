import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, DollarSign, Wallet, FileSpreadsheet, Lock, Sparkles, X } from "lucide-react";
import { Expense, ExpenseType, UserRole } from "../types.js";

interface ExpensesViewProps {
  userRole: UserRole;
  onRefreshTrigger: () => void;
}

export default function ExpensesView({ userRole, onRefreshTrigger }: ExpensesViewProps) {
  // Master RBAC Guard inside the component itself
  const isAuthorized = userRole === UserRole.ADMIN || userRole === UserRole.FINANCIAL_ANALYST;

  if (!isAuthorized) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm mt-8">
        <div className="mx-auto w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-500">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base">Security Clearance Required</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The Expense Board contains sensitive commercial billing logs. Your active security level (<span className="font-mono text-indigo-600 font-semibold uppercase">{userRole.replace("_", " ")}</span>) has read access suspended.
          </p>
        </div>
        <p className="text-[10px] text-slate-400 font-mono leading-normal">
          Toggle the active security role in the left sidebar to Admin or Financial Analyst to unlock billing registers.
        </p>
      </div>
    );
  }

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [expType, setExpType] = useState<ExpenseType>(ExpenseType.TOLL);
  const [amount, setAmount] = useState(120);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description || !amount) {
      setError("Please fill out Description and Amount.");
      return;
    }

    const payload = {
      type: expType,
      amount: Number(amount),
      description,
      date
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadExpenses();
        onRefreshTrigger();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to log expense.");
      }
    } catch (err) {
      setError("Server error.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently void this expense record?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadExpenses();
        onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? exp.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const totalSum = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-950">Expense Management Board</h2>
          <p className="text-slate-500 text-xs mt-1">Audit operational expenses including highway tolls, repair shops, compounds, and fuel billing logs.</p>
        </div>

        <button
          onClick={() => {
            setError("");
            setDescription("");
            setAmount(120);
            setExpType(ExpenseType.TOLL);
            setDate(new Date().toISOString().split("T")[0]);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Record Cost Log</span>
        </button>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total sum */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Total Expenditures (Filtered)</span>
            <span className="font-display font-bold text-xl text-slate-900">${totalSum.toLocaleString()}</span>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl md:col-span-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search descriptions, locations, fuel suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium w-full sm:w-auto focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Cost Accounts</option>
            <option value={ExpenseType.TOLL}>Highway Toll Tags</option>
            <option value={ExpenseType.MAINTENANCE}>Regular Inspections</option>
            <option value={ExpenseType.REPAIRS}>Critical Shop Repairs</option>
            <option value={ExpenseType.FUEL}>Diesel & Energy Refuels</option>
            <option value={ExpenseType.PARKING}>Compound Parking</option>
            <option value={ExpenseType.MISCELLANEOUS}>Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Expense ledger list */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 text-xs font-mono">Connecting financial billing journals...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No cost ledger lines match search query parameters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="px-6 py-3.5 font-bold">Ledger ID</th>
                  <th className="px-6 py-3.5 font-bold">Expense Description</th>
                  <th className="px-6 py-3.5 font-bold">Cost Category</th>
                  <th className="px-6 py-3.5 font-bold">Transaction Date</th>
                  <th className="px-6 py-3.5 font-bold font-mono text-right">Amount (USD)</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-semibold">
                      {exp.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-850 text-xs">{exp.description}</div>
                        {exp.tripId && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded mt-1 inline-block">
                            Linked Trip: {exp.tripId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        exp.type === ExpenseType.FUEL ? "bg-orange-50 text-orange-700 border-orange-100" :
                        exp.type === ExpenseType.REPAIRS ? "bg-red-50 text-red-700 border-red-100" :
                        exp.type === ExpenseType.MAINTENANCE ? "bg-amber-50 text-amber-700 border-amber-100" :
                        exp.type === ExpenseType.TOLL ? "bg-blue-50 text-blue-700 border-blue-100" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                      {exp.date}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-right text-slate-900 text-xs">
                      ${exp.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Void billing line"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Cost Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
              Record Operations Cost
            </h3>
            <p className="text-xs text-slate-500 mb-4">Complete cost details carefully. Verified values immediately update ROI parameters.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Cost Category */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">COST ACCOUNT CATEGORY</label>
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value as ExpenseType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={ExpenseType.TOLL}>Highway Toll Tags</option>
                  <option value={ExpenseType.REPAIRS}>Critical Shop Repairs</option>
                  <option value={ExpenseType.MAINTENANCE}>Routine Maintenance</option>
                  <option value={ExpenseType.PARKING}>Compound Overnight Parking</option>
                  <option value={ExpenseType.FUEL}>Fuel & Energy Purchases</option>
                  <option value={ExpenseType.MISCELLANEOUS}>Miscellaneous Operations</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">TRANSACTION AMOUNT (USD)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">BILLING MEMO / DESCRIPTION</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compound parking Dallas terminal I-45"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">TRANSACTION DATE</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
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
                  Commit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
