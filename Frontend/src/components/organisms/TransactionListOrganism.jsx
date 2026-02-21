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
import { StatusFilter } from "../molecules/StatusFilter";
import { fetchCategories } from "../../services/categoryService";

export const TransactionListOrganism = ({
  user,
  filterRange,
  setFilterRange,
  filterCategory,
  setFilterCategory,
  filterAccount,
  setFilterAccount,
}) => {
  const [filterStatus, setFilterStatus] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeListTab, setActiveListTab] = useState("all"); // all, income, expense
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categoriesData, setCategoriesData] = useState({
    expense: [],
    income: [],
  });

  useEffect(() => {
    if (user?.id) {
      fetchAccounts();
      fetchCategoriesData();
    }
  }, [user?.id]);

  const fetchCategoriesData = async () => {
    try {
      const data = await fetchCategories();
      setCategoriesData(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

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
    <div className="w-full max-w-[1600px] p-4 space-y-4 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 md:gap-6 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4 md:gap-6">
          {/* Top Row / Left: Type Tabs */}
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto shadow-inner">
            <button
              onClick={() => setActiveListTab("all")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "all"
                  ? "bg-white dark:bg-slate-700 text-finance-primary dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveListTab("income")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "income"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setActiveListTab("expense")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "expense"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Top Row / Right: Actions */}
          <div className="flex flex-row gap-2 md:gap-3 w-full xl:w-auto">
            <Button
              onClick={() => setIsAddOpen(true)}
              variant="primary"
              className="flex-1 group flex items-center justify-center gap-2 px-3 md:px-6 py-3 rounded-2xl transition-all shadow-lg shadow-finance-primary/20 hover:scale-[1.02] active:scale-95 bg-slate-900 border-none"
            >
              <Plus size={18} className="text-white" />
              <span className="font-bold whitespace-nowrap text-white text-xs md:text-sm">
                Add
              </span>
            </Button>

            <Button
              onClick={() => setIsImportOpen(true)}
              variant="ghost"
              className="flex-1 group flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100/50 dark:border-emerald-800/50 px-3 md:px-6 py-3 rounded-2xl transition-all active:scale-95"
            >
              <FileUp size={18} />
              <span className="font-bold whitespace-nowrap text-xs md:text-sm text-emerald-600 dark:text-emerald-400">
                Import
              </span>
            </Button>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`xl:hidden flex items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                showMobileFilters
                  ? "bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-lg"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="21" y2="21" />
                <line x1="4" x2="20" y1="14" y2="14" />
                <line x1="4" x2="20" y1="7" y2="7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row / Center: Global Filters */}
        <div
          className={`xl:flex flex-col lg:flex-row flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800 ${showMobileFilters ? "flex" : "hidden"}`}
        >
          <div className="w-full lg:w-auto">
            <TimeFilter
              currentRange={filterRange}
              onRangeChange={setFilterRange}
            />
          </div>
          <div className="w-full lg:w-auto">
            <AccountFilter
              currentAccount={filterAccount}
              onAccountChange={setFilterAccount}
              accounts={accounts}
            />
          </div>
          <div className="w-full lg:w-auto">
            <CategoryFilter
              currentCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              categories={categoriesData}
            />
          </div>
          <div className="w-full lg:w-auto">
            <StatusFilter
              currentStatus={filterStatus}
              onStatusChange={setFilterStatus}
            />
          </div>
        </div>
      </div>

      <RecentTransactionsOrganism
        key={`${activeListTab}-${refreshKey}-${filterRange}-${filterAccount}-${filterCategory}-${filterStatus}`} // Force remount on filter changes
        onViewAll={() => setActiveListTab("all")}
        user={user}
        onRefresh={null}
        fixedType={activeListTab === "all" ? null : activeListTab}
        filterRange={filterRange}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterAccount={filterAccount}
        onAccountChange={setFilterAccount}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
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
        maxWidth="max-w-md"
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
