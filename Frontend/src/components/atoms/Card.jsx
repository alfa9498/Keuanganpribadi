import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 ${className}`}
    >
      {children}
    </div>
  );
};
