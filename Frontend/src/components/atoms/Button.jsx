import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: "bg-finance-primary text-white hover:bg-opacity-90 focus:ring-finance-primary",
        secondary: "bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
        ghost: "text-slate-500 hover:text-finance-primary hover:bg-slate-100"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
