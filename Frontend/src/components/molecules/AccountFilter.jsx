import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';

export const AccountFilter = ({ currentAccount, onAccountChange }) => {
    const ACCOUNTS = [
        'Cash Account', 'BCA', 'BNI', 'BSI', 'Muamalat', 'Permata',
        'Mandiri', 'Gopay', 'OVO', 'Dana', 'Bareksa', 'Treasury',
        'Tabungan BNI Anak'
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
                <select
                    value={currentAccount || ''}
                    onChange={(e) => onAccountChange(e.target.value)}
                    className="appearance-none bg-white text-slate-700 text-sm font-bold py-2.5 pl-10 pr-10 rounded-2xl border border-slate-200 hover:border-finance-primary/50 focus:outline-none focus:ring-4 focus:ring-finance-primary/10 transition-all cursor-pointer min-w-[160px] shadow-sm hover:shadow-md"
                >
                    <option value="">Semua Akun</option>
                    {ACCOUNTS.map(acc => (
                        <option key={acc} value={acc} className="text-slate-700 font-medium">{acc}</option>
                    ))}
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-finance-primary transition-colors">
                    <Wallet size={16} />
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-500 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>
        </div>
    );
};
