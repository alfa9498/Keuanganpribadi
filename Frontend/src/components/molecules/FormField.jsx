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
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <Label>{label}</Label>}

      {component === "select" ? (
        <Select
          name={name}
          value={value}
          onChange={onChange}
          error={error}
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
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-finance-primary focus:border-finance-primary outline-none transition ${error ? "border-red-500 bg-red-50 dark:bg-rose-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"}`}
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
          {...props}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
