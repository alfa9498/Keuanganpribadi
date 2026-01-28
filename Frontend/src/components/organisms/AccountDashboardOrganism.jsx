import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, ArrowRightLeft, TrendingUp, TrendingDown, CreditCard, Landmark, Coins } from 'lucide-react';
import { StatCard } from '../molecules/StatCard';
import { API_URL } from '../../config/api';


export const AccountDashboardOrganism = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const ACCOUNTS = ['Cash Account', 'BCA', 'BNI', 'BSI', 'Muamalat', 'Permata', 'Mandiri', 'Gopay', 'OVO', 'Dana', 'Bareksa', 'Treasury', 'Tabungan BNI Anak'];

    useEffect(() => {
        if (user?.id) fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/transaction?user_id=${user.id}`, {
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok) {
                setTransactions(result.data);
            }
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    const accountSummaries = useMemo(() => {
        const summaries = ACCOUNTS.reduce((acc, name) => {
            acc[name] = { name, income: 0, expense: 0, balance: 0, transfers_in: 0, transfers_out: 0 };
            return acc;
        }, {});

        transactions.forEach(tx => {
            const amt = parseFloat(tx.amount);

            if (tx.type === 'income' && summaries[tx.account]) {
                summaries[tx.account].income += amt;
            } else if (tx.type === 'expense' && summaries[tx.account]) {
                summaries[tx.account].expense += amt;
            } else if (tx.type === 'transfer') {
                if (summaries[tx.account]) summaries[tx.account].transfers_out += amt;
                if (summaries[tx.to_account]) summaries[tx.to_account].transfers_in += amt;
            }
        });

        // Calculate final balance for each account
        Object.values(summaries).forEach(acc => {
            acc.balance = (acc.income + acc.transfers_in) - (acc.expense + acc.transfers_out);
        });

        return Object.values(summaries);
    }, [transactions]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const getAccountIcon = (name) => {
        if (['BCA', 'Mandiri', 'Permata', 'BNI', 'BSI', 'Muamalat', 'Tabungan BNI Anak'].includes(name)) return <Landmark className="text-blue-500" />;
        if (['Gopay', 'OVO', 'Dana'].includes(name)) return <Wallet className="text-indigo-500" />;
        if (['Bareksa', 'Treasury'].includes(name)) return <TrendingUp className="text-emerald-500" />;
        return <Coins className="text-amber-500" />;
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading account data...</div>;

    return (
        <div className="w-full max-w-[1600px] p-4 md:p-6 space-y-8 animate-fade-in font-inter">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <CreditCard className="text-finance-primary" />
                        Accounts & Balances
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your funds across different accounts</p>
                </div>
            </div>

            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {accountSummaries.map((acc) => (
                    <div key={acc.name} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                                {getAccountIcon(acc.name)}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                {acc.name} Account
                            </span>
                        </div>

                        <h3 className="text-sm font-medium text-slate-500 mb-1">Total Balance</h3>
                        <p className={`text-2xl font-black mb-6 ${acc.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                            {formatCurrency(acc.balance)}
                        </p>

                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500" /> Income</span>
                                <span className="font-bold text-emerald-600">+{formatCurrency(acc.income + acc.transfers_in)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5"><TrendingDown size={14} className="text-rose-500" /> Expense</span>
                                <span className="font-bold text-rose-600">-{formatCurrency(acc.expense + acc.transfers_out)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Transfers Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-3">
                        <ArrowRightLeft className="text-blue-500" size={20} />
                        Recent Transfers
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase font-black text-slate-400 bg-slate-50/50">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">From Account</th>
                                <th className="px-6 py-4 text-center"></th>
                                <th className="px-6 py-4">To Account</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.filter(tx => tx.type === 'transfer').slice(0, 10).map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-[13px] text-slate-600">
                                        {new Date(tx.date).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-700">{tx.account}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <ArrowRightLeft size={16} className="inline text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-700">{tx.to_account}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-blue-600">{formatCurrency(tx.amount)}</span>
                                    </td>
                                </tr>
                            ))}
                            {transactions.filter(tx => tx.type === 'transfer').length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                        No transfers recorded yet
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
