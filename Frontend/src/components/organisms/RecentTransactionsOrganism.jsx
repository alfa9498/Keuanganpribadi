import React, { useState, useMemo, useEffect } from "react";
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
import { API_URL } from "../../config/api";

export const RecentTransactionsOrganism = ({
  transactions,
  onViewAll,
  user,
  onRefresh,
  fixedType = null,
  title = "Transaksi Terakhir",
  filterCategory: externalCategory,
  filterRange = "ALL",
  onRangeChange,
}) => {
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const activeCategory =
    externalCategory !== undefined ? externalCategory : selectedCategory;
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

  const expenseCategories = {
    Makanan: ["Makanan", "Makan & Minum", "Sarapan", "Jajan Harian"],
    Transportasi: [
      "Transportasi",
      "Transport Harian",
      "Bensin",
      "Parkir",
      "Ojol / Taksi Online",
      "pengeluaran Pulang",
    ],
    Tagihan: [
      "Tagihan",
      "Listrik",
      "Internet",
      "Pulsa",
      "Air",
      "Tagihan Internet",
      "Biaya Admin",
    ],
    Belanja: [
      "Belanja",
      "Belanja Bulanan",
      "Shopping",
      "shopee",
      "Laundry",
      "Marketplace (Shopee, dll)",
    ],
    Hiburan: ["Hiburan", "Nongkrong", "Jalan-jalan"],
    Kesehatan: ["Kesehatan", "Berobat", "Obat", "BPJS / Asuransi"],
    Pendidikan: ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
    "Orang Tua": [
      "Orang Tua",
      "Orang tua aa",
      "Orang tua neng",
      "Listrik Orang Tua",
      "Pulsa Orang Tua",
    ],
    Hadiah: ["Hadiah", "Hadiah / Acara", "Acara", "Ulang Tahun", "Nikahan"],
    Keuangan: [
      "Keuangan",
      "Tabungan",
      "Investasi",
      "Hutang",
      "Piutang",
      "Tarik Tunai",
      "Cicilan / Hutang",
      "Tabungan anak",
      "Tabung Kita",
    ],
    Lainnya: ["Lainnya"],
  };

  const getCategoryGroup = (category) => {
    for (const [group, items] of Object.entries(expenseCategories)) {
      if (items.includes(category)) return group;
    }
    return null;
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
      const categoryParam = expenseCategories[activeCategory]
        ? expenseCategories[activeCategory].join(",")
        : activeCategory;

      const { startDate, endDate } = calculateDateRange(filterRange);

      const params = new URLSearchParams({
        user_id: user.id,
        search: searchTerm,
        category: categoryParam,
        account: selectedAccount, // Add account filter
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
    selectedAccount,
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
  }, [searchTerm, activeCategory, selectedAccount, sortConfig]);

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
    // Show all items (disable pagination limit)
    setRowsPerPage(totalItems > 0 ? totalItems : 100);
    setCurrentPage(1);

    // We do NOT reset filters here, allowing the user to view all
    // records matching their current filter selection.
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Header section with search */}
      <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500">
            Mengelola rekaman terbaru Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {externalCategory === undefined && (
            <>
              <CategoryFilter
                currentCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <AccountFilter
                currentAccount={selectedAccount}
                onAccountChange={setSelectedAccount}
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-finance-primary/10 focus:border-finance-primary/30 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-white shadow-sm">
            <tr className="border-y border-slate-100/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              {[
                { key: "date", label: "Tanggal" },
                { key: "category", label: "Kategori" },
                { key: "description", label: "Deskripsi" },
                { key: "payment_method", label: "Metode", hideOnSmall: true },
                { key: "account", label: "Akun", hideOnSmall: true },
                { key: "status", label: "Status", hideOnSmall: true },
                { key: "amount", label: "Jumlah", align: "right" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors select-none ${col.align === "right" ? "text-right" : ""} ${col.hideOnSmall ? "hidden lg:table-cell" : ""}`}
                  onClick={() => requestSort(col.key)}
                >
                  <div
                    className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}
                  >
                    {col.label}
                    {sortConfig.key === col.key ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp size={12} className="text-finance-primary" />
                      ) : (
                        <ChevronDown
                          size={12}
                          className="text-finance-primary"
                        />
                      )
                    ) : (
                      <ArrowUpDown
                        size={12}
                        className="text-slate-300 group-hover:text-slate-400 transition-colors"
                      />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  Aksi
                  {isExpanded && (
                    <button
                      onClick={() => {
                        setRowsPerPage(10);
                        setIsExpanded(false);
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-[10px] font-bold transition-all shadow-sm"
                      title="Minimize back to 10"
                    >
                      <ChevronUp size={12} />
                      MIN
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 relative">
            {isLoading && (
              <tr className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                <td colSpan="8" className="py-20 text-center">
                  <Loader2
                    className="animate-spin text-finance-primary mx-auto"
                    size={40}
                  />
                </td>
              </tr>
            )}
            {backendTransactions.length > 0 ? (
              backendTransactions.map((tx) => {
                return (
                  <tr
                    key={tx.id}
                    className="group hover:bg-indigo-50/30 transition-all duration-200"
                  >
                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap text-sm">
                      <span className="font-medium">
                        {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span className="text-slate-400 ml-1 text-[11px]">
                        {new Date(tx.date).getFullYear()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {tx.type === "income" ? (
                          <TrendingUp
                            size={16}
                            className="text-emerald-600 flex-shrink-0"
                          />
                        ) : (
                          <TrendingDown
                            size={16}
                            className="text-rose-600 flex-shrink-0"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 leading-tight">
                            {getCategoryGroup(tx.category) || tx.category}
                          </span>
                          {getCategoryGroup(tx.category) &&
                            getCategoryGroup(tx.category) !== tx.category && (
                              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                {tx.category}
                              </span>
                            )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="py-4 px-4 text-slate-600 max-w-xs text-sm truncate group-hover:text-slate-900 transition-colors"
                      title={tx.description}
                    >
                      {tx.description || (
                        <span className="text-slate-300 italic">No notes</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs font-medium hidden lg:table-cell">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-bold text-xs hidden lg:table-cell">
                      {tx.account}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <Badge
                        variant={tx.status === "done" ? "info" : "warning"}
                        className="rounded-md font-bold"
                      >
                        {tx.status === "done" ? "DONE" : "PENDING"}
                      </Badge>
                    </td>
                    <td
                      className={`py-4 px-4 text-right text-sm font-medium tabular-nums ${
                        tx.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-1.5 text-slate-400 hover:text-finance-primary hover:bg-finance-primary/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
                    <p className="text-xs mt-1">
                      Coba sesuaikan filter atau pencarian Anda
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
        maxWidth="max-w-xl"
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
