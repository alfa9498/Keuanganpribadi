import React, { useState, useMemo, useEffect } from "react";
import { fetchCategories } from "../../services/categoryService";
import { Button } from "../atoms/Button";
import { Badge } from "../atoms/Badge";
import {
  Search,
  Loader2,
  AlertTriangle,
  Trash2,
  Edit,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Modal } from "../molecules/Modal";
import { TransactionFormOrganism } from "./TransactionFormOrganism";
import { useNotification } from "../../context/NotificationContext";
import { CategoryFilter } from "../molecules/CategoryFilter";
import { TimeFilter } from "../molecules/TimeFilter";
import { AccountFilter } from "../molecules/AccountFilter";
import { StatusFilter } from "../molecules/StatusFilter";
import { API_URL } from "../../config/api";

export const RecentTransactionsOrganism = ({
  transactions,
  onViewAll,
  user,
  onRefresh,
  fixedType = null,
  title = "Transaksi Terakhir",
  filterCategory: externalCategory,
  onCategoryChange: externalCategoryChange,
  filterAccount: externalAccount,
  onAccountChange: externalAccountChange,
  filterStatus: externalStatus,
  onStatusChange: externalStatusChange,
  filterRange = "ALL",
  onRangeChange,
}) => {
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const activeCategory =
    externalCategory !== undefined ? externalCategory : selectedCategory;
  const onCategoryChange =
    externalCategoryChange !== undefined
      ? externalCategoryChange
      : setSelectedCategory;

  const activeAccount =
    externalAccount !== undefined ? externalAccount : selectedAccount;
  const onAccountChange =
    externalAccountChange !== undefined
      ? externalAccountChange
      : setSelectedAccount;

  const activeStatus =
    externalStatus !== undefined ? externalStatus : selectedStatus;
  const onStatusChange =
    externalStatusChange !== undefined
      ? externalStatusChange
      : setSelectedStatus;
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendTransactions, setBackendTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [categoriesData, setCategoriesData] = useState({
    expense: [],
    income: [],
  });
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategoriesData = async () => {
    try {
      const data = await fetchCategories();
      setCategoriesData(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCategoriesData();
    }
  }, [user?.id]);

  // Hardcoded categories removed.

  const getCategoryGroup = (category) => {
    const group = categoriesData.expense.find((g) =>
      g.subCategories.some((sub) => sub.name === category),
    );
    return group ? group.name : null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Helper to calculate start/end dates from range string
  const calculateDateRange = (range) => {
    if (!range || range === "ALL") return { startDate: "", endDate: "" };

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(3000, 0, 1);

    // Reset time to start of day
    now.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    if (range.startsWith("MONTH_")) {
      const [_, year, month] = range.split("_");
      startDate = new Date(year, month, 1);
      endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);
    } else if (range.startsWith("RANGE_")) {
      const [_, start, end] = range.split("_");
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (range) {
        case "TODAY":
          // startDate is already today 00:00
          break;
        case "7D":
          startDate.setDate(now.getDate() - 7);
          break;
        case "THIS_WEEK":
          const day = now.getDay() || 7;
          if (day !== 1) startDate.setHours(-24 * (day - 1));
          break;
        case "30D":
          startDate.setDate(now.getDate() - 30);
          break;
        case "MONTH":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "3M":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return { startDate: "", endDate: "" };
      }
    }

    // Format to YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate || now),
    };
  };

  const fetchTransactions = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const group = categoriesData.expense.find(
        (g) => g.name === activeCategory,
      );
      const categoryParam = group
        ? group.subCategories.map((s) => s.name).join(",")
        : activeCategory;

      const { startDate, endDate } = calculateDateRange(filterRange);

      const params = new URLSearchParams({
        user_id: user.id,
        search: searchTerm,
        category: categoryParam,
        account: activeAccount, // Add account filter
        status: activeStatus, // Add status filter
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        page: currentPage,
        limit: rowsPerPage,
        type: fixedType || "all",
      });

      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await fetch(
        `${API_URL}/transaction?${params.toString()}`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();

      if (response.ok) {
        setBackendTransactions(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        showNotification(`Gagal mengambil data: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showNotification(`Error mengambil data: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    user?.id,
    searchTerm,
    activeCategory,
    activeAccount,
    sortConfig,
    currentPage,
    rowsPerPage,
    filterRange,
  ]);

  // Real-time Update Listener
  useEffect(() => {
    const handleRealtimeUpdate = (event) => {
      console.log("♻️ Real-time Data Update Detected:", event.detail);
      // Only refresh if the update belongs to our current user (safety check)
      if (event.detail.data?.user_id == user?.id) {
        fetchTransactions();
      }
    };

    window.addEventListener("transaction_updated", handleRealtimeUpdate);
    return () =>
      window.removeEventListener("transaction_updated", handleRealtimeUpdate);
  }, [user?.id]); // Re-bind if user changes

  // Override onRefresh to use local fetch if provided
  const handleRefresh = () => {
    fetchTransactions();
    if (onRefresh) onRefresh();
  };

  // Reset page when filtering or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, activeAccount, sortConfig]);

  // Handlers
  const handleEditClick = (tx) => {
    setSelectedTx(tx);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (tx) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  const confirmDelete = async () => {
    if (!selectedTx) return;
    setIsDeleting(true);
    try {
      console.log(`Deleting ID: ${selectedTx.id}`);
      const response = await fetch(`${API_URL}/transaction/${selectedTx.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Safely parse JSON
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { message: text || response.statusText };
      }

      if (response.ok) {
        // Refresh data
        handleRefresh();
        showNotification("Transaksi berhasil dihapus!", "success");
        setIsDeleteOpen(false);
      } else {
        console.error("Delete failed:", result);
        showNotification(
          `Gagal menghapus transaksi: ${result.message || "Unknown Error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification(`Error menghapus transaksi: ${error.message}`, "error");
    } finally {
      setIsDeleting(false);
      setSelectedTx(null);
    }
  };

  const handleEditSuccess = () => {
    handleRefresh();
    setIsEditOpen(false);
    setSelectedTx(null);
  };

  const handleViewAll = () => {
    if (isExpanded) {
      setRowsPerPage(10);
      setIsExpanded(false);
    } else {
      setRowsPerPage(totalItems > 0 ? totalItems : 100);
      setIsExpanded(true);
    }
    setCurrentPage(1);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header section with search */}
      <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mengelola rekaman terbaru Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {externalCategory === undefined && (
            <>
              <CategoryFilter
                currentCategory={activeCategory}
                onCategoryChange={onCategoryChange}
                categories={categoriesData}
              />
              <AccountFilter
                currentAccount={activeAccount}
                onAccountChange={onAccountChange}
              />
              <StatusFilter
                currentStatus={activeStatus}
                onStatusChange={onStatusChange}
              />
            </>
          )}

          {onRangeChange && (
            <TimeFilter
              currentRange={filterRange}
              onRangeChange={onRangeChange}
            />
          )}

          <div className="relative w-full sm:w-64 group">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-finance-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Cari cepat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-finance-primary/10 focus:border-finance-primary/30 transition-all placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-slate-300 dark:border-slate-800">
        <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="text-[11px] font-black text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 uppercase tracking-tight">
              <th
                className="px-4 py-2 border-r border-slate-300 w-32 cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => requestSort("date")}
              >
                <div className="flex items-center gap-1.5">
                  Tanggal
                  {sortConfig.key === "date" && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 border-r border-slate-300 w-48 cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => requestSort("category")}
              >
                <div className="flex items-center gap-1.5">
                  Kategori
                  {sortConfig.key === "category" && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 border-r border-slate-300 w-64 cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => requestSort("description")}
              >
                <div className="flex items-center gap-1.5">
                  Deskripsi
                  {sortConfig.key === "description" && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-300 hidden lg:table-cell w-32">
                Metode
              </th>
              <th className="px-4 py-2 border-r border-slate-300 hidden lg:table-cell w-32">
                Akun
              </th>
              <th className="px-4 py-2 border-r border-slate-300 hidden xl:table-cell w-24 text-center">
                Status
              </th>
              <th
                className="px-4 py-2 border-r border-slate-300 w-40 text-right cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => requestSort("amount")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  Jumlah
                  {sortConfig.key === "amount" && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-medium tabular-nums divide-y divide-slate-300">
            {isLoading && (
              <tr>
                <td colSpan="8" className="py-20 text-center bg-white/50">
                  <Loader2
                    className="animate-spin text-finance-primary mx-auto"
                    size={40}
                  />
                </td>
              </tr>
            )}
            {backendTransactions.length > 0 ? (
              backendTransactions.map((tx, idx) => {
                return (
                  <tr
                    key={tx.id}
                    className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-800/50"} hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group border-b border-slate-100 dark:border-slate-800`}
                  >
                    <td className="px-4 py-2 border-r border-slate-200 text-slate-800 font-bold whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        <span className="font-bold text-slate-900 truncate">
                          {tx.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 text-slate-600 truncate max-w-sm italic">
                      {tx.description || "-"}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-[10px] hidden lg:table-cell uppercase">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hidden lg:table-cell">
                      {tx.account}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 text-center hidden xl:table-cell">
                      {tx.status === "done" ? (
                        <span className="text-[9px] font-black text-slate-400">
                          DONE
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 border-r border-slate-200 text-right font-black ${
                        tx.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-1 text-slate-400 hover:text-finance-primary hover:bg-finance-primary/10 rounded transition-all"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Inbox size={48} strokeWidth={1} className="mb-2" />
                    <p className="text-sm font-medium">
                      Tidak ada transaksi ditemukan
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination / Footer */}
      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan{" "}
          <span className="text-slate-800">
            {(currentPage - 1) * rowsPerPage + 1}
          </span>{" "}
          sampai{" "}
          <span className="text-slate-800">
            {Math.min(currentPage * rowsPerPage, totalItems)}
          </span>{" "}
          dari <span className="text-slate-800">{totalItems}</span> rekaman
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          {[...Array(totalPages)]
            .map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 text-[11px] font-bold rounded-lg transition-all ${
                  currentPage === i + 1
                    ? "bg-finance-primary text-white shadow-lg shadow-finance-primary/30"
                    : "text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))
            .slice(
              Math.max(0, currentPage - 3),
              Math.min(totalPages, currentPage + 2),
            )}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || totalItems === 0}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
          >
            <ChevronRight size={16} />
          </button>

          <Button
            variant="ghost"
            size="sm"
            className="ml-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-finance-primary"
            onClick={handleViewAll}
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                <ChevronUp size={14} /> Minimize
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Lihat Semua <ChevronDown size={14} />
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Transaksi"
        maxWidth="max-w-md"
      >
        {selectedTx && (
          <TransactionFormOrganism
            user={user}
            initialData={selectedTx}
            isEdit={true}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditOpen(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Transaksi"
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">
            Apakah Anda yakin?
          </h4>
          <p className="text-slate-500 mb-6">
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus transaksi
            secara permanen
            <span className="font-semibold text-slate-700 block mt-1">
              {selectedTx?.description} (
              {selectedTx ? formatCurrency(selectedTx.amount) : ""})
            </span>
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600"
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
