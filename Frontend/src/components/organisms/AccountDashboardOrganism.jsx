import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Coins,
  Plus,
  Pencil,
  Trash2,
  X,
  HelpCircle,
} from "lucide-react";
import { StatCard } from "../molecules/StatCard";
import { Modal } from "../molecules/Modal";
import { Button } from "../atoms/Button";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../config/api";

export const AccountDashboardOrganism = ({ user }) => {
  const { showNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    type: "Bank",
    icon: "Landmark",
    initial_balance: 0,
  });

  const ACCOUNT_TYPES = ["Bank", "E-Wallet", "Cash", "Investment", "Other"];
  const ICONS = [
    { name: "Landmark", icon: <Landmark size={20} /> },
    { name: "Wallet", icon: <Wallet size={20} /> },
    { name: "Coins", icon: <Coins size={20} /> },
    { name: "CreditCard", icon: <CreditCard size={20} /> },
    { name: "TrendingUp", icon: <TrendingUp size={20} /> },
    { name: "HelpCircle", icon: <HelpCircle size={20} /> },
  ];

  const getAccountIcon = (name, iconName) => {
    if (iconName === "Landmark")
      return <Landmark size={14} className="text-blue-500" />;
    if (iconName === "Wallet")
      return <Wallet size={14} className="text-indigo-500" />;
    if (iconName === "Coins")
      return <Coins size={14} className="text-amber-500" />;
    if (iconName === "CreditCard")
      return <CreditCard size={14} className="text-slate-500" />;
    if (iconName === "TrendingUp")
      return <TrendingUp size={14} className="text-emerald-500" />;
    if (iconName === "HelpCircle")
      return <HelpCircle size={14} className="text-rose-500" />;

    const n = name?.toUpperCase() || "";
    if (
      n.includes("BCA") ||
      n.includes("MANDIRI") ||
      n.includes("BNI") ||
      n.includes("BANK")
    )
      return <Landmark size={14} className="text-blue-500" />;
    if (
      n.includes("GOPAY") ||
      n.includes("OVO") ||
      n.includes("DANA") ||
      n.includes("WALLET")
    )
      return <Wallet size={14} className="text-indigo-500" />;
    return <Coins size={14} className="text-amber-500" />;
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/accounts?user_id=${user.id}`, {
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          setAccounts(result.data);
        } else {
          console.error("API Error (Accounts):", result.message);
        }
      } else {
        const text = await response.text();
        console.error(
          "Non-JSON response from /accounts:",
          text.substring(0, 100),
        );
      }
    } catch (err) {
      console.error("Connection failed (Accounts):", err.message);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/transaction?user_id=${user.id}`,
        {
          credentials: "include",
        },
      );

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          setTransactions(result.data);
        }
      } else {
        console.error("Non-JSON response from /transaction");
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const accountSummaries = useMemo(() => {
    const summaries = accounts.reduce((acc, account) => {
      acc[account.name] = {
        id: account.id,
        name: account.name,
        type: account.type,
        icon: account.icon,
        income: 0,
        expense: 0,
        balance: parseFloat(account.initial_balance || 0),
        transfers_in: 0,
        transfers_out: 0,
      };
      return acc;
    }, {});

    transactions.forEach((tx) => {
      const amt = parseFloat(tx.amount);

      // Robustness: ensure summary exists or create virtual one to preserve balance
      if (!summaries[tx.account]) {
        summaries[tx.account] = {
          name: tx.account + " (BELUM TERDAFTAR)",
          originalName: tx.account,
          isUnregistered: true,
          type: "Unknown",
          icon: "HelpCircle",
          income: 0,
          expense: 0,
          balance: 0,
          transfers_in: 0,
          transfers_out: 0,
        };
      }

      if (tx.type === "income") {
        summaries[tx.account].income += amt;
      } else if (tx.type === "expense") {
        summaries[tx.account].expense += amt;
      } else if (tx.type === "transfer") {
        if (summaries[tx.account]) summaries[tx.account].transfers_out += amt;
        if (tx.to_account) {
          if (!summaries[tx.to_account]) {
            summaries[tx.to_account] = {
              name: tx.to_account + " (BELUM TERDAFTAR)",
              originalName: tx.to_account,
              isUnregistered: true,
              type: "Unknown",
              icon: "HelpCircle",
              income: 0,
              expense: 0,
              balance: 0,
              transfers_in: 0,
              transfers_out: 0,
            };
          }
          summaries[tx.to_account].transfers_in += amt;
        }
      }
    });

    // Calculate final balance for each account
    Object.values(summaries).forEach((acc) => {
      acc.balance +=
        acc.income + acc.transfers_in - (acc.expense + acc.transfers_out);
    });

    return Object.values(summaries).sort((a, b) => b.balance - a.balance);
  }, [transactions, accounts]);

  const gridRef = useRef(null);

  const handleGridMouseMove = (e) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gridRef.current.style.setProperty("--x", `${x}px`);
    gridRef.current.style.setProperty("--y", `${y}px`);
  };

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({
      name: "",
      type: "Bank",
      icon: "Landmark",
      initial_balance: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditAccount = (acc) => {
    if (acc.isUnregistered) {
      setEditingAccount(null); // Treat as NEW account
      setAccountForm({
        name: acc.originalName,
        type: "Bank",
        icon: "Landmark",
        initial_balance: 0,
      });
    } else {
      const fullAccount = accounts.find((a) => a.id === acc.id);
      setEditingAccount(fullAccount);
      setAccountForm({
        name: fullAccount.name,
        type: fullAccount.type,
        icon: fullAccount.icon,
        initial_balance: fullAccount.initial_balance,
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteClick = (acc) => {
    setAccountToDelete(acc);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_URL}/accounts/${accountToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (response.ok) {
        showNotification("Akun berhasil dihapus!", "success");
        fetchAccounts();
        fetchTransactions();
        setIsDeleteModalOpen(false);
      } else {
        const data = await response.json();
        showNotification(`Gagal menghapus akun: ${data.message}`, "error");
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingAccount
      ? `${API_URL}/accounts/${editingAccount.id}`
      : `${API_URL}/accounts`;
    const method = editingAccount ? "PUT" : "POST";

    if (!user?.id) {
      showNotification(
        "Sesi user tidak ditemukan. Silakan login kembali.",
        "error",
      );
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountForm,
          user_id: user.id,
          initial_balance: parseFloat(accountForm.initial_balance || 0),
        }),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      let data = {};

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(
          `Server returned non-JSON response (${response.status}): ${errorText.substring(0, 50)}...`,
        );
      }

      if (response.ok) {
        setIsModalOpen(false);
        fetchAccounts();
        fetchTransactions();
      } else {
        showNotification(
          data.message ||
            "Gagal menyimpan akun (Status: " + response.status + ")",
          "error",
        );
      }
    } catch (err) {
      console.error("Error saving account:", err);
      showNotification("⚠️ Terjadi kesalahan: " + err.message, "error");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">
        Loading account data...
      </div>
    );

  return (
    <div className="w-full max-w-[1600px] p-4 md:p-6 space-y-8 animate-fade-in font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Wallet className="text-finance-primary" />
            Accounts & Balances
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage your funds across different accounts
          </p>
        </div>
        <button
          onClick={handleAddAccount}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      {accountSummaries.length === 0 && !loading && (
        <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Wallet size={32} className="text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">No Accounts Found</h3>
          <p className="text-slate-500 text-sm mb-6">
            Start by adding your first bank account or wallet.
          </p>
          <button
            onClick={handleAddAccount}
            className="bg-finance-primary text-white px-6 py-2 rounded-xl font-bold text-sm"
          >
            Add Your First Account
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        onMouseMove={handleGridMouseMove}
        className="chroma-grid chroma-grid-mobile-scroll"
      >
        {accountSummaries.map((acc) => (
          <div
            key={acc.name}
            onMouseMove={handleCardMouseMove}
            className="chroma-card group"
          >
            <div className="p-6 pb-2 flex justify-between items-start">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/10">
                {getAccountIcon(acc.name, acc.icon)}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleEditAccount(acc)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  title={
                    acc.isUnregistered ? "Daftarkan Akun Ini" : "Edit Akun"
                  }
                >
                  <Pencil size={16} />
                </button>
                {!acc.isUnregistered && (
                  <button
                    onClick={() => handleDeleteClick(acc)}
                    className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                    title="Hapus Akun"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 flex-1">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] truncate">
                  {acc.name}
                </h3>
                <p className="text-3xl font-black text-white tabular-nums truncate leading-tight">
                  {formatCurrency(acc.balance)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest px-0.5">
                    {acc.type}
                  </span>
                  {acc.isUnregistered && (
                    <span className="text-[8px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">
                      Unregistered
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6 pt-4 border-t border-white/5 bg-black/20">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <TrendingUp size={12} className="text-emerald-500" /> Income
                </span>
                <span className="font-bold text-emerald-500 tabular-nums">
                  +{formatCurrency(acc.income + acc.transfers_in)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <TrendingDown size={12} className="text-rose-500" /> Expense
                </span>
                <span className="font-bold text-rose-500 tabular-nums">
                  -{formatCurrency(acc.expense + acc.transfers_out)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Edit Account" : "Add New Account"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">
              Account Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dana, Bank BCA, Cash"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-finance-primary/20 transition-all font-bold"
              value={accountForm.name}
              onChange={(e) =>
                setAccountForm({ ...accountForm, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">
                Type
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-finance-primary/20 transition-all font-bold"
                value={accountForm.type}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, type: e.target.value })
                }
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">
                Initial Balance
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-finance-primary/20 transition-all font-bold"
                value={accountForm.initial_balance}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    initial_balance: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">
              Select Icon
            </label>
            <div className="flex gap-3 mt-2">
              {ICONS.map((i) => (
                <button
                  key={i.name}
                  type="button"
                  onClick={() =>
                    setAccountForm({ ...accountForm, icon: i.name })
                  }
                  className={`p-3 rounded-xl border transition-all ${accountForm.icon === i.name ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"}`}
                >
                  {i.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-finance-primary text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-all shadow-lg"
            >
              {editingAccount ? "Update Account" : "Save Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Akun"
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={32} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">
            Hapus Akun Ini?
          </h4>
          <p className="text-slate-500 mb-6">
            Tindakan ini akan menghapus akun{" "}
            <span className="font-extrabold text-slate-900">
              {accountToDelete?.name}
            </span>{" "}
            secara permanen. Transaksi yang terkait dengan akun ini mungkin akan
            terpengaruh.
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-3 font-bold"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold shadow-lg shadow-rose-500/20"
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recent Transfers Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-3">
            <ArrowRightLeft className="text-blue-500" size={20} />
            Recent Transfers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 bg-slate-50/50">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">From Account</th>
                <th className="px-6 py-4 text-center"></th>
                <th className="px-6 py-4">To Account</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions
                .filter((tx) => tx.type === "transfer")
                .slice(0, 10)
                .map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-[13px] text-slate-600">
                      {new Date(tx.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {tx.account}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ArrowRightLeft
                        size={16}
                        className="inline text-slate-300 group-hover:text-blue-400 transition-colors"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {tx.to_account}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-blue-600">
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              {transactions.filter((tx) => tx.type === "transfer").length ===
                0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400 text-sm italic"
                  >
                    No transfers recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
