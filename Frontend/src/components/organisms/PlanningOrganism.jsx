import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  Target,
  Wallet,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Trash2,
  History,
  Edit2,
} from "lucide-react";
import { API_URL } from "../../config/api";
import { Button } from "../atoms/Button";
import { Modal } from "../molecules/Modal";

// --- Sub-components ---

const BudgetCard = ({ category, onEdit, onDelete }) => {
  const percent = Math.min(
    (category.currentSpent / category.budgetLimit) * 100,
    100,
  );
  const isOverBudget = category.currentSpent > category.budgetLimit;
  const isNearLimit = percent > 80;

  let barColor = "bg-emerald-500";
  if (isOverBudget) barColor = "bg-rose-500";
  else if (isNearLimit) barColor = "bg-amber-500";

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <h4 className="font-bold text-sm text-slate-800">
            {category.categoryName}
          </h4>
          <p className="text-[10px] text-slate-500">
            Limit:{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(category.budgetLimit)}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <MoreVertical size={14} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1 text-slate-300 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-semibold">
        <span className={isOverBudget ? "text-rose-600" : "text-slate-600"}>
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(category.currentSpent)}
        </span>
        <span className="text-slate-400">{percent.toFixed(0)}%</span>
      </div>
    </div>
  );
};

const GoalCard = ({ goal, onTopUp, onEdit, onDelete }) => {
  const percent = Math.min(
    (goal.current_amount / goal.target_amount) * 100,
    100,
  );
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <div
      className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-md relative overflow-hidden group`}
    >
      {/* Color accent */}
      <div
        className={`absolute top-0 left-0 w-full h-1.5 ${goal.color?.replace("bg-", "bg-") || "bg-blue-500"}`}
      ></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-slate-50 text-slate-600`}>
            <Target size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{goal.name}</h4>
            <p className="text-xs text-slate-500">
              Target:{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(goal.target_amount)}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 text-slate-300 hover:text-blue-500 rounded-full hover:bg-blue-50"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="p-1.5 text-slate-300 hover:text-rose-500 rounded-full hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
          <span>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(goal.current_amount)}
          </span>
          <span>{percent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full ${percent >= 100 ? "bg-emerald-500" : "bg-blue-500"} transition-all duration-1000`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 text-right">
          Kurang:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(Math.max(0, remaining))}
        </p>
      </div>

      <Button
        onClick={() => onTopUp(goal)}
        variant="primary"
        size="sm"
        className="w-full justify-center"
      >
        <Plus size={16} className="mr-1" /> Tabung / Tarik
      </Button>
    </div>
  );
};

// --- Main Container ---

// --- Kakeibo Components ---

const KakeiboSummaryCard = ({
  income,
  fixedExpenses,
  savings,
  onIncomeChange,
}) => {
  const pocketMoney = income - fixedExpenses - savings;
  const isNegative = pocketMoney < 0;

  return (
    <div className="bg-white border-l-4 border-slate-800 p-4 rounded-r-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="text-3xl">📔</div>

      <div className="flex-1 w-full text-slate-800">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 border-b border-slate-100 pb-1">
          Monthly Ledger
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Income Input */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
              Income
            </label>
            <div className="flex items-center gap-2 border-b border-slate-200 hover:border-slate-800 transition-colors pb-1">
              <span className="text-slate-500 font-sans">Rp</span>
              <input
                type="number"
                value={income}
                onChange={(e) => onIncomeChange(e.target.value)}
                className="w-full bg-transparent focus:outline-none font-bold text-slate-800"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculations */}
          <div className="space-y-1 text-slate-500 border-l border-slate-100 pl-4 md:border-none md:pl-0">
            <div className="flex justify-between">
              <span>Fixed:</span>
              <span className="font-bold text-rose-500">
                -{new Intl.NumberFormat("id-ID").format(fixedExpenses)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Savings:</span>
              <span className="font-bold text-blue-500">
                -{new Intl.NumberFormat("id-ID").format(savings)}
              </span>
            </div>
          </div>

          {/* Result */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
            <label className="text-[10px] text-slate-400 uppercase font-bold">
              Pocket Money
            </label>
            <p
              className={`text-lg font-bold ${isNegative ? "text-rose-600" : "text-emerald-600"}`}
            >
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(pocketMoney)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnvelopeGroup = ({
  title,
  description,
  color,
  items,
  onEdit,
  onDelete,
}) => {
  if (items.length === 0) return null;

  const totalBudget = items.reduce((sum, item) => sum + item.budgetLimit, 0);
  const totalSpent = items.reduce((sum, item) => sum + item.currentSpent, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const percent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div>
          <h3 className={`text-lg font-bold ${color} flex items-center gap-2`}>
            {title}
          </h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className="text-right bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase">
            Sisa Amplop
          </p>
          <p
            className={`text-sm font-bold font-mono ${totalRemaining < 0 ? "text-rose-500" : "text-emerald-600"}`}
          >
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Progress Bar for Group */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 ${percent > 100 ? "bg-rose-500" : "bg-slate-400"}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <BudgetCard
            key={item.categoryId}
            category={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Container ---

export const PlanningOrganism = () => {
  const [activeTab, setActiveTab] = useState("kakeibo");
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [income, setIncome] = useState(
    localStorage.getItem("kakeibo_income") || 0,
  );

  // Modals
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [isFundsModalOpen, setFundsModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, goalsRes] = await Promise.all([
        fetch(`${API_URL}/budgets`, { credentials: "include" }),
        fetch(`${API_URL}/goals`, { credentials: "include" }),
      ]);

      const budgetsJson = await budgetsRes.json();
      const goalsJson = await goalsRes.json();

      if (budgetsJson.status === "success") setBudgets(budgetsJson.data);
      if (goalsJson.status === "success") setGoals(goalsJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Persist income
  useEffect(() => {
    localStorage.setItem("kakeibo_income", income);
  }, [income]);

  // Derived Calculations
  const groupedBudgets = {
    survival: budgets.filter(
      (b) =>
        b.groupName?.toLowerCase().includes("survival") ||
        b.groupName?.toLowerCase().includes("kebutuhan"),
    ),
    optional: budgets.filter(
      (b) =>
        b.groupName?.toLowerCase().includes("optional") ||
        b.groupName?.toLowerCase().includes("keinginan"),
    ),
    culture: budgets.filter(
      (b) =>
        b.groupName?.toLowerCase().includes("culture") ||
        b.groupName?.toLowerCase().includes("kultur"),
    ),
    extra: budgets.filter(
      (b) =>
        b.groupName?.toLowerCase().includes("extra") ||
        b.groupName?.toLowerCase().includes("tak terduga") ||
        b.groupName === "Uncategorized",
    ),
  };

  // Fixed Expenses = Survival Group Needs
  const fixedExpenses = groupedBudgets.survival.reduce(
    (sum, item) => sum + item.budgetLimit,
    0,
  );

  // Savings (Total Targeted Saving per month? Or just total accumulated?
  // For Kakeibo flow, usually it's "Saving Target for this month".
  // Since we don't have "Monthly Saving Target" per goal, I will use a simple assumption or just sum of all goal targets?
  // No, that's too big. I'll just sum the 'current_amount' added this month if possible?
  // Or better, let's just use 20% of income as default or input?
  // User prompt said: "Input/Slider: Savings Target".
  // I will add a manual savings target input for now to kept it simple).
  const [savingsTarget, setSavingsTarget] = useState(
    localStorage.getItem("kakeibo_savings") || 0,
  );

  useEffect(() => {
    localStorage.setItem("kakeibo_savings", savingsTarget);
  }, [savingsTarget]);

  const handleDeleteBudget = async (category) => {
    if (!window.confirm(`Hapus anggaran untuk ${category.categoryName}?`))
      return;
    try {
      await fetch(
        `${API_URL}/budgets?categoryId=${category.categoryId}&month=${new Date().toISOString().slice(0, 7)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`Hapus tujuan ${goal.name}?`)) return;
    try {
      await fetch(`${API_URL}/goals/${goal.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <KakeiboSummaryCard
        income={income}
        fixedExpenses={fixedExpenses}
        savings={savingsTarget}
        onIncomeChange={setIncome}
      />

      {/* Manual Savings Input inside Summary Card in next iteration, for now let's add a separate slider or input for savings if needed. 
          Actually KakeiboSummaryCard takes savings as prop. I need to allow changing it.
          Let's update KakeiboSummaryCard to accept onSavingsChange or just put inputs there. 
          Wait, I defined KakeiboSummaryCard above. I should update it to allow editing Savings too.
      */}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-700 mb-4">
          Target Tabungan (Savings)
        </h3>
        <input
          type="range"
          min="0"
          max={income}
          step="50000"
          value={savingsTarget}
          onChange={(e) => setSavingsTarget(e.target.value)}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Rp 0</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(savingsTarget)}
            </span>
            <input
              type="number"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 w-24 text-right text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <EnvelopeGroup
          title="Survival (Kebutuhan)"
          description="Pengeluaran wajib untuk bertahan hidup (Makan, Transport, Tagihan)."
          color="text-rose-500"
          items={groupedBudgets.survival}
          onEdit={(item) => {
            setSelectedItem(item);
            setBudgetModalOpen(true);
          }}
          onDelete={handleDeleteBudget}
        />

        <EnvelopeGroup
          title="Optional (Keinginan)"
          description="Belanja, Hiburan, dan kesenangan lainnya."
          color="text-amber-500"
          items={groupedBudgets.optional}
          onEdit={(item) => {
            setSelectedItem(item);
            setBudgetModalOpen(true);
          }}
          onDelete={handleDeleteBudget}
        />

        <EnvelopeGroup
          title="Culture (Kultur)"
          description="Pendidikan, Buku, Kursus, dan pengembangan diri."
          color="text-blue-500"
          items={groupedBudgets.culture}
          onEdit={(item) => {
            setSelectedItem(item);
            setBudgetModalOpen(true);
          }}
          onDelete={handleDeleteBudget}
        />

        <EnvelopeGroup
          title="Extra (Tak Terduga)"
          description="Pengeluaran dadakan, hadiah, atau perbaikan."
          color="text-purple-500"
          items={groupedBudgets.extra}
          onEdit={(item) => {
            setSelectedItem(item);
            setBudgetModalOpen(true);
          }}
          onDelete={handleDeleteBudget}
        />
      </div>

      {/* Savings Goals Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-blue-500" /> Goals Progress
          </h3>
          <Button
            onClick={() => {
              setSelectedItem(null);
              setGoalModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-1" /> Tambah Goal
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onTopUp={(item) => {
                setSelectedItem(item);
                setFundsModalOpen(true);
              }}
              onEdit={(item) => {
                setSelectedItem(item);
                setGoalModalOpen(true);
              }}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={`Atur Anggaran: ${selectedItem?.categoryName}`}
      >
        <BudgetForm
          category={selectedItem}
          onSuccess={() => {
            setBudgetModalOpen(false);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={selectedItem ? "Edit Tujuan Tabungan" : "Buat Tujuan Tabungan"}
      >
        <GoalForm
          goal={selectedItem}
          onSuccess={() => {
            setGoalModalOpen(false);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isFundsModalOpen}
        onClose={() => setFundsModalOpen(false)}
        title={selectedItem?.name}
      >
        <FundsForm
          goal={selectedItem}
          onSuccess={() => {
            setFundsModalOpen(false);
            fetchData();
          }}
        />
      </Modal>
    </div>
  );
};

// --- Form Components (Internal) ---

const BudgetForm = ({ category, onSuccess }) => {
  const [amount, setAmount] = useState(category?.budgetLimit || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) setAmount(category.budgetLimit || 0);
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.categoryId,
          amount: parseInt(amount),
          month: new Date().toISOString().slice(0, 7),
        }),
        credentials: "include",
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Batas Anggaran Bulanan
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg"
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
};

const GoalForm = ({ goal, onSuccess }) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(goal.target_amount);
    } else {
      setName("");
      setTarget("");
    }
  }, [goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = goal ? `${API_URL}/goals/${goal.id}` : `${API_URL}/goals`;
      const method = goal ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          target_amount: parseInt(target),
          color: goal?.color || "bg-indigo-500", // default or existing
        }),
        credentials: "include",
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nama Tujuan
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg"
          placeholder="Contoh: Beli Laptop Baru"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Target Nominal (Rp)
        </label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg"
          placeholder="0"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Memproses..."
            : goal
              ? "Simpan Perubahan"
              : "Buat Tujuan"}
        </Button>
      </div>
    </form>
  );
};

const FundsForm = ({ goal, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/goals/${goal.id}/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount),
          type,
          notes: "Manual update",
        }),
        credentials: "include",
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setType("deposit")}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold ${type === "deposit" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}
        >
          + Nabung
        </button>
        <button
          type="button"
          onClick={() => setType("withdraw")}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold ${type === "withdraw" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"}`}
        >
          - Tarik
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nominal (Rp)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg"
          placeholder="0"
          autoFocus
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Memproses..." : "Konfirmasi"}
        </Button>
      </div>
    </form>
  );
};
