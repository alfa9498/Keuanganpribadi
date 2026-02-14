import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export const BaseFilterDropdown = ({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = "Select Option",
  icon: Icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptionLabel =
    groups.length > 0
      ? groups.flatMap((g) => g.options).find((o) => o.value === value)?.label
      : options.find((o) => o.value === value)?.label;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-finance-primary/50 dark:hover:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-finance-primary/10 dark:focus:ring-blue-500/10 transition-all cursor-pointer w-full md:min-w-[170px] shadow-sm hover:shadow-md active:scale-95 justify-between"
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && (
            <Icon
              size={16}
              className={
                isOpen
                  ? "text-finance-primary dark:text-blue-500"
                  : "text-slate-400 dark:text-slate-500"
              }
            />
          )}
          <span className="truncate">{selectedOptionLabel || placeholder}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 dark:text-slate-500"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] mt-2 w-full min-w-[200px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl dark:shadow-black/50 overflow-hidden py-2"
          >
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {/* Default Option (Semua) */}
              <button
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!value ? "text-finance-primary dark:text-blue-500 font-bold bg-finance-primary/5 dark:bg-blue-500/10" : "text-slate-600 dark:text-slate-400 font-medium"}`}
              >
                <span>{placeholder}</span>
                {!value && <Check size={14} />}
              </button>

              {/* Grouped Options */}
              {groups.map((group, gIdx) => (
                <div key={gIdx} className="mt-2">
                  <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50">
                    {group.label}
                  </div>
                  {group.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${value === opt.value ? "text-finance-primary dark:text-blue-500 font-bold bg-finance-primary/5 dark:bg-blue-500/10" : "text-slate-600 dark:text-slate-400 font-medium"}`}
                    >
                      <span>{opt.label}</span>
                      {value === opt.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              ))}

              {/* Direct Options (if any) */}
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${value === opt.value ? "text-finance-primary dark:text-blue-500 font-bold bg-finance-primary/5 dark:bg-blue-500/10" : "text-slate-600 dark:text-slate-400 font-medium"}`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
