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
      <div className="flex flex-col gap-4 md:gap-6 bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm transition-all">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4 md:gap-6">
          {/* Top Row / Left: Type Tabs */}
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-full xl:w-auto shadow-inner">
            <button
              onClick={() => setActiveListTab("all")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "all"
                  ? "bg-white text-finance-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveListTab("income")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setActiveListTab("expense")}
              className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                activeListTab === "expense"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Top Row / Right: Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <Button
              onClick={() => setIsAddOpen(true)}
              variant="primary"
              className="flex-1 group flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all shadow-lg shadow-finance-primary/20 hover:scale-[1.02] active:scale-95 bg-slate-900 border-none"
            >
              <Plus size={18} className="text-white" />
              <span className="font-bold whitespace-nowrap text-white text-sm">
                Add Transaction
              </span>
            </Button>

            <Button
              onClick={() => setIsImportOpen(true)}
              variant="ghost"
              className="flex-1 group flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50 px-6 py-3 rounded-2xl transition-all active:scale-95"
            >
              <FileUp size={18} />
              <span className="font-bold whitespace-nowrap text-sm">
                Import
              </span>
            </Button>
          </div>
        </div>

        {/* Bottom Row / Center: Global Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-50">
          <div className="w-full sm:w-auto">
            <TimeFilter
              currentRange={filterRange}
              onRangeChange={setFilterRange}
            />
          </div>
          <div className="w-full sm:w-auto">
            <AccountFilter
              currentAccount={filterAccount}
              onAccountChange={setFilterAccount}
              accounts={accounts}
            />
          </div>
          <div className="w-full sm:w-auto">
            <CategoryFilter
              currentCategory={filterCategory}
              onCategoryChange={setFilterCategory}
            />
          </div>
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
