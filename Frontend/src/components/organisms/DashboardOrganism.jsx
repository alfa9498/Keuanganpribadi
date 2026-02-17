import React, { useState, useEffect } from "react";
import { fetchCategories } from "../../services/categoryService";
import { normalizeCategory } from "../../utils/categoryUtils";
import { Button } from "../atoms/Button";
import { StatCard } from "../molecules/StatCard";
import { BentoGrid, BentoCard } from "../atoms/BentoGrid";
import { AnimatedList } from "../atoms/AnimatedList";

import { DashboardTrendChart } from "./DashboardTrendChart";
import { DashboardPieChart } from "./DashboardPieChart";

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
  HelpCircle,
  Tag,
} from "lucide-react";
import { API_URL } from "../../config/api";
import { LanyardSlider } from "../organisms/LanyardSlider";

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

// Hardcoded expenseCategories removed. Now using dynamic categories from DB.

// getAccountIcon removed from here and moved above as per previous chunk.

// Recharts helpers removed

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
  const [categoriesData, setCategoriesData] = useState({
    expense: [],
    income: [],
  });
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all raw data
  const [debtSummary, setDebtSummary] = useState({
    remainingHutang: 0,
    remainingPiutang: 0,
    hutangDetails: [],
    piutangDetails: [],
  });
  const [accountSummaries, setAccountSummaries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchAccounts();
      fetchCategoriesData();
    }
  }, [user]);

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
        const normalizedTxCat = normalizeCategory(tx.category);
        if (normalizedTxCat === category) return true;
        // Check if the selected category is a Group Name
        const group = categoriesData.expense.find((g) => g.name === category);
        if (group) {
          return group.subCategories.some(
            (sub) => normalizeCategory(sub.name) === normalizedTxCat,
          );
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
    categoriesData.expense.forEach((group) => {
      group.subCategories.forEach((subCat) => {
        reverseCategoryMap[normalizeCategory(subCat.name)] = group.name;
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
          name: tx.account + " (BELUM TERDAFTAR)",
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
              name: tx.to_account + " (BELUM TERDAFTAR)",
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
    const hutangMap = {};
    const piutangMap = {};
    let totalHutangReceived = 0;
    let totalHutangPaid = 0;
    let totalPiutangGiven = 0;
    let totalPiutangReceived = 0;

    allTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount);
      const desc = tx.description || tx.category || "Tanpa Keterangan";

      if (tx.type === "income" && tx.category === "Hutang") {
        totalHutangReceived += amt;
        hutangMap[desc] = (hutangMap[desc] || 0) + amt;
      }
      if (tx.type === "expense" && tx.category === "Cicilan / Hutang") {
        totalHutangPaid += amt;
        // Subtract from debt if description matches (simplistic but better than nothing)
        // Or we can just list current outstanding if we have a way to track "to whom"
        // For now, let's keep it simple: group income "Hutang" by desc, and subtract "Cicilan" by desc
        hutangMap[desc] = (hutangMap[desc] || 0) - amt;
      }
      if (tx.type === "expense" && tx.category === "Piutang") {
        totalPiutangGiven += amt;
        piutangMap[desc] = (piutangMap[desc] || 0) + amt;
      }
      if (tx.type === "income" && tx.category === "Piutang") {
        totalPiutangReceived += amt;
        piutangMap[desc] = (piutangMap[desc] || 0) - amt;
      }
    });

    const hutangDetails = Object.keys(hutangMap)
      .map((name) => ({ name, amount: hutangMap[name] }))
      .filter((d) => d.amount > 0);

    const piutangDetails = Object.keys(piutangMap)
      .map((name) => ({ name, amount: piutangMap[name] }))
      .filter((d) => d.amount > 0);

    setDebtSummary({
      remainingHutang: Math.max(0, totalHutangReceived - totalHutangPaid),
      remainingPiutang: Math.max(0, totalPiutangGiven - totalPiutangReceived),
      hutangDetails,
      piutangDetails,
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
        // Map to Main Category with normalization
        const normalizedCat = normalizeCategory(tx.category);
        const mainCategory = reverseCategoryMap[normalizedCat] || "Lainnya";
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
        const subCat = normalizeCategory(tx.category) || "Lainnya";
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
          fill="currentColor"
          className="text-xs font-bold fill-slate-700 dark:fill-white"
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full max-w-[1600px] p-4 md:p-6 space-y-4 animate-fade-in font-inter">
      {/* Lanyard Summary Slider */}
      {React.useMemo(
        () => (
          <LanyardSlider
            items={[
              {
                title: "Total Pemasukan",
                value: formatCurrency(summary.income),
                type: "income",
              },
              {
                title: "Total Pengeluaran",
                value: formatCurrency(summary.expense),
                type: "expense",
              },
              {
                title: "Saldo Bersih",
                value: formatCurrency(summary.balance),
                type: "balance",
              },
              {
                title:
                  debtSummary.remainingHutang > 0
                    ? "Hutang Belum Lunas"
                    : "Status Hutang",
                value:
                  debtSummary.remainingHutang > 0
                    ? formatCurrency(debtSummary.remainingHutang)
                    : "Lunas",
                type: "debt",
                details: debtSummary.hutangDetails,
              },
              {
                title: "Piutang Aktif",
                value: formatCurrency(debtSummary.remainingPiutang),
                type: "receivable",
                details: debtSummary.piutangDetails,
              },
            ].filter((item) => {
              if (
                item.type === "receivable" &&
                debtSummary.remainingPiutang <= 0
              )
                return false;
              return true;
            })}
          />
        ),
        [summary, debtSummary],
      )}

      <BentoGrid>
        {/* 5. Main Trend Chart (Big) */}
        <BentoCard className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-slate-100 dark:bg-slate-900 !p-0 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          <div className="p-6 relative z-10">
            <div className="flex flex-wrap justify-between items-end mb-4 gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Tren Keuangan
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Alur Pemasukan vs Pengeluaran
                </p>
              </div>
              <div className="flex gap-4 bg-white dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                  Masuk
                </span>
                <span className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                  Keluar
                </span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <DashboardTrendChart data={chartData} isMobile={isMobile} />
            </div>
          </div>
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none z-0"></div>
        </BentoCard>

        {/* 6. Accounts List (Scrollable) */}
        <BentoCard className="col-span-1 md:col-span-1 row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-0 overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="text-blue-500" size={18} />
                Akun Saya
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <Landmark size={10} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  {accountSummaries.length} Akun
                </span>
              </div>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Saldo real-time</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatedList
              items={accountSummaries}
              onItemSelect={(acc) => console.log("Selected account:", acc)}
              showGradients
              enableArrowNavigation
              displayScrollbar
              className="h-[400px]"
              renderItem={(acc) => (
                <div className="flex items-center justify-between p-3">
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
              )}
            />
          </div>
        </BentoCard>

        {/* 7. Top Expenses Pie */}
        <BentoCard className="col-span-1 md:col-span-1 row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-6 flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
              Top Pengeluaran
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Dominasi budget Anda
            </p>
          </div>
          <div className="h-[200px] w-full relative flex-1">
            <DashboardPieChart data={pieData} colors={COLORS} />
          </div>
        </BentoCard>

        {/* 8. Expenses by Main Category (Bar) */}
        <BentoCard className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
              Kategori Utama
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Ranking pengeluaran berdasarkan grup
            </p>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {barDataMain.slice(0, 5).map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {item.name}
                  </span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-colors hover:opacity-80"
                    style={{
                      width: `${(item.value / (summary.expense || 1)) * 100}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
            {barDataMain.length === 0 && (
              <p className="text-slate-500 text-xs">
                Belum ada data pengeluaran.
              </p>
            )}
          </div>
        </BentoCard>

        {/* 9. Top Sub-Categories (Bar) */}
        <BentoCard className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
              Sub-Kategori Teratas
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Detail spesifik pos pengeluaran
            </p>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {barDataSub.slice(0, 5).map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {item.name}
                  </span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-colors hover:opacity-80"
                    style={{
                      width: `${(item.value / (summary.expense || 1)) * 100}%`,
                      backgroundColor: COLORS[(idx + 2) % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
            {barDataSub.length === 0 && (
              <p className="text-slate-500 text-xs">
                Belum ada data pengeluaran.
              </p>
            )}
          </div>
        </BentoCard>
        {/* 10. Recent Transactions List */}
        <BentoCard className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 !p-0 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="text-emerald-500" size={18} />
              Transaksi Terbaru
            </h3>
            <p className="text-slate-400 text-xs">5 aktifitas terakhir</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatedList
              items={recentTransactions}
              onItemSelect={(tx) => console.log("Selected transaction:", tx)}
              showGradients
              enableArrowNavigation
              displayScrollbar
              className="h-[320px]"
              renderItem={(tx) => (
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-xl ${tx.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                    >
                      {tx.type === "income" ? (
                        <TrendingUp size={20} />
                      ) : (
                        <CreditCard size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {tx.description || tx.category}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {" • "}
                        {tx.account}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {tx.category}
                    </p>
                  </div>
                </div>
              )}
            />
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
