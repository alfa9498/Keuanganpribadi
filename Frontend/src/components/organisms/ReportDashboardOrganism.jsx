import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Tag, Filter, TrendingUp, TrendingDown, RefreshCw, FileText, Download, Wallet } from 'lucide-react';
import { TimeFilter } from '../molecules/TimeFilter';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { AccountFilter } from '../molecules/AccountFilter';
import { Badge } from '../atoms/Badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../../config/api';


export const ReportDashboardOrganism = ({ user }) => {
    const [allTransactions, setAllTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState('30D');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAccount, setFilterAccount] = useState('');

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
        if (!range || range === 'ALL') return data;

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        now.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        if (range.startsWith('RANGE_')) {
            const [_, start, end] = range.split('_');
            startDate = new Date(start);
            endDate = new Date(end);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return data.filter(tx => {
                const d = new Date(tx.date);
                return d >= startDate && d <= endDate;
            });
        }

        if (range.startsWith('MONTH_')) {
            const [_, year, month] = range.split('_');
            startDate = new Date(year, month, 1);
            endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);
            return data.filter(tx => {
                const d = new Date(tx.date);
                return d >= startDate && d <= endDate;
            });
        }

        switch (range) {
            case 'TODAY':
                break;
            case '7D':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30D':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'THIS_WEEK':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
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
            default:
                break;
        }
        return data.filter(tx => new Date(tx.date) >= startDate);
    };

    const filteredTransactions = useMemo(() => {
        let data = applyTimeFilter(allTransactions, filterRange);
        if (filterCategory) {
            data = data.filter(tx => {
                if (tx.category === filterCategory) return true;
                // If the selected category is a group, check if tx.category is inside it
                if (expenseCategories[filterCategory]) {
                    return expenseCategories[filterCategory].includes(tx.category);
                }
                return false;
            });
        }
        if (filterAccount) {
            data = data.filter(tx => tx.account === filterAccount || tx.to_account === filterAccount);
        }
        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [allTransactions, filterRange, filterCategory, filterAccount]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'income') acc.income += amt;
            else acc.expense += amt;
            acc.balance = acc.income - acc.expense;
            return acc;
        }, { income: 0, expense: 0, balance: 0 });
    }, [filteredTransactions]);

    const categoryBreakdown = useMemo(() => {
        const breakdown = filteredTransactions
            .filter(tx => tx.type === 'expense')
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
        const doc = new jsPDF();
        const dateNow = new Date().toLocaleDateString('id-ID');

        // Title & Header Information
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // Finance Primary Blue
        doc.text("FINANCIAL REPORT", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${dateNow}`, 14, 35);
        doc.text(`Profil Pengguna: ${user.fullName || user.email}`, 14, 40);

        let periodLabel = filterRange;
        if (filterRange === 'ALL') periodLabel = 'Semua Waktu';
        else if (filterRange === 'TODAY') periodLabel = 'Hari Ini';
        else if (filterRange === '7D') periodLabel = '7 Hari Terakhir';
        else if (filterRange === '30D') periodLabel = '30 Hari Terakhir';
        else if (filterRange === 'MONTH') periodLabel = 'Bulan Ini';
        else if (filterRange.startsWith('MONTH_')) {
            const [_, y, m] = filterRange.split('_');
            periodLabel = new Date(y, m).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        } else if (filterRange.startsWith('RANGE_')) {
            const [_, s, e] = filterRange.split('_');
            periodLabel = `${new Date(s).toLocaleDateString('id-ID')} - ${new Date(e).toLocaleDateString('id-ID')}`;
        }

        doc.text(`Periode: ${periodLabel}`, 14, 45);
        doc.text(`Akun: ${filterAccount || 'Semua Akun'}`, 14, 50);
        doc.text(`Kategori: ${filterCategory || 'Semua Kategori'}`, 14, 55);
        doc.text(`Total Records: ${filteredTransactions.length}`, 14, 60);

        // 1. Summary Section
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("Ringkasan Keuangan", 14, 85);

        autoTable(doc, {
            startY: 90,
            head: [['Deskripsi', 'Jumlah']],
            body: [
                ['Total Pemasukan', formatCurrency(summary.income)],
                ['Total Pengeluaran', formatCurrency(summary.expense)],
                ['Saldo Bersih', formatCurrency(summary.balance)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
            styles: { fontSize: 11, cellPadding: 5 }
        });


        // 2. Category Breakdown
        const finalYHeader = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text("Pengeluaran per Kategori", 14, finalYHeader);

        autoTable(doc, {
            startY: finalYHeader + 5,
            head: [['Kategori', 'Jumlah']],
            body: categoryBreakdown.map(item => [item.name, formatCurrency(item.value)]),
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11] }, // Amber for tags
            styles: { fontSize: 10 }
        });

        // 3. Ledger (Detailed List)
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text("Buku Kas / Ledger Transaksi (Detail)", 14, 20);

        autoTable(doc, {
            startY: 25,
            head: [['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Akun', 'Metode', 'Status']],
            body: filteredTransactions.map(tx => [
                new Date(tx.date).toLocaleDateString('id-ID'),
                tx.type === 'income' ? 'Masuk' : 'Keluar',
                tx.category,
                `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}`,
                tx.account,
                tx.payment_method,
                tx.status.toUpperCase()
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' } // Amount column
            }
        });

        // Footer on last page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Bottom blue bar
            doc.setFillColor(37, 99, 235);
            doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');

            doc.setFontSize(10);
            doc.setTextColor(255);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 6);
            doc.text(`© ${new Date().getFullYear()} MyTodo Financial Planner - Automated Financial Report`, 14, doc.internal.pageSize.height - 6);
        }

        doc.save(`Financial_Report_${user.fullName || 'User'}_${new Date().getTime()}.pdf`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
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
                    <h2 className="text-2xl font-bold text-slate-800">Financial Report</h2>
                    <p className="text-sm text-slate-500">View and download your financial statements</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
                    <div className="flex flex-wrap gap-2">
                        <AccountFilter currentAccount={filterAccount} onAccountChange={setFilterAccount} />
                        <CategoryFilter currentCategory={filterCategory} onCategoryChange={setFilterCategory} />
                        <TimeFilter currentRange={filterRange} onRangeChange={setFilterRange} />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchTransactions}
                            className="p-2 bg-white text-slate-400 hover:text-finance-primary rounded-lg border border-slate-200 transition-all hover:border-finance-primary"
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} />
                        </button>

                        {(filterCategory || filterAccount || filterRange !== 'ALL') && (
                            <button
                                onClick={() => {
                                    setFilterCategory('');
                                    setFilterAccount('');
                                    setFilterRange('ALL');
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Income</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(summary.income)}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                </div>
                {/* Expense */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
                        <p className="text-lg font-bold text-rose-600 mt-1">{formatCurrency(summary.expense)}</p>
                    </div>
                    <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                        <TrendingDown size={20} />
                    </div>
                </div>
                {/* Balance */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Balance</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(summary.balance)}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Wallet size={20} />
                    </div>
                </div>
            </div>

            {/* Transaction Ledger Table Only - Full Width */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        Transaction Ledger
                    </h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{filteredTransactions.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3">Account</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-700 whitespace-nowrap">
                                        {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {tx.type === 'income' ? 'IN' : 'OUT'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 text-xs">{tx.category}</span>
                                            {tx.description && <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">{tx.description}</span>}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-3 text-right font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 text-xs">{tx.account}</td>
                                    <td className="px-6 py-3 text-slate-500 text-[10px]">{tx.payment_method}</td>
                                    <td className="px-6 py-3 text-center">
                                        {tx.status === 'done' ? (
                                            <span className="text-[10px] font-bold text-slate-400">DONE</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">PENDING</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
