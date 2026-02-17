import React from "react";
import { Label } from "../atoms/Label";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

export const FormField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  options,
  children,
  component = "input",
  icon,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <Label className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </Label>
      )}

      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-finance-primary transition-colors duration-300">
            {icon}
          </div>
        )}

        {component === "select" ? (
          <Select
            name={name}
            value={value}
            onChange={onChange}
            error={error}
            className={`${icon ? "pl-11" : ""} rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all font-medium`}
            {...props}
          >
            {children ||
              options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </Select>
        ) : component === "textarea" ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full ${icon ? "pl-11" : "px-4"} py-3 border rounded-2xl focus:ring-4 focus:ring-finance-primary/10 focus:border-finance-primary outline-none transition-all duration-300 ${error ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"}`}
            {...props}
          />
        ) : (
          <Input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            className={`${icon ? "pl-11" : ""} rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all font-medium`}
            {...props}
          />
        )}
      </div>

      {error && (
        <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {error}
        </p>
      )}
    </div>
  );
};
