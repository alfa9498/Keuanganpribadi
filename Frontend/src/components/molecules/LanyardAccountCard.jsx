import React from "react";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";

export const LanyardAccountCard = ({
  account,
  formatCurrency,
  getAccountIcon,
  onEdit,
  onDelete,
  className = "",
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  // Spring physics for swinging effect
  const x = useSpring(0, { stiffness: 100, damping: 10 });
  const rotate = useTransform(x, [-50, 50], [-10, 10]);

  return (
    <div
      className={`relative flex flex-col items-center pt-8 min-w-[220px] select-none ${className}`}
    >
      {/* The Strap */}
      <div className="absolute top-0 w-[2px] h-10 bg-gradient-to-b from-slate-300 dark:from-slate-700 to-slate-400 dark:to-slate-600 rounded-full" />

      {/* The Connecting Clip */}
      <div className="absolute top-6 w-3 h-3 rounded-full border-[3px] border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 z-10" />

      {/* The Card */}
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ rotate, x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        whileHover={{ scale: 1.02, y: -5 }}
        className="w-64 h-80 rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Decorative Hole */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-800 rounded-full border border-slate-700" />

        {/* Card Content */}
        <div className="p-6 flex flex-col h-full">
          {/* Top Section: Icon & Actions */}
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
              {getAccountIcon(account.name, account.icon)}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <Pencil size={14} />
              </button>
              {!account.isUnregistered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(account);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Account Identity */}
          <div className="flex-1 space-y-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] truncate">
              {account.name}
            </h3>
            <p className="text-2xl font-black text-white tabular-nums truncate">
              {formatCurrency(account.balance)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                {account.type}
              </span>
              {account.isUnregistered && (
                <span className="text-[8px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Unregistered
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-500 flex items-center gap-1 font-black uppercase">
                <TrendingUp size={10} className="text-emerald-500" /> In
              </span>
              <span className="font-bold text-emerald-500 tabular-nums">
                +{formatCurrency(account.income + account.transfers_in)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-500 flex items-center gap-1 font-black uppercase">
                <TrendingDown size={10} className="text-rose-500" /> Out
              </span>
              <span className="font-bold text-rose-500 tabular-nums">
                -{formatCurrency(account.expense + account.transfers_out)}
              </span>
            </div>
          </div>
        </div>

        {/* Identification Texture Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};
