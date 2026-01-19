import React from 'react';

export const Label = ({ children, className = '', ...props }) => {
    return (
        <label className={`block text-sm font-semibold text-slate-600 mb-1 ${className}`} {...props}>
            {children}
        </label>
    );
};
