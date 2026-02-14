import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Clock, RefreshCw } from "lucide-react";
import { Button } from "../atoms/Button";

export const TimeFilter = ({ currentRange, onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    { label: "Hari Ini", value: "TODAY" },
    { label: "Minggu Ini", value: "THIS_WEEK" },
    { label: "7 Hari Terakhir", value: "7D" },
    { label: "30 Hari Terakhir", value: "30D" },
    { label: "Bulan Ini", value: "MONTH" },
    { label: "3 Bulan Terakhir", value: "3M" },
    { label: "1 Tahun Terakhir", value: "1Y" },
    { label: "Semua Waktu", value: "ALL" },
  ];

  const getLabel = (val) => {
    if (val.startsWith("MONTH_")) {
      const [_, year, month] = val.split("_");
      const date = new Date(year, month);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    if (val.startsWith("RANGE_")) {
      const [_, start, end] = val.split("_");
      return `${new Date(start).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${new Date(end).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
    }
    const found = presets.find((p) => p.value === val);
    if (found) return found.label;
    return val;
  };

  // Generate Monthly History (Current Year back to 5 years ago)
  const monthlyHistory = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let year = currentYear; year >= currentYear - 5; year--) {
    // For current year, only show months up to now. For past years, show all 12 months.
    const maxMonth = year === currentYear ? currentMonth : 11;

    for (let month = 0; month <= maxMonth; month++) {
      const d = new Date(year, month, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const value = `MONTH_${year}_${month}`;
      monthlyHistory.push({ label, value });
    }
  }

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onRangeChange(`RANGE_${customStart}_${customEnd}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all w-full md:w-auto min-w-[140px] justify-between shadow-sm hover:shadow-md active:scale-95"
      >
        <div className="flex items-center gap-2">
          <Calendar
            size={16}
            className="text-finance-primary dark:text-blue-400"
          />
          <span>{getLabel(currentRange)}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-300 dark:text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-slate-300/50 dark:shadow-black/50 z-50 overflow-hidden animate-fade-in ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Pilih Periode
            </span>
            <Clock size={14} className="text-slate-300 dark:text-slate-600" />
          </div>

          {/* Presets Grid */}
          <div className="p-4">
            <p className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
              Preset Cepat
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    onRangeChange(preset.value);
                    setIsOpen(false);
                  }}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                    currentRange === preset.value
                      ? "bg-finance-primary dark:bg-blue-600 text-white shadow-lg shadow-finance-primary/20 dark:shadow-blue-900/30"
                      : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-50 dark:border-slate-800 my-4"></div>

            {/* Custom Date Range (Calendar) */}
            <div className="px-1">
              <p className="px-1 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
                Rentang Kustom
              </p>
              <div className="flex gap-3">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest ml-1">
                    Dari
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-finance-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest ml-1">
                    Hingga
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-finance-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Apply */}
          <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium">
              <RefreshCw size={12} className="animate-spin-slow" />
              <span>Auto-refresh enabled</span>
            </div>
            <button
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
              className={`px-5 py-2 rounded-xl font-black transition-all shadow-lg active:scale-95 ${
                customStart && customEnd
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-slate-900/20 dark:shadow-blue-900/30 hover:bg-black dark:hover:bg-blue-500"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
              }`}
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
