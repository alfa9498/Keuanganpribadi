import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Save,
  RefreshCw,
  Edit3,
  History,
  Info,
} from "lucide-react";
import {
  fetchMonthlyBudgets,
  setBudget,
  toggleRollover,
} from "../../services/budgetService";
import { Badge } from "../atoms/Badge";

export const BudgetPage = ({ user }) => {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // ID of the category being saved
  const [toggling, setToggling] = useState(null); // ID of category being toggled
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    if (user?.id && month) {
      loadBudgets();
    }
  }, [user, month]);

  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const result = await fetchMonthlyBudgets(user.id, month);
      if (result.success) {
        setBudgets(result.data);
      }
    } catch (error) {
      console.error("Failed to load budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (categoryId, value) => {
    const updatedBudgets = budgets.map((b) =>
      b.category_id === categoryId
        ? { ...b, budget_amount: value, isModified: true }
        : b,
    );
    setBudgets(updatedBudgets);
  };

  const handleSaveBudget = async (category) => {
    setSaving(category.category_id);
    try {
      const result = await setBudget(
        user.id,
        category.category_id,
        category.budget_amount,
        month,
      );
      if (result.success) {
        // Remove modified flag
        setBudgets(
          budgets.map((b) =>
            b.category_id === category.category_id
              ? { ...b, isModified: false }
              : b,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleRollover = async (category) => {
    setToggling(category.category_id);
    try {
      const newStatus = !category.is_rollover;
      const result = await toggleRollover(category.category_id, newStatus);
      if (result) {
        // Refresh budgets to get new rollover balance
        await loadBudgets();
      }
    } catch (error) {
      console.error("Failed to toggle rollover:", error);
    } finally {
      setToggling(null);
    }
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const nextMonth = () => {
    const date = new Date(month + "-01");
    date.setMonth(date.getMonth() + 1);
    setMonth(date.toISOString().substring(0, 7));
  };

  const prevMonth = () => {
    const date = new Date(month + "-01");
    date.setMonth(date.getMonth() - 1);
    setMonth(date.toISOString().substring(0, 7));
  };

  const filteredBudgets = budgets.filter(
    (b) =>
      (b.category_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (b.group_name &&
        b.group_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Grouping logic
  const groupedBudgets = useMemo(() => {
    return filteredBudgets.reduce((acc, budget) => {
      const groupName = budget.group_name || "Uncategorized";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(budget);
      return acc;
    }, {});
  }, [filteredBudgets]);

  const totalBudget = budgets.reduce(
    (sum, b) => sum + parseFloat(b.budget_amount || 0),
    0,
  );
  const totalRollover = budgets.reduce(
    (sum, b) => sum + (b.is_rollover ? parseFloat(b.rollover_balance || 0) : 0),
    0,
  );
  const totalSpent = budgets.reduce(
    (sum, b) => sum + parseFloat(b.actual_spent || 0),
    0,
  );
  const totalCapacity = totalBudget + totalRollover;
  const remainingBudget = totalCapacity - totalSpent;

  if (loading && budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p>Memuat anggaran...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] p-4 lg:p-6 space-y-6 animate-fade-in text-slate-800">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Budgets
          </h2>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            Track and manage your monthly spending
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-black text-slate-700 min-w-[100px] text-center uppercase tracking-widest">
            {new Date(month + "-01").toLocaleDateString("id-ID", {
              month: "short",
              year: "numeric",
            })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary Highlights - Smaller Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Planned", val: totalBudget, icon: Wallet, color: "blue" },
          {
            label: "From Prev",
            val: totalRollover,
            icon: History,
            color: "amber",
          },
          {
            label: "Actual",
            val: totalSpent,
            icon: TrendingDown,
            color: "rose",
          },
          {
            label: "Remaining",
            val: remainingBudget,
            icon: TrendingUp,
            color: remainingBudget >= 0 ? "emerald" : "rose",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 bg-${item.color}-50 text-${item.color}-600 rounded-xl flex items-center justify-center`}
            >
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {item.label}
              </p>
              <p
                className={`text-sm font-black tabular-nums ${item.label === "Remaining" || item.label === "Actual" || item.label === "From Prev" ? `text-${item.color}-600` : "text-slate-800"}`}
              >
                {formatCurrency(item.val)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
          <button
            onClick={loadBudgets}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 text-right">
                  Planned
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Rollover
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actual spent
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Remaining
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(groupedBudgets).map(([groupName, categories]) => {
                const isCollapsed = collapsedGroups[groupName];

                // Group totals
                const gPlanned = categories.reduce(
                  (s, c) => s + parseFloat(c.budget_amount || 0),
                  0,
                );
                const gRollover = categories.reduce(
                  (s, c) =>
                    s +
                    (c.is_rollover ? parseFloat(c.rollover_balance || 0) : 0),
                  0,
                );
                const gSpent = categories.reduce(
                  (s, c) => s + parseFloat(c.actual_spent || 0),
                  0,
                );
                const gCapacity = gPlanned + gRollover;
                const gRemaining = gCapacity - gSpent;
                const gPercent =
                  gCapacity > 0
                    ? Math.min(100, (gSpent / gCapacity) * 100)
                    : gSpent > 0
                      ? 100
                      : 0;

                return (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    <tr
                      className="bg-slate-50/50 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleGroup(groupName)}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight
                              size={14}
                              className="text-slate-400"
                            />
                          ) : (
                            <ChevronDown size={14} className="text-slate-400" />
                          )}
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {groupName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right font-black text-[10px] text-slate-600 tabular-nums">
                        {formatCurrency(gPlanned)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-black text-[10px] text-amber-600 tabular-nums">
                        {formatCurrency(gRollover)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-black text-[10px] text-rose-600 tabular-nums">
                        {formatCurrency(gSpent)}
                      </td>
                      <td
                        className={`px-5 py-2.5 text-right font-black text-[10px] tabular-nums ${gRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {formatCurrency(gRemaining)}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${gRemaining >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                            style={{ width: `${gPercent}%` }}
                          />
                        </div>
                      </td>
                    </tr>

                    {!isCollapsed &&
                      categories.map((cat) => {
                        const rolloverVal = cat.is_rollover
                          ? parseFloat(cat.rollover_balance || 0)
                          : 0;
                        const capacity =
                          parseFloat(cat.budget_amount || 0) + rolloverVal;
                        const remaining =
                          capacity - parseFloat(cat.actual_spent || 0);

                        const percentUsed =
                          capacity > 0
                            ? Math.min(
                                100,
                                (parseFloat(cat.actual_spent) / capacity) * 100,
                              )
                            : cat.actual_spent > 0
                              ? 100
                              : 0;

                        return (
                          <tr
                            key={cat.category_id}
                            className="group hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-5 py-3 pl-10">
                              <div className="flex flex-col gap-0.5">
                                <p className="font-bold text-slate-800 text-xs">
                                  {cat.category_name}
                                </p>
                                <button
                                  onClick={() => handleToggleRollover(cat)}
                                  disabled={toggling === cat.category_id}
                                  className={`text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 transition-all ${cat.is_rollover ? "text-emerald-500" : "text-slate-300 hover:text-slate-500"}`}
                                >
                                  <History size={8} />
                                  {cat.is_rollover
                                    ? "Rollover ON"
                                    : "Rollover OFF"}
                                  {toggling === cat.category_id && (
                                    <RefreshCw
                                      size={8}
                                      className="animate-spin"
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5 group-hover:bg-white group-hover:shadow-sm p-1 rounded-lg transition-all border border-transparent group-hover:border-slate-100">
                                <input
                                  type="number"
                                  value={cat.budget_amount}
                                  onChange={(e) =>
                                    handleBudgetChange(
                                      cat.category_id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-right bg-transparent border-none focus:ring-0 font-black text-slate-700 text-xs p-0"
                                />
                                {cat.isModified && (
                                  <button
                                    onClick={() => handleSaveBudget(cat)}
                                    disabled={saving === cat.category_id}
                                    className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                  >
                                    {saving === cat.category_id ? (
                                      <RefreshCw
                                        className="animate-spin"
                                        size={12}
                                      />
                                    ) : (
                                      <Save size={12} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums">
                              <span
                                className={`text-[10px] font-bold ${rolloverVal >= 0 ? "text-emerald-500" : "text-rose-500"} ${!cat.is_rollover && "opacity-20"}`}
                              >
                                {formatCurrency(rolloverVal)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-xs text-slate-500 tabular-nums">
                              {formatCurrency(cat.actual_spent)}
                            </td>
                            <td
                              className={`px-5 py-3 text-right font-black text-xs tabular-nums ${remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {formatCurrency(remaining)}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${remaining >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                                    style={{ width: `${percentUsed}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 w-8 tabular-nums">
                                  {Math.round(percentUsed)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
        <Info className="text-slate-400 shrink-0" size={20} />
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700">How Rollover Works</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            When <strong>Rollover</strong> is enabled for a category, any
            leftover budget from previous months will automatically be added to
            the current month's spending capacity. If you overspent, the deficit
            will be deducted.
          </p>
        </div>
      </div>
    </div>
  );
};
