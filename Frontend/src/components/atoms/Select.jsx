import React from "react";

export const Select = ({
  name,
  value,
  onChange,
  children,
  className = "",
  error,
  ...props
}) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-finance-primary focus:border-finance-primary outline-none transition appearance-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${error ? "border-red-500 bg-red-50 dark:bg-rose-950/20" : "border-slate-300 dark:border-slate-700"} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
