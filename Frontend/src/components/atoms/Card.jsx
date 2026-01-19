import React from 'react';

export const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-md border border-slate-100 ${className}`}>
            {children}
        </div>
    );
};
