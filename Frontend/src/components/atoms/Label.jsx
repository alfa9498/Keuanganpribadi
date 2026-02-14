import React from "react";

export const Label = ({ children, className = "", ...props }) => {
  return (
    <label
      className={`block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};
