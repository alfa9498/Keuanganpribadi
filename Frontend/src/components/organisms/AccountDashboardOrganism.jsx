import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { StatCard } from "../molecules/StatCard";
import { Modal } from "../molecules/Modal";
import { API_URL } from "../../config/api";

export const AccountDashboardOrganism = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  ];

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/accounts?user_id=${user.id}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) setAccounts(result.data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
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
      const result = await response.json();
      if (response.ok) {
        setTransactions(result.data);
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

      if (tx.type === "income" && summaries[tx.account]) {
        summaries[tx.account].income += amt;
      } else if (tx.type === "expense" && summaries[tx.account]) {
        summaries[tx.account].expense += amt;
      } else if (tx.type === "transfer") {
        if (summaries[tx.account]) summaries[tx.account].transfers_out += amt;
        if (summaries[tx.to_account])
          summaries[tx.to_account].transfers_in += amt;
      }
    });

    // Calculate final balance for each account
    Object.values(summaries).forEach((acc) => {
      acc.balance +=
        acc.income + acc.transfers_in - (acc.expense + acc.transfers_out);
    });

    return Object.values(summaries).sort((a, b) => b.balance - a.balance);
  }, [transactions, accounts]);

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
    const fullAccount = accounts.find((a) => a.id === acc.id);
    setEditingAccount(fullAccount);
    setAccountForm({
      name: fullAccount.name,
      type: fullAccount.type,
      icon: fullAccount.icon,
      initial_balance: fullAccount.initial_balance,
    });
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus akun ini?")) return;
    try {
      const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        fetchAccounts();
        fetchTransactions();
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingAccount
      ? `${API_URL}/accounts/${editingAccount.id}`
      : `${API_URL}/accounts`;
    const method = editingAccount ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...accountForm, user_id: user.id }),
        credentials: "include",
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchAccounts();
        fetchTransactions();
      } else {
        const data = await response.json();
        alert(data.message || "Gagal menyimpan akun");
      }
    } catch (err) {
      console.error("Error saving account:", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountIcon = (name) => {
    if (
      [
        "BCA",
        "Mandiri",
        "Permata",
        "BNI",
        "BSI",
        "Muamalat",
        "Tabungan BNI Anak",
      ].includes(name)
    )
      return <Landmark className="text-blue-500" />;
    if (["Gopay", "OVO", "Dana"].includes(name))
      return <Wallet className="text-indigo-500" />;
    if (["Bareksa", "Treasury"].includes(name))
      return <TrendingUp className="text-emerald-500" />;
    return <Coins className="text-amber-500" />;
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

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {accountSummaries.map((acc) => (
          <div
            key={acc.name}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                  {getAccountIcon(acc.name)}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditAccount(acc)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {acc.name}
              </h3>
              <p className="text-[10px] text-slate-400 mb-2">{acc.type}</p>
              <p
                className={`text-2xl font-black mb-6 ${acc.balance >= 0 ? "text-slate-800" : "text-rose-600"}`}
              >
                {formatCurrency(acc.balance)}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-500" /> Income
                </span>
                <span className="font-bold text-emerald-600">
                  +{formatCurrency(acc.income + acc.transfers_in)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-rose-500" /> Expense
                </span>
                <span className="font-bold text-rose-600">
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
