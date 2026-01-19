import React, { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { StatCard } from '../molecules/StatCard';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Sector, BarChart, Bar, LabelList
} from 'recharts';

import { TimeFilter } from '../molecules/TimeFilter';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Calendar, Wallet, Landmark, Coins, TrendingUp, CreditCard, X } from 'lucide-react';

const ACCOUNTS = ['Cash Account', 'BCA', 'BNI', 'BSI', 'Muamalat', 'Permata', 'Mandiri', 'Gopay', 'OVO', 'Dana', 'Bareksa', 'Treasury', 'Tabungan BNI Anak'];
const DASHBOARD_ACCOUNTS = ['BSI', 'BCA', 'BNI', 'Permata', 'Tabungan BNI Anak'];

const expenseCategories = {
    "Makanan": ["Makanan", "Makan & Minum", "Sarapan", "Jajan Harian"],
    "Transportasi": ["Transportasi", "Transport Harian", "Bensin", "Parkir", "Ojol / Taksi Online", "pengeluaran Pulang"],
    "Tagihan": ["Tagihan", "Listrik", "Internet", "Pulsa", "Air", "Tagihan Internet", "Biaya Admin"],
    "Belanja": ["Belanja", "Belanja Bulanan", "Shopping", "shopee", "Laundry", "Marketplace (Shopee, dll)"],
    "Hiburan": ["Hiburan", "Nongkrong", "Jalan-jalan"],
    "Kesehatan": ["Kesehatan", "Berobat", "Obat", "BPJS / Asuransi"],
    "Pendidikan": ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
    "Orang Tua": ["Orang Tua", "Orang tua aa", "Orang tua neng", "Listrik Orang Tua", "Pulsa Orang Tua"],
    "Hadiah": ["Hadiah", "Hadiah / Acara", "Acara", "Ulang Tahun", "Nikahan"],
    "Keuangan": ["Keuangan", "Tabungan", "Investasi", "Hutang", "Piutang", "Tarik Tunai", "Cicilan / Hutang", "Tabungan anak", "Tabung Kita"],
    "Sewa": ["Sewa", "mobil", "motor", "kontrakan", "kosan"],
    "Lainnya": ["Lainnya"]
};

const getAccountIcon = (name) => {
    if (['BCA', 'Mandiri', 'Permata', 'BNI', 'BSI', 'Muamalat'].includes(name)) return <Landmark size={14} className="text-blue-500" />;
    if (['Gopay', 'OVO', 'Dana'].includes(name)) return <Wallet size={14} className="text-indigo-500" />;
    if (['Bareksa', 'Treasury'].includes(name)) return <TrendingUp size={14} className="text-emerald-500" />;
    return <Coins size={14} className="text-amber-500" />;
};

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, name } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

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
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff" className="text-xs font-bold">
                {name}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#94a3b8" className="text-[10px]">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
                <tspan fill="#64748b" className="ml-1"> ({(percent * 100).toFixed(1)}%)</tspan>
            </text>
        </g>
    );
};

const CustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    const formattedValue = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

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

export const DashboardOrganism = ({ user, onLogout, filterRange, setFilterRange, filterCategory, setFilterCategory, filterAccount, setFilterAccount }) => {
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [allPieData, setAllPieData] = useState([]); // Data for "All Categories" chart
    const [barDataMain, setBarDataMain] = useState([]); // Horizontal Bar: Main Category
    const [barDataSub, setBarDataSub] = useState([]); // Horizontal Bar: Sub Category
    const [barDataAccount, setBarDataAccount] = useState([]); // Horizontal Bar: Account (Expenses)
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]); // Store all raw data
    const [debtSummary, setDebtSummary] = useState({ remainingHutang: 0, remainingPiutang: 0 });
    const [accountSummaries, setAccountSummaries] = useState([]);
    const [debtModal, setDebtModal] = useState({ show: false, type: '', title: '', data: [] });
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndexAll, setActiveIndexAll] = useState(0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const onPieEnterAll = (_, index) => {
        setActiveIndexAll(index);
    };

    const handleOpenDebtModal = (type) => {
        const title = type === 'hutang' ? 'Daftar Hutang Saya' : 'Daftar Piutang (Uang di Orang)';
        const relevantData = allTransactions.filter(tx => {
            if (type === 'hutang') {
                return (tx.type === 'income' && tx.category === 'Hutang') || (tx.type === 'expense' && tx.category === 'Cicilan / Hutang');
            } else {
                return (tx.type === 'expense' && tx.category === 'Piutang') || (tx.type === 'income' && tx.category === 'Piutang');
            }
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        setDebtModal({ show: true, type, title, data: relevantData });
    };

    useEffect(() => {
        if (user?.id) fetchTransactions();
    }, [user]);

    useEffect(() => {
        if (allTransactions.length > 0) {
            const filtered = applyFilter(allTransactions, filterRange, filterCategory, filterAccount);
            processData(filtered);
        }
    }, [filterRange, filterCategory, filterAccount, allTransactions]);

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/transaction?user_id=${user.id}`, {
                credentials: 'include'
            });
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
            filtered = filtered.filter(tx => {
                if (tx.category === category) return true;
                if (expenseCategories[category]) {
                    return expenseCategories[category].includes(tx.category);
                }
                return false;
            });
        }

        // 1.5 Filter by Account if selected
        if (account) {
            filtered = filtered.filter(tx => tx.account === account);
        }

        // 2. Filter by Time Range
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(3000, 0, 1); // Default to future if not strict window

        // Reset time to start of day for accurate comparison
        now.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        // Handle Custom Month Range OR Custom Date Range
        if (range.startsWith('MONTH_')) {
            const [_, year, month] = range.split('_');
            startDate = new Date(year, month, 1);
            endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);

            return filtered.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= startDate && txDate <= endDate;
            });
        }

        // Handle Custom Range (RANGE_START_END)
        if (range.startsWith('RANGE_')) {
            const [_, start, end] = range.split('_');
            startDate = new Date(start);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);

            return filtered.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= startDate && txDate <= endDate;
            });
        }

        switch (range) {
            case 'TODAY':
                // startDate is already today 00:00
                break;
            case '7D':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'THIS_WEEK':
                // Assuming week starts on Monday (1)
                const day = now.getDay() || 7; // Sunday is 0, make it 7
                if (day !== 1) startDate.setHours(-24 * (day - 1));
                break;
            case '30D':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'MONTH':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'ALL':
                return filtered;
            default:
                break;
        }

        return filtered.filter(tx => new Date(tx.date) >= startDate);
    };

    const processData = (transactions) => {
        let income = 0;
        let expense = 0;
        const dateMap = {};
        const categoryMap = {}; // Will now store aggregation by Main Category

        // Helper to map any sub-category to its Main Category
        const reverseCategoryMap = {};
        Object.keys(expenseCategories).forEach(mainCat => {
            expenseCategories[mainCat].forEach(subCat => {
                reverseCategoryMap[subCat] = mainCat;
            });
        });

        // Account balance logic using ALL TRANSACTIONS for true balance (ignoring time filter for balance)
        const accMap = ACCOUNTS.reduce((acc, name) => {
            acc[name] = { name, income: 0, expense: 0, balance: 0, transfers_in: 0, transfers_out: 0 };
            return acc;
        }, {});

        allTransactions.forEach(tx => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'income' && accMap[tx.account]) {
                accMap[tx.account].income += amt;
            } else if (tx.type === 'expense' && accMap[tx.account]) {
                accMap[tx.account].expense += amt;
            } else if (tx.type === 'transfer') {
                if (accMap[tx.account]) accMap[tx.account].transfers_out += amt;
                if (accMap[tx.to_account]) accMap[tx.to_account].transfers_in += amt;
            }
        });

        const accList = Object.values(accMap).map(acc => ({
            ...acc,
            balance: (acc.income + acc.transfers_in) - (acc.expense + acc.transfers_out)
        })).filter(acc => DASHBOARD_ACCOUNTS.includes(acc.name))
            .filter(acc => filterAccount ? acc.name === filterAccount : true); // Filter logic
        setAccountSummaries(accList);

        // Hutang & Piutang Logic (Always based on ALL transactions for current status)
        let totalHutangReceived = 0;
        let totalHutangPaid = 0;
        let totalPiutangGiven = 0;
        let totalPiutangReceived = 0;

        allTransactions.forEach(tx => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'income' && tx.category === 'Hutang') totalHutangReceived += amt;
            if (tx.type === 'expense' && tx.category === 'Cicilan / Hutang') totalHutangPaid += amt;
            if (tx.type === 'expense' && tx.category === 'Piutang') totalPiutangGiven += amt;
            if (tx.type === 'income' && tx.category === 'Piutang') totalPiutangReceived += amt;
        });

        setDebtSummary({
            remainingHutang: Math.max(0, totalHutangReceived - totalHutangPaid),
            remainingPiutang: Math.max(0, totalPiutangGiven - totalPiutangReceived)
        });

        // Sort by date old -> new for Chart
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Specific Account Filter for Summary & Charts
        // Removed hardcoded SUMMARY_ACCOUNTS to allow all accounts to show in dashboard
        // const SUMMARY_ACCOUNTS = ['BCA', 'BNI', 'BSI', 'Permata'];

        sortedTxs.forEach(tx => {
            // Filter: Only include transactions from specific accounts
            // if (!SUMMARY_ACCOUNTS.includes(tx.account)) return;

            // EXCLUDE Internal Transfers from Income/Expense Totals
            if (tx.type === 'transfer' || tx.category === 'Transfer' || tx.category === 'Transfer Antar Akun') return;

            const amt = parseFloat(tx.amount);

            if (tx.type === 'income') income += amt;
            else if (tx.type === 'expense') expense += amt;

            const dateStr = new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if (!dateMap[dateStr]) dateMap[dateStr] = { name: dateStr, income: 0, expense: 0 };

            if (tx.type === 'income') dateMap[dateStr].income += amt;
            else if (tx.type === 'expense') dateMap[dateStr].expense += amt;

            if (tx.type === 'expense') {
                // Map to Main Category
                const mainCategory = reverseCategoryMap[tx.category] || 'Lainnya';
                if (!categoryMap[mainCategory]) categoryMap[mainCategory] = 0;
                categoryMap[mainCategory] += amt;
            }
        });

        // Set States
        setSummary({ income, expense, balance: income - expense });
        setChartData(Object.values(dateMap));

        const pieArray = Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key]
        })).sort((a, b) => b.value - a.value);

        setAllPieData(pieArray); // Contains all MAIN categories (max 12)
        setPieData(pieArray.slice(0, 10)); // Top 10 Main Categories
        setBarDataMain(pieArray); // Same data for Main Category Bar Chart

        // Create Sub-Category Data
        const subCategoryMap = {};
        transactions.forEach(tx => {
            // EXCLUDE Internal Transfers from Income/Expense Totals
            if (tx.type === 'transfer' || tx.category === 'Transfer' || tx.category === 'Transfer Antar Akun') return;

            if (tx.type === 'expense') {
                const subCat = tx.category || 'Lainnya';
                if (!subCategoryMap[subCat]) subCategoryMap[subCat] = 0;
                subCategoryMap[subCat] += parseFloat(tx.amount);
            }
        });

        const barSubArray = Object.keys(subCategoryMap).map(key => ({
            name: key,
            value: subCategoryMap[key]
        })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 Sub-Categories

        setBarDataSub(barSubArray);

        // Create Account Expense Data (Pengeluaran per Akun)
        const accountExpenseMap = {};
        transactions.forEach(tx => {
            // EXCLUDE Internal Transfers from Income/Expense Totals
            if (tx.type === 'transfer' || tx.category === 'Transfer' || tx.category === 'Transfer Antar Akun') return;

            if (tx.type === 'expense') {
                const acc = tx.account || 'Misc';
                if (!accountExpenseMap[acc]) accountExpenseMap[acc] = 0;
                accountExpenseMap[acc] += parseFloat(tx.amount);
            }
        });

        const barAccountArray = Object.keys(accountExpenseMap).map(key => ({
            name: key,
            value: accountExpenseMap[key]
        })).sort((a, b) => b.value - a.value);

        setBarDataAccount(barAccountArray);

        setRecentTransactions([...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    // Colors for Donut Chart
    const COLORS = [
        '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6',
        '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
        '#84CC16', '#A855F7', '#E11D48', '#38BDF8', '#FBBF24'
    ];

    const renderActiveShapeSimple = (props) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, name } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

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
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={4} textAnchor={textAnchor} fill="#fff" className="text-xs font-bold">
                    {name}
                </text>
            </g>
        );
    };

    return (
        <div className="w-full max-w-[1600px] pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6 space-y-4 md:space-y-5 animate-fade-in font-inter">
            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <StatCard title="Total Pemasukan" amount={formatCurrency(summary.income)} type="success" />
                <StatCard title="Total Pengeluaran" amount={formatCurrency(summary.expense)} type="danger" />
                <StatCard title="Saldo Bersih" amount={formatCurrency(summary.balance)} type="accent" />
            </div>

            {/* Debt & Receivable Monitoring Monitor */}
            {(debtSummary.remainingHutang > 0 || debtSummary.remainingPiutang > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {debtSummary.remainingHutang > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} className="rotate-180" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hutang Saya (Belum Lunas)</p>
                                    <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(debtSummary.remainingHutang)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="bg-rose-50 px-3 py-1 rounded-full text-[10px] font-extrabold text-rose-600 border border-rose-100">
                                    PERLU DIBAYAR
                                </div>
                                <button
                                    onClick={() => handleOpenDebtModal('hutang')}
                                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline underline-offset-2"
                                >
                                    Lihat Detail
                                </button>
                            </div>
                        </div>
                    )}
                    {debtSummary.remainingPiutang > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <Coins size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Piutang (Uang di Orang)</p>
                                    <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(debtSummary.remainingPiutang)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-extrabold text-emerald-600 border border-emerald-100">
                                    BELUM KEMBALI
                                </div>
                                <button
                                    onClick={() => handleOpenDebtModal('piutang')}
                                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 underline underline-offset-2"
                                >
                                    Lihat Detail
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Account Overview Row */}
            {accountSummaries.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <CreditCard size={16} className="text-finance-primary" />
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Saldo Akun</span>
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        {accountSummaries.map((acc) => (
                            <div key={acc.name} className="flex-shrink-0 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-finance-primary/30 transition-all cursor-default min-w-[140px]">
                                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-finance-primary/10 transition-colors">
                                    {getAccountIcon(acc.name)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{acc.name}</p>
                                    <p className={`text-[13px] font-black leading-none ${acc.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                        {formatCurrency(acc.balance)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="flex flex-col gap-6">

                {/* Top Row: Trend Chart (Area) - Full Width */}
                <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
                    {/* Background Glow Effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex flex-wrap justify-between items-end mb-6 gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Tren Keuangan</h3>
                            <p className="text-slate-400 text-sm">Alur Pemasukan vs Pengeluaran</p>
                        </div>
                        <div className="flex gap-4 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                            <span className="flex items-center text-xs font-medium text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>Masuk</span>
                            <span className="flex items-center text-xs font-medium text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>Keluar</span>
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                    tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#fff', fontSize: '13px' }}
                                    labelStyle={{ color: '#cbd5e1', marginBottom: '0.25rem', fontSize: '12px' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#F43F5E"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Row: Two Pie Charts Side-by-Side */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 1. Top 10 Expenses */}
                    <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-1">Pengeluaran Terbesar (Top 10)</h3>
                        <p className="text-slate-400 text-sm mb-6">10 Kategori dengan pengeluaran tertinggi</p>

                        <div className="h-[400px] w-full relative">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            fill="#8884d8"
                                            dataKey="value"
                                            onMouseEnter={onPieEnter}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                                    Belum ada data pengeluaran
                                </div>
                            )}
                            {/* Center Text */}
                            {pieData.length > 0 && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                    <span className="text-xs text-slate-500 block uppercase tracking-wider">Top 10</span>
                                    <span className="text-white font-bold text-lg">{pieData.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. All Categories with List (Restored) */}
                    <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col col-span-1 lg:col-span-2 xl:col-span-1">
                        <div className="flex flex-col gap-6 h-full">
                            {/* Chart Section */}
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-lg font-semibold text-white mb-1">Semua Kategori</h3>
                                <p className="text-slate-400 text-sm mb-4">Distribusi seluruh kategori</p>

                                <div className="h-[400px] w-full relative">
                                    {allPieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    activeIndex={activeIndexAll}
                                                    activeShape={renderActiveShapeSimple}
                                                    data={allPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    onMouseEnter={onPieEnterAll}
                                                >
                                                    {allPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                                            Belum ada data pengeluaran
                                        </div>
                                    )}
                                    {/* Center Text */}
                                    {allPieData.length > 0 && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                            <span className="text-xs text-slate-500 block uppercase tracking-wider">Total</span>
                                            <span className="text-white font-bold text-lg">{allPieData.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Legend Section - Landscape 2 Rows (approx) */}
                            <div className="mt-2 border-t border-slate-500/30 pt-1">
                                <h4 className="text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">Kategori</h4>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-1 gap-y-0.5">
                                    {allPieData.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-1 p-[1px] rounded hover:bg-slate-800/30 transition-colors cursor-default">
                                            <div className="w-1 h-1 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)] shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-slate-400 text-[8px] font-medium truncate leading-none" title={entry.name}>{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Horizontal Bar Charts Row */}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 1. Expenses by Main Category (Bar) */}
                    <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-1">Pengeluaran per Kategori Utama</h3>
                        <p className="text-slate-400 text-sm mb-6">Analisis kategori utama</p>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={barDataMain}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                                        <LabelList dataKey="value" content={<CustomBarLabel />} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Top Expenses by Sub-Category (Bar) */}
                    <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-1">Top 10 Sub-Kategori</h3>
                        <p className="text-slate-400 text-sm mb-6">Detail pengeluaran spesifik</p>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={barDataSub}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="value" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={20}>
                                        <LabelList dataKey="value" content={<CustomBarLabel />} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Expenses by Account (Bar) */}
                    <div className="bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col xl:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-1">Pengeluaran per Akun</h3>
                        <p className="text-slate-400 text-sm mb-6">Sumber dana pengeluaran</p>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={barDataAccount}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20}>
                                        <LabelList dataKey="value" content={<CustomBarLabel />} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>




            {/* Debt Details Modal */}
            {debtModal.show && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-inter"
                    onClick={() => setDebtModal({ ...debtModal, show: false })}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {debtModal.type === 'hutang' ? <TrendingUp size={20} className="text-rose-500 rotate-180" /> : <Coins size={20} className="text-emerald-500" />}
                                {debtModal.title}
                            </h3>
                            <button
                                onClick={() => setDebtModal({ ...debtModal, show: false })}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-3">
                                {debtModal.data.length > 0 ? (
                                    debtModal.data.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {tx.type === 'income' ? 'IN' : 'OUT'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{tx.description || tx.category}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {tx.account}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`font-bold tabular-nums text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 italic">Tidak ada transaksi ditemukan.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Sisa</span>
                            <span className={`text-lg font-black ${debtModal.type === 'hutang' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(
                                    debtModal.data.reduce((acc, tx) => {
                                        const amt = parseFloat(tx.amount);
                                        if (debtModal.type === 'hutang') {
                                            return tx.type === 'income' ? acc + amt : acc - amt;
                                        } else {
                                            return tx.type === 'expense' ? acc + amt : acc - amt;
                                        }
                                    }, 0)
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
