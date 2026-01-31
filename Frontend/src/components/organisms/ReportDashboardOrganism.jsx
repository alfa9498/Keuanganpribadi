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

export const ReportDashboardOrganism = ({ user }) => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState("30D");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");

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
    Sewa: ["Sewa", "mobil", "motor", "kontrakan", "kosan"],
    Lainnya: ["Lainnya"],
  };

  const getCategoryGroup = (category) => {
    for (const [group, items] of Object.entries(expenseCategories)) {
      if (items.includes(category)) return group;
    }
    return null;
  };

  useEffect(() => {
    if (user?.id) fetchTransactions();
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
        // If the selected category is a group, check if tx.category is inside it
        if (expenseCategories[filterCategory]) {
          return expenseCategories[filterCategory].includes(tx.category);
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
    doc.setFillColor(37, 99, 235); // Finance Primary Blue
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
    doc.setTextColor(30, 41, 59);
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
        fillColor: [37, 99, 235],
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
        fillColor: [71, 85, 105],
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
    doc.setFillColor(30, 41, 59);
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
        fillColor: [37, 99, 235],
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Financial Report
          </h2>
          <p className="text-sm text-slate-500">
            View and download your financial statements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          <div className="flex flex-wrap gap-2">
            <AccountFilter
              currentAccount={filterAccount}
              onAccountChange={setFilterAccount}
            />
            <CategoryFilter
              currentCategory={filterCategory}
              onCategoryChange={setFilterCategory}
            />
            <TimeFilter
              currentRange={filterRange}
              onRangeChange={setFilterRange}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchTransactions}
              className="p-2 bg-white text-slate-400 hover:text-finance-primary rounded-lg border border-slate-200 transition-all hover:border-finance-primary"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>

            {(filterCategory || filterAccount || filterRange !== "ALL") && (
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterAccount("");
                  setFilterRange("ALL");
                }}
                className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all"
              >
                Reset
              </button>
            )}

            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-lg transition-all shadow-lg shadow-slate-900/10 text-xs font-bold"
            >
              <Download size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards (Simple) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Income
            </p>
            <p className="text-lg font-bold text-emerald-600 mt-1">
              {formatCurrency(summary.income)}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <TrendingUp size={20} />
          </div>
        </div>
        {/* Expense */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Expense
            </p>
            <p className="text-lg font-bold text-rose-600 mt-1">
              {formatCurrency(summary.expense)}
            </p>
          </div>
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
            <TrendingDown size={20} />
          </div>
        </div>
        {/* Balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Net Balance
            </p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formatCurrency(summary.balance)}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table Only - Full Width */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-300 flex justify-between items-center bg-slate-100/50">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <FileText size={16} className="text-finance-primary" />
            Buku Kas / Ledger Transaksi
          </h3>
          <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-300 px-3 py-1 rounded-full shadow-sm">
            {filteredTransactions.length} ENTRIES
          </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-t border-slate-300">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="text-[11px] font-black text-slate-700 bg-slate-200 border-b border-slate-300 uppercase tracking-tight">
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 w-32">
                  Tanggal
                </th>
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 w-20">
                  Tipe
                </th>
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 w-48">
                  Kategori / Deskripsi
                </th>
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 text-right w-40">
                  Jumlah
                </th>
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 hidden lg:table-cell w-32">
                  Akun
                </th>
                <th className="px-4 py-2 bg-slate-200 border-r border-slate-300 hidden xl:table-cell w-32">
                  Metode
                </th>
                <th className="px-4 py-2 bg-slate-200 text-center hidden md:table-cell w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium tabular-nums divide-y divide-slate-300">
              {filteredTransactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/80"} hover:bg-blue-50/50 transition-colors group`}
                >
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-800 font-bold whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${tx.type === "income" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}
                    >
                      {tx.type === "income" ? "IN" : "OUT"}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 leading-none mb-0.5">
                        {tx.category}
                      </span>
                      {tx.description && (
                        <span className="text-[10px] text-slate-500 italic truncate max-w-full">
                          {tx.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`px-4 py-2 border-r border-slate-200 text-right font-black ${tx.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-700 hidden lg:table-cell">
                    {tx.account}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-[10px] hidden xl:table-cell">
                    {tx.payment_method}
                  </td>
                  <td className="px-4 py-2 text-center hidden md:table-cell">
                    {tx.status === "done" ? (
                      <span className="text-[9px] font-black text-slate-400">
                        DONE
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        PENDING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    No records found.
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
