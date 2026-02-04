import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Tag,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  Download,
  Wallet,
} from "lucide-react";
import { TimeFilter } from "../molecules/TimeFilter";
import { CategoryFilter } from "../molecules/CategoryFilter";
import { AccountFilter } from "../molecules/AccountFilter";
import { Badge } from "../atoms/Badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL } from "../../config/api";
import { fetchCategories } from "../../services/categoryService";
import { CashFlowSankey } from "./CashFlowSankey";
import { SpendingBreakdown } from "./SpendingBreakdown";
import { ReportCashFlowChart } from "./ReportCashFlowChart";
import { IncomeAnalysis } from "./IncomeAnalysis";

export const ReportDashboardOrganism = ({ user }) => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState("30D");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [categoriesData, setCategoriesData] = useState({
    expense: [],
    income: [],
  });
  const [reportTab, setReportTab] = useState("cashflow");

  // ... (rest of the file until the income tab) ...

  // Hardcoded categories removed.

  const getCategoryGroup = (category) => {
    const group = categoriesData.expense.find((g) =>
      g.subCategories.some((sub) => sub.name === category),
    );
    return group ? group.name : null;
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchAccounts();
      fetchCategoriesData();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/transaction?user_id=${user.id}`);
      const result = await response.json();
      if (response.ok) {
        setAllTransactions(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const data = await fetchCategories();
      setCategoriesData(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchAccounts = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/accounts?user_id=${user.id}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) {
        setAccounts(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = (data, range) => {
    if (!range || range === "ALL") return data;

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    now.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    if (range.startsWith("RANGE_")) {
      const [_, start, end] = range.split("_");
      startDate = new Date(start);
      endDate = new Date(end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return data.filter((tx) => {
        const d = new Date(tx.date);
        return d >= startDate && d <= endDate;
      });
    }

    if (range.startsWith("MONTH_")) {
      const [_, year, month] = range.split("_");
      startDate = new Date(year, month, 1);
      endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);
      return data.filter((tx) => {
        const d = new Date(tx.date);
        return d >= startDate && d <= endDate;
      });
    }

    switch (range) {
      case "TODAY":
        break;
      case "7D":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30D":
        startDate.setDate(now.getDate() - 30);
        break;
      case "THIS_WEEK":
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
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
        break;
    }
    return data.filter((tx) => new Date(tx.date) >= startDate);
  };

  const filteredTransactions = useMemo(() => {
    let data = applyTimeFilter(allTransactions, filterRange);
    if (filterCategory) {
      data = data.filter((tx) => {
        if (tx.category === filterCategory) return true;

        const group = categoriesData.expense.find(
          (g) => g.name === filterCategory,
        );
        if (group) {
          return group.subCategories.some((sub) => sub.name === tx.category);
        }
        return false;
      });
    }
    if (filterAccount) {
      data = data.filter(
        (tx) => tx.account === filterAccount || tx.to_account === filterAccount,
      );
    }
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTransactions, filterRange, filterCategory, filterAccount]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const amt = parseFloat(tx.amount);
        if (tx.type === "income") acc.income += amt;
        else acc.expense += amt;
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 },
    );
  }, [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = filteredTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => {
        if (!acc[tx.category]) acc[tx.category] = 0;
        acc[tx.category] += parseFloat(tx.amount);
        return acc;
      }, {});

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const exportToPDF = () => {
    // Initialize jsPDF in Landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const dateNow = new Date().toLocaleDateString("id-ID");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Professional Header & Background
    doc.setFillColor(15, 23, 42); // Slate 900 (Finance Primary)
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFontSize(28);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN TAHUNAN", 15, 25);

    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak pada: ${dateNow}`, pageWidth - 15, 15, {
      align: "right",
    });
    doc.text(`User: ${user.fullName || user.email}`, pageWidth - 15, 22, {
      align: "right",
    });

    // Subheader bar for Filters
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 40, pageWidth, 20, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 60, pageWidth, 60);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    let periodLabel = filterRange;
    if (filterRange === "ALL") periodLabel = "Semua Waktu";
    else if (filterRange === "TODAY") periodLabel = "Hari Ini";
    else if (filterRange === "7D") periodLabel = "7 Hari Terakhir";
    else if (filterRange === "30D") periodLabel = "30 Hari Terakhir";
    else if (filterRange === "MONTH") periodLabel = "Bulan Ini";
    else if (filterRange.startsWith("MONTH_")) {
      const [_, y, m] = filterRange.split("_");
      periodLabel = new Date(y, m).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } else if (filterRange.startsWith("RANGE_")) {
      const [_, s, e] = filterRange.split("_");
      periodLabel = `${new Date(s).toLocaleDateString("id-ID")} - ${new Date(e).toLocaleDateString("id-ID")}`;
    }

    doc.text(`PERIODE: ${periodLabel.toUpperCase()}`, 15, 52);
    doc.text(`AKUN: ${(filterAccount || "SEMUA AKUN").toUpperCase()}`, 120, 52);
    doc.text(
      `KATEGORI: ${(filterCategory || "SEMUA KATEGORI").toUpperCase()}`,
      200,
      52,
    );

    // 2. Summary Section - Two Columns Layout
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont("helvetica", "bold");
    doc.text("IKHTISAR SALDO", 15, 75);

    autoTable(doc, {
      startY: 80,
      margin: { left: 15 },
      tableWidth: 120,
      head: [["DESKRIPSI", "JUMLAH"]],
      body: [
        ["TOTAL PEMASUKAN", formatCurrency(summary.income)],
        ["TOTAL PENGELUARAN", formatCurrency(summary.expense)],
        ["SALDO BERSIH", formatCurrency(summary.balance)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold" },
      },
    });

    doc.text("DISTRIBUSI PENGELUARAN", 150, 75);
    autoTable(doc, {
      startY: 80,
      margin: { left: 150 },
      tableWidth: 130,
      head: [["KATEGORI", "PERSENTASE", "JUMLAH"]],
      body: categoryBreakdown
        .slice(0, 5)
        .map((item) => [
          item.name,
          `${((item.value / summary.expense) * 100).toFixed(1)}%`,
          formatCurrency(item.value),
        ]),
      theme: "grid",
      headStyles: {
        fillColor: [51, 65, 85], // Slate 700
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right", fontStyle: "bold" },
      },
    });

    // 3. Ledger (Detailed List) - New Page
    doc.addPage();
    // Repeating header style for readability
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.text("BUKU KAS / RINCIAN TRANSAKSI DETAIL", 15, 10);

    autoTable(doc, {
      startY: 20,
      head: [
        [
          "TANGGAL",
          "TIPE",
          "KATEGORI",
          "DESKRIPSI",
          "JUMLAH",
          "AKUN",
          "METODE",
          "STATUS",
        ],
      ],
      body: filteredTransactions.map((tx) => [
        new Date(tx.date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        tx.type === "income" ? "MASUK" : "KELUAR",
        tx.category.toUpperCase(),
        tx.description || "-",
        `${tx.type === "income" ? "+" : "-"}${formatCurrency(tx.amount)}`,
        tx.account.toUpperCase(),
        (tx.payment_method || "-").toUpperCase(),
        tx.status.toUpperCase(),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: "center", fontStyle: "bold" },
        4: { halign: "right", fontStyle: "bold" },
        7: { halign: "center" },
      },
      // Column width distribution for landscape
      columnWidths: {
        0: 30, // Date
        1: 20, // Type
        2: 40, // Category
        3: 65, // Description (Largo)
        4: 40, // Amount
        5: 30, // Account
        6: 25, // Method
        7: 20, // Status
      },
    });

    // Footer with page numbering
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      // Line above footer
      doc.setDrawColor(226, 232, 240);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

      doc.text(
        `© ${new Date().getFullYear()} MyTodo Financial Planner | Laporan Dihasilkan Secara Otomatis`,
        15,
        pageHeight - 10,
      );
      doc.text(
        `Halaman ${i} dari ${totalPages}`,
        pageWidth - 15,
        pageHeight - 10,
        {
          align: "right",
        },
      );
    }

    doc.save(
      `Laporan_Keuangan_${user.fullName || "User"}_${new Date().getTime()}.pdf`,
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && allTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p>Memuat data keuangan...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] p-4 space-y-6 animate-fade-in font-inter text-slate-800">
      {/* Header & Filters */}
      {/* Header & Filters Section */}
      <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Financial Report
            </h2>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              View and download your financial statements
            </p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button
              onClick={exportToPDF}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white hover:bg-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 text-sm font-black active:scale-95"
            >
              <Download size={18} />
              <span>EXPORT PDF</span>
            </button>
            <button
              onClick={fetchTransactions}
              className="p-3.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Cohesive Filter Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-6 border-t border-slate-50">
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
              categories={categoriesData}
            />
          </div>
          <div className="w-full sm:w-auto">
            <TimeFilter
              currentRange={filterRange}
              onRangeChange={setFilterRange}
            />
          </div>

          {(filterCategory || filterAccount || filterRange !== "ALL") && (
            <button
              onClick={() => {
                setFilterCategory("");
                setFilterAccount("");
                setFilterRange("ALL");
              }}
              className="text-[11px] font-black text-rose-500 hover:text-rose-600 bg-rose-50 px-4 py-2 rounded-full transition-all uppercase tracking-widest"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards - Grid on Desktop, Slider/Swap on Mobile */}
      <div className="relative">
        <div className="hidden md:grid grid-cols-3 gap-6">
          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <TrendingUp size={28} />
              </div>
              <Badge
                variant="success"
                className="font-black text-[10px] tracking-widest"
              >
                INCOME
              </Badge>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Pemasukan
            </p>
            <p className="text-3xl font-black text-emerald-600 tabular-nums">
              {formatCurrency(summary.income)}
            </p>
          </div>

          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <TrendingDown size={28} />
              </div>
              <Badge
                variant="danger"
                className="font-black text-[10px] tracking-widest"
              >
                EXPENSE
              </Badge>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Pengeluaran
            </p>
            <p className="text-3xl font-black text-rose-600 tabular-nums">
              {formatCurrency(summary.expense)}
            </p>
          </div>

          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Wallet size={28} />
              </div>
              <Badge
                variant="primary"
                className="font-black text-[10px] tracking-widest"
              >
                NET BALANCE
              </Badge>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              Saldo Bersih
            </p>
            <p className="text-3xl font-black text-blue-600 tabular-nums">
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        {/* Mobile View Summary Cards - Vertical Stack (Monarch Style) */}
        <div className="md:hidden flex flex-col gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Income
                </p>
                <p className="text-xl font-black text-emerald-600 tabular-nums">
                  {formatCurrency(summary.income)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Expense
                </p>
                <p className="text-xl font-black text-rose-600 tabular-nums">
                  {formatCurrency(summary.expense)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Net Balance
                </p>
                <p className="text-xl font-black text-blue-600 tabular-nums">
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT VISUALIZATION TABS */}
      <div className="mt-8">
        <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full md:w-fit mb-6 border border-slate-200 shadow-sm mx-auto md:mx-0">
          <button
            onClick={() => setReportTab("cashflow")}
            className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              reportTab === "cashflow"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setReportTab("spending")}
            className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              reportTab === "spending"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Spending
          </button>
          <button
            onClick={() => setReportTab("income")}
            className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              reportTab === "income"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Income
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {reportTab === "cashflow" && (
            <>
              {/* Desktop Sankey */}
              <div className="hidden md:block">
                <CashFlowSankey transactions={filteredTransactions} />
              </div>

              {/* Mobile Simplified Bar View */}
              <div className="md:hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Cash Flow Trend</h3>
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <TrendingUp size={16} />
                  </div>
                </div>

                {/* Cash Flow Bar Chart */}
                <div className="w-full h-[320px] -mx-4">
                  <ReportCashFlowChart transactions={filteredTransactions} />
                </div>
              </div>
            </>
          )}

          {reportTab === "spending" && (
            <SpendingBreakdown
              transactions={filteredTransactions}
              totalExpense={summary.expense}
            />
          )}
          {/* INCOME ANALYSIS TAB */}
          {reportTab === "income" && (
            <IncomeAnalysis
              transactions={filteredTransactions}
              totalIncome={summary.income}
            />
          )}
        </div>
      </div>
    </div>
  );
};
