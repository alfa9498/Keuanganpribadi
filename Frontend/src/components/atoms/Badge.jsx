import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
    const variants = {
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm shadow-emerald-500/5",
        danger: "bg-rose-50 text-rose-700 border border-rose-100/50 shadow-sm shadow-rose-500/5",
        warning: "bg-amber-50 text-amber-700 border border-amber-100/50 shadow-sm shadow-amber-500/5",
        info: "bg-blue-50 text-blue-700 border border-blue-100/50 shadow-sm shadow-blue-500/5",
        neutral: "bg-slate-50 text-slate-600 border border-slate-100/50"
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant] || variants.neutral} ${className}`}>
            {children}
        </span>
    );
};
