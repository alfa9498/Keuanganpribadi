import React from "react";

export const Input = ({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  className = "",
  error,
  ...props
}) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-finance-primary focus:border-finance-primary outline-none transition ${error ? "border-red-500 bg-red-50 dark:bg-rose-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"} ${className}`}
      {...props}
    />
  );
};
