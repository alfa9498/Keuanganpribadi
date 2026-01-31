import React, { useState, useEffect } from "react";
import { Button } from "../atoms/Button";
import { StatCard } from "../molecules/StatCard";
import { BentoGrid, BentoCard } from "../atoms/BentoGrid";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

import { TimeFilter } from "../molecules/TimeFilter";
import { CategoryFilter } from "../molecules/CategoryFilter";
import {
  Calendar,
  Wallet,
  Landmark,
  Coins,
  TrendingUp,
  CreditCard,
  X,
} from "lucide-react";
import { API_URL } from "../../config/api";

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

  const n = name?.toUpperCase() || "";
  if (
    n.includes("BCA") ||
    n.includes("MANDIRI") ||
    n.includes("BNI") ||
    n.includes("BSI") ||
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

// getAccountIcon removed from here and moved above as per previous chunk.

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
    name,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#fff"
        className="text-xs font-bold"
      >
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#94a3b8"
        className="text-[10px]"
      >
        {new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(value)}
        <tspan fill="#64748b" className="ml-1">
          {" "}
          ({(percent * 100).toFixed(1)}%)
        </tspan>
      </text>
    </g>
  );
};

const CustomBarLabel = (props) => {
  const { x, y, width, height, value } = props;
  const formattedValue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

  // Threshold to decide if text fits inside (approx 80px for currency)
  const isShortBar = width < 80;

  return (
    <text
      x={isShortBar ? x + width + 5 : x + width - 5}
      y={y + height / 2 + 4}
      fill={isShortBar ? "#94a3b8" : "#fff"}
      fontSize={10}
      fontWeight="bold"
      textAnchor={isShortBar ? "start" : "end"}
    >
      {formattedValue}
    </text>
  );
};

export const DashboardOrganism = ({
  user,
  onLogout,
  filterRange,
  setFilterRange,
  filterCategory,
  setFilterCategory,
  filterAccount,
  setFilterAccount,
}) => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [allPieData, setAllPieData] = useState([]); // Data for "All Categories" chart
  const [barDataMain, setBarDataMain] = useState([]); // Horizontal Bar: Main Category
  const [barDataSub, setBarDataSub] = useState([]); // Horizontal Bar: Sub Category
  const [barDataAccount, setBarDataAccount] = useState([]); // Horizontal Bar: Account (Expenses)
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all raw data
  const [debtSummary, setDebtSummary] = useState({
    remainingHutang: 0,
    remainingPiutang: 0,
  });
  const [accountSummaries, setAccountSummaries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [debtModal, setDebtModal] = useState({
    show: false,
    type: "",
    title: "",
    data: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIndexAll, setActiveIndexAll] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieEnterAll = (_, index) => {
    setActiveIndexAll(index);
  };

  const handleOpenDebtModal = (type) => {
    const title =
      type === "hutang"
        ? "Daftar Hutang Saya"
        : "Daftar Piutang (Uang di Orang)";
    const relevantData = allTransactions
      .filter((tx) => {
        if (type === "hutang") {
          return (
            (tx.type === "income" && tx.category === "Hutang") ||
            (tx.type === "expense" && tx.category === "Cicilan / Hutang")
          );
        } else {
          return (
            (tx.type === "expense" && tx.category === "Piutang") ||
            (tx.type === "income" && tx.category === "Piutang")
          );
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setDebtModal({ show: true, type, title, data: relevantData });
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      const filtered = applyFilter(
        allTransactions,
        filterRange,
        filterCategory,
        filterAccount,
      );
      processData(filtered);
    }
  }, [filterRange, filterCategory, filterAccount, allTransactions, accounts]);

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

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${API_URL}/transaction?user_id=${user.id}`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();
      if (response.ok) {
        setAllTransactions(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const applyFilter = (data, range, category, account) => {
    let filtered = [...data];

    // 1. Filter by Category first if selected
    if (category) {
      filtered = filtered.filter((tx) => {
        if (tx.category === category) return true;
        if (expenseCategories[category]) {
          return expenseCategories[category].includes(tx.category);
        }
        return false;
      });
    }

    // 1.5 Filter by Account if selected
    if (account) {
      filtered = filtered.filter((tx) => tx.account === account);
    }

    // 2. Filter by Time Range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(3000, 0, 1); // Default to future if not strict window

    // Reset time to start of day for accurate comparison
    now.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    // Handle Custom Month Range OR Custom Date Range
    if (range.startsWith("MONTH_")) {
      const [_, year, month] = range.split("_");
      startDate = new Date(year, month, 1);
      endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);

      return filtered.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    // Handle Custom Range (RANGE_START_END)
    if (range.startsWith("RANGE_")) {
      const [_, start, end] = range.split("_");
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      return filtered.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    switch (range) {
      case "TODAY":
        // startDate is already today 00:00
        break;
      case "7D":
        startDate.setDate(now.getDate() - 7);
        break;
      case "THIS_WEEK":
        // Assuming week starts on Monday (1)
        const day = now.getDay() || 7; // Sunday is 0, make it 7
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
      case "ALL":
        return filtered;
      default:
        break;
    }

    return filtered.filter((tx) => new Date(tx.date) >= startDate);
  };

  const processData = (transactions) => {
    let income = 0;
    let expense = 0;
    const dateMap = {};
    const categoryMap = {}; // Will now store aggregation by Main Category

    // Helper to map any sub-category to its Main Category
    const reverseCategoryMap = {};
    Object.keys(expenseCategories).forEach((mainCat) => {
      expenseCategories[mainCat].forEach((subCat) => {
        reverseCategoryMap[subCat] = mainCat;
      });
    });

    // Account balance logic using accounts from DB
    const accMap = accounts.reduce((acc, account) => {
      acc[account.name] = {
        name: account.name,
        icon: account.icon,
        type: account.type,
        income: 0,
        expense: 0,
        balance: parseFloat(account.initial_balance || 0),
        transfers_in: 0,
        transfers_out: 0,
      };
      return acc;
    }, {});

    allTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount);

      // Robustness: Handle transactions for accounts not in DB
      if (!accMap[tx.account]) {
        accMap[tx.account] = {
          name: tx.account,
          icon: "HelpCircle", // Fallback icon name
          type: "Unregistered",
          income: 0,
          expense: 0,
          balance: 0,
          transfers_in: 0,
          transfers_out: 0,
        };
      }

      if (tx.type === "income") {
        accMap[tx.account].income += amt;
      } else if (tx.type === "expense") {
        accMap[tx.account].expense += amt;
      } else if (tx.type === "transfer") {
        accMap[tx.account].transfers_out += amt;
        if (tx.to_account) {
          if (!accMap[tx.to_account]) {
            accMap[tx.to_account] = {
              name: tx.to_account,
              icon: "HelpCircle",
              type: "Unregistered",
              income: 0,
              expense: 0,
              balance: 0,
              transfers_in: 0,
              transfers_out: 0,
            };
          }
          accMap[tx.to_account].transfers_in += amt;
        }
      }
    });

    const accList = Object.values(accMap)
      .map((acc) => ({
        ...acc,
        balance:
          acc.balance +
          acc.income +
          acc.transfers_in -
          (acc.expense + acc.transfers_out),
      }))
      .sort((a, b) => b.balance - a.balance)
      .filter((acc) => (filterAccount ? acc.name === filterAccount : true));
    setAccountSummaries(accList);

    // Hutang & Piutang Logic (Always based on ALL transactions for current status)
    let totalHutangReceived = 0;
    let totalHutangPaid = 0;
    let totalPiutangGiven = 0;
    let totalPiutangReceived = 0;

    allTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount);
      if (tx.type === "income" && tx.category === "Hutang")
        totalHutangReceived += amt;
      if (tx.type === "expense" && tx.category === "Cicilan / Hutang")
        totalHutangPaid += amt;
      if (tx.type === "expense" && tx.category === "Piutang")
        totalPiutangGiven += amt;
      if (tx.type === "income" && tx.category === "Piutang")
        totalPiutangReceived += amt;
    });

    setDebtSummary({
      remainingHutang: Math.max(0, totalHutangReceived - totalHutangPaid),
      remainingPiutang: Math.max(0, totalPiutangGiven - totalPiutangReceived),
    });

    // Sort by date old -> new for Chart
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    // Specific Account Filter for Summary & Charts
    // Removed hardcoded SUMMARY_ACCOUNTS to allow all accounts to show in dashboard
    // const SUMMARY_ACCOUNTS = ['BCA', 'BNI', 'BSI', 'Permata'];

    sortedTxs.forEach((tx) => {
      // Filter: Only include transactions from specific accounts
      // if (!SUMMARY_ACCOUNTS.includes(tx.account)) return;

      // EXCLUDE Internal Transfers from Income/Expense Totals
      if (
        tx.type === "transfer" ||
        tx.category === "Transfer" ||
        tx.category === "Transfer Antar Akun"
      )
        return;

      const amt = parseFloat(tx.amount);

      if (tx.type === "income") income += amt;
      else if (tx.type === "expense") expense += amt;

      const dateStr = new Date(tx.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      if (!dateMap[dateStr])
        dateMap[dateStr] = { name: dateStr, income: 0, expense: 0 };

      if (tx.type === "income") dateMap[dateStr].income += amt;
      else if (tx.type === "expense") dateMap[dateStr].expense += amt;

      if (tx.type === "expense") {
        // Map to Main Category
        const mainCategory = reverseCategoryMap[tx.category] || "Lainnya";
        if (!categoryMap[mainCategory]) categoryMap[mainCategory] = 0;
        categoryMap[mainCategory] += amt;
      }
    });

    // Set States
    setSummary({ income, expense, balance: income - expense });
    setChartData(Object.values(dateMap));

    const pieArray = Object.keys(categoryMap)
      .map((key) => ({
        name: key,
        value: categoryMap[key],
      }))
      .sort((a, b) => b.value - a.value);

    setAllPieData(pieArray); // Contains all MAIN categories (max 12)
    setPieData(pieArray.slice(0, 10)); // Top 10 Main Categories
    setBarDataMain(pieArray); // Same data for Main Category Bar Chart

    // Create Sub-Category Data
    const subCategoryMap = {};
    transactions.forEach((tx) => {
      // EXCLUDE Internal Transfers from Income/Expense Totals
      if (
        tx.type === "transfer" ||
        tx.category === "Transfer" ||
        tx.category === "Transfer Antar Akun"
      )
        return;

      if (tx.type === "expense") {
        const subCat = tx.category || "Lainnya";
        if (!subCategoryMap[subCat]) subCategoryMap[subCat] = 0;
        subCategoryMap[subCat] += parseFloat(tx.amount);
      }
    });

    const barSubArray = Object.keys(subCategoryMap)
      .map((key) => ({
        name: key,
        value: subCategoryMap[key],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 Sub-Categories

    setBarDataSub(barSubArray);

    // Create Account Expense Data (Pengeluaran per Akun)
    const accountExpenseMap = {};
    transactions.forEach((tx) => {
      // EXCLUDE Internal Transfers from Income/Expense Totals
      if (
        tx.type === "transfer" ||
        tx.category === "Transfer" ||
        tx.category === "Transfer Antar Akun"
      )
        return;

      if (tx.type === "expense") {
        const acc = tx.account || "Misc";
        if (!accountExpenseMap[acc]) accountExpenseMap[acc] = 0;
        accountExpenseMap[acc] += parseFloat(tx.amount);
      }
    });

    const barAccountArray = Object.keys(accountExpenseMap)
      .map((key) => ({
        name: key,
        value: accountExpenseMap[key],
      }))
      .sort((a, b) => b.value - a.value);

    setBarDataAccount(barAccountArray);

    setRecentTransactions(
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Colors for Donut Chart
  const COLORS = [
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#EC4899",
    "#6366F1",
    "#14B8A6",
    "#F97316",
    "#06B6D4",
    "#84CC16",
    "#A855F7",
    "#E11D48",
    "#38BDF8",
    "#FBBF24",
  ];

  const renderActiveShapeSimple = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      name,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={4}
          textAnchor={textAnchor}
          fill="#fff"
          className="text-xs font-bold"
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full max-w-[1600px] pt-0 px-0 md:px-6 pb-4 md:pb-6 space-y-4 animate-fade-in font-inter">
      <BentoGrid>
        {/* 1. Stat Card: Income */}
        <BentoCard className="col-span-1 bg-white dark:bg-slate-900 rounded-3xl !p-6 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
            Total Pemasukan
          </p>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">
            {formatCurrency(summary.income)}
          </h3>
          <div className="text-[10px] text-slate-400 mt-1">
            Keuangan masuk periode ini
          </div>
        </BentoCard>

        {/* 2. Stat Card: Expense */}
        <BentoCard className="col-span-1 bg-white dark:bg-slate-900 rounded-3xl !p-6 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
            Total Pengeluaran
          </p>
          <h3 className="text-2xl font-black text-rose-500 mt-2">
            {formatCurrency(summary.expense)}
          </h3>
          <div className="text-[10px] text-slate-400 mt-1">
            Keuangan keluar periode ini
          </div>
        </BentoCard>

        {/* 3. Stat Card: Balance */}
        <BentoCard className="col-span-1 bg-white dark:bg-slate-900 rounded-3xl !p-6 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
            Saldo Bersih
          </p>
          <h3
            className={`text-2xl font-black mt-2 ${summary.balance >= 0 ? "text-blue-500" : "text-rose-600"}`}
          >
            {formatCurrency(summary.balance)}
          </h3>
          <div className="text-[10px] text-slate-400 mt-1">
            Selisih masuk & keluar
          </div>
        </BentoCard>

        {/* 4. Debt Status / Account Summary Mini */}
        <BentoCard className="col-span-1 bg-white dark:bg-slate-900 rounded-3xl !p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          {debtSummary.remainingHutang > 0 ? (
            <>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={80} className="text-rose-500" />
              </div>
              <p className="text-rose-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} /> Hutang Belum Lunas
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 relative z-10">
                {formatCurrency(debtSummary.remainingHutang)}
              </h3>
              <button
                onClick={() => handleOpenDebtModal("hutang")}
                className="text-xs text-rose-500 underline mt-2 relative z-10 font-bold"
              >
                Lihat Detail
              </button>
            </>
          ) : debtSummary.remainingPiutang > 0 ? (
            <>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins size={80} className="text-emerald-500" />
              </div>
              <p className="text-emerald-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Coins size={16} /> Piutang Aktif
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 relative z-10">
                {formatCurrency(debtSummary.remainingPiutang)}
              </h3>
              <button
                onClick={() => handleOpenDebtModal("piutang")}
                className="text-xs text-emerald-500 underline mt-2 relative z-10 font-bold"
              >
                Lihat Detail
              </button>
            </>
          ) : (
            <>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Landmark size={80} className="text-blue-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <Landmark size={16} /> Total Akun
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 relative z-10">
                {accountSummaries.length} Akun Terdaftar
              </h3>
              <div className="text-[10px] text-slate-400 mt-1">
                Keuangan terpantau aman
              </div>
            </>
          )}
        </BentoCard>

        {/* 5. Main Trend Chart (Big) */}
        <BentoCard className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-slate-900 !p-0 border border-slate-800 overflow-hidden relative">
          <div className="p-6 relative z-10">
            <div className="flex flex-wrap justify-between items-end mb-4 gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Tren Keuangan
                </h3>
                <p className="text-slate-400 text-sm">
                  Alur Pemasukan vs Pengeluaran
                </p>
              </div>
              <div className="flex gap-4 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <span className="flex items-center text-xs font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                  Masuk
                </span>
                <span className="flex items-center text-xs font-medium text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                  Keluar
                </span>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIncome"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorExpense"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                          ? `${(value / 1000).toFixed(0)}K`
                          : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      color: "#f1f5f9",
                      borderRadius: "8px",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "#fff", fontSize: "13px" }}
                    labelStyle={{
                      color: "#cbd5e1",
                      marginBottom: "0.25rem",
                      fontSize: "12px",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#F43F5E"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none z-0"></div>
        </BentoCard>

        {/* 6. Accounts List (Scrollable) */}
        <BentoCard className="col-span-1 md:col-span-1 row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-0 overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Wallet className="text-blue-500" size={18} />
              Akun Saya
            </h3>
            <p className="text-slate-400 text-xs">Saldo real-time</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar">
            {accountSummaries.map((acc) => (
              <div
                key={acc.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                    {getAccountIcon(acc.name, acc.icon)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase leading-none mb-1">
                      {acc.name}
                    </p>
                    <p
                      className={`text-sm font-black leading-none ${acc.balance >= 0 ? "text-slate-800 dark:text-white" : "text-rose-500"}`}
                    >
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* 7. Top Expenses Pie */}
        <BentoCard className="col-span-1 md:col-span-1 row-span-2 bg-slate-900 border border-slate-800 !p-6 flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Top Pengeluaran
            </h3>
            <p className="text-slate-400 text-xs">Dominasi budget Anda</p>
          </div>
          <div className="h-[200px] w-full relative flex-1">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(0,0,0,0)"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Belum ada data
              </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-2">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  Total
                </span>
                <span className="text-white font-bold text-lg">
                  {pieData.length}
                </span>
              </div>
            )}
          </div>
        </BentoCard>

        {/* 8. Expenses by Main Category (Bar) */}
        <BentoCard className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 !p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              Kategori Utama
            </h3>
            <p className="text-slate-400 text-xs">
              Ranking pengeluaran berdasarkan grup
            </p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={barDataMain}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#334155"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#334155", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    color: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="value"
                  fill="#8B5CF6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  <LabelList dataKey="value" content={<CustomBarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* 9. Top Sub-Categories (Bar) */}
        <BentoCard className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 !p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              Sub-Kategori Teratas
            </h3>
            <p className="text-slate-400 text-xs">
              Detail spesifik pos pengeluaran
            </p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={barDataSub}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#334155"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#334155", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    color: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="value"
                  fill="#EC4899"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  <LabelList dataKey="value" content={<CustomBarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Render Debt Modal if needed (kept outside grid) */}
      {debtModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{debtModal.title}</h3>
              <button
                onClick={() => setDebtModal({ ...debtModal, show: false })}
                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {debtModal.data.length > 0 ? (
                debtModal.data.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        {tx.description || "Tanpa Keterangan"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <p className="font-bold text-finance-primary">
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">
                  Tidak ada data.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
