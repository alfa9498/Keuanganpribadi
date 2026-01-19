import React from 'react';

export const Select = ({ name, value, onChange, children, className = '', error, ...props }) => {
    return (
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-finance-primary focus:border-finance-primary outline-none transition appearance-none bg-white ${error ? 'border-red-500 bg-red-50' : 'border-slate-300'} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};
