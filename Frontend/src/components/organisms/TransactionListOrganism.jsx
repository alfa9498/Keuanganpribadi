import React, { useState, useEffect } from "react";
import { RecentTransactionsOrganism } from "./RecentTransactionsOrganism";
import { Button } from "../atoms/Button";
import { FileUp, Plus } from "lucide-react";
import { Modal } from "../molecules/Modal";
import { ImportExcelOrganism } from "./ImportExcelOrganism";
import { TransactionFormOrganism } from "./TransactionFormOrganism";
import { TimeFilter } from "../molecules/TimeFilter";
import { API_URL } from "../../config/api";
import { CategoryFilter } from "../molecules/CategoryFilter";
import { AccountFilter } from "../molecules/AccountFilter";

export const TransactionListOrganism = ({
  user,
  filterRange,
  setFilterRange,
  filterCategory,
  setFilterCategory,
  filterAccount,
  setFilterAccount,
}) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState("all"); // all, income, expense
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAccounts();
    }
  }, [user?.id]);

  const fetchAccounts = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/accounts?user_id=${user.id}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) setAccounts(result.data);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  return (
    <div className="w-full max-w-[1600px] p-4 space-y-4 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Left: Type Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveListTab("all")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeListTab === "all"
                ? "bg-white text-finance-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveListTab("income")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeListTab === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setActiveListTab("expense")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeListTab === "expense"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {/* Center: Global Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <TimeFilter
            currentRange={filterRange}
            onRangeChange={setFilterRange}
          />
          <AccountFilter
            currentAccount={filterAccount}
            onAccountChange={setFilterAccount}
            accounts={accounts}
          />
          <CategoryFilter
            currentCategory={filterCategory}
            onCategoryChange={setFilterCategory}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 w-full xl:w-auto justify-end">
          <Button
            onClick={() => setIsAddOpen(true)}
            variant="primary"
            className="group flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-lg shadow-finance-primary/20 hover:scale-105"
          >
            <Plus size={18} />
            <span className="font-bold whitespace-nowrap">Add Transaction</span>
          </Button>

          <Button
            onClick={() => setIsImportOpen(true)}
            variant="ghost"
            className="group flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 px-4 py-2 rounded-xl transition-all"
          >
            <FileUp size={18} />
            <span className="font-bold whitespace-nowrap">Import Data</span>
          </Button>
        </div>
      </div>

      <RecentTransactionsOrganism
        key={`${activeListTab}-${refreshKey}-${filterRange}-${filterAccount}-${filterCategory}`} // Force remount on filter changes
        onViewAll={() => setActiveListTab("all")}
        user={user}
        onRefresh={null}
        fixedType={activeListTab === "all" ? null : activeListTab}
        filterRange={filterRange}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterAccount={filterAccount}
        onAccountChange={setFilterAccount}
        title={
          activeListTab === "income"
            ? "Daftar Pemasukan"
            : activeListTab === "expense"
              ? "Daftar Pengeluaran"
              : "Semua Transaksi"
        }
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import from Excel"
        maxWidth="max-w-4xl"
      >
        <ImportExcelOrganism
          user={user}
          onImportSuccess={() => {
            setIsImportOpen(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Transaction"
        maxWidth="max-w-4xl"
      >
        <TransactionFormOrganism
          user={user}
          onSuccess={() => {
            setIsAddOpen(false);
            setRefreshKey((prev) => prev + 1);
          }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>
    </div>
  );
};
