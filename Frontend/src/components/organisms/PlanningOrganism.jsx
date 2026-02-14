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
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-slate-800">{category.categoryName}</h4>
          <p className="text-xs text-slate-500">
            Limit:{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(category.budgetLimit)}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <MoreVertical size={16} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1 text-slate-300 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs font-semibold">
        <span className={isOverBudget ? "text-rose-600" : "text-slate-600"}>
          Terpakai:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
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

export const PlanningOrganism = () => {
  const [activeTab, setActiveTab] = useState("budget"); // 'budget' or 'goals'
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

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
      if (activeTab === "budget") {
        const res = await fetch(`${API_URL}/budgets`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.status === "success") setBudgets(json.data);
      } else {
        const res = await fetch(`${API_URL}/goals`, { credentials: "include" });
        const json = await res.json();
        if (json.status === "success") setGoals(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("budget")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "budget" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Monthly Budget
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "goals" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Savings Goals
          </button>
        </div>

        <div>
          {activeTab === "goals" && (
            <Button
              onClick={() => {
                setSelectedItem(null);
                setGoalModalOpen(true);
              }}
            >
              <Plus size={18} className="mr-1" /> Buat Tujuan Baru
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "budget" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.length > 0 ? (
            budgets.map((b) => (
              <BudgetCard
                key={b.categoryId}
                category={b}
                onEdit={(item) => {
                  setSelectedItem(item);
                  setBudgetModalOpen(true);
                }}
                onDelete={handleDeleteBudget}
              />
            ))
          ) : (
            <p className="text-slate-500 col-span-full text-center py-10">
              Belum ada kategori pengeluaran.
            </p>
          )}

          {/* Hint Card */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-400">
            <TrendingUp className="mb-2 opacity-50" />
            <p className="text-sm">
              Klik ikon titik tiga di kartu untuk mengatur limit anggaran.
            </p>
          </div>
        </div>
      ) : (
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
          {goals.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100">
              <PiggyBank size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">
                Mulai Menabung Impian Anda
              </h3>
              <p className="text-slate-500 mb-4">
                Buat target tabungan untuk rumah, kendaraan, atau liburan.
              </p>
              <Button onClick={() => setGoalModalOpen(true)}>
                Buat Tujuan Pertama
              </Button>
            </div>
          )}
        </div>
      )}

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
