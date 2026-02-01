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

  // Dynamic Theme based on Account Name/Type
  const getDynamicColor = () => {
    const name = account.name.toUpperCase();
    if (name.includes("BCA")) return "blue";
    if (name.includes("MANDIRI")) return "amber";
    if (name.includes("BNI") || name.includes("BRI")) return "orange";
    if (name.includes("DANA")) return "blue";
    if (name.includes("OVO")) return "purple";
    if (name.includes("GOPAY")) return "emerald";
    if (name.includes("CASH")) return "slate";

    // Type fallback
    const type = account.type.toLowerCase();
    if (type === "bank") return "sky";
    if (type === "e-wallet") return "indigo";
    if (type === "investment") return "rose";
    return "slate";
  };

  const colorKey = getDynamicColor();
  const themeMap = {
    blue: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      accent: "bg-blue-500",
      glow: "shadow-blue-500/50",
      gradient: "from-blue-600/20",
    },
    amber: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      accent: "bg-amber-500",
      glow: "shadow-amber-500/50",
      gradient: "from-amber-600/20",
    },
    orange: {
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      accent: "bg-orange-500",
      glow: "shadow-orange-500/50",
      gradient: "from-orange-600/20",
    },
    purple: {
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      accent: "bg-purple-500",
      glow: "shadow-purple-500/50",
      gradient: "from-purple-600/20",
    },
    emerald: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      accent: "bg-emerald-500",
      glow: "shadow-emerald-500/50",
      gradient: "from-emerald-600/20",
    },
    rose: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      accent: "bg-rose-500",
      glow: "shadow-rose-500/50",
      gradient: "from-rose-600/20",
    },
    indigo: {
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      accent: "bg-indigo-500",
      glow: "shadow-indigo-500/50",
      gradient: "from-indigo-600/20",
    },
    sky: {
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      accent: "bg-sky-500",
      glow: "shadow-sky-500/50",
      gradient: "from-sky-600/20",
    },
    slate: {
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      accent: "bg-slate-500",
      glow: "shadow-slate-500/50",
      gradient: "from-slate-600/20",
    },
  };

  const theme = themeMap[colorKey];
  const isZero = parseFloat(account.balance) === 0;

  return (
    <div
      className={`relative flex flex-col items-center pt-8 min-w-[220px] select-none ${className} ${isZero ? "opacity-70 grayscale-[0.2]" : ""}`}
    >
      {/* The Strap */}
      <div className="absolute top-0 w-[2.5px] h-10 bg-gradient-to-b from-slate-400 dark:from-slate-600 to-slate-500 dark:to-slate-700 rounded-full shadow-sm z-0" />

      {/* The Connecting Clip */}
      <div className="absolute top-6 w-3.5 h-3.5 rounded-full border-[3.5px] border-slate-500 bg-white dark:bg-slate-900 z-10 shadow-md" />

      {/* The Card */}
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ rotate, x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        whileHover={{ scale: 1.03, y: -5 }}
        className={`w-64 h-80 rounded-[2.5rem] bg-slate-900 border ${theme.border} shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative cursor-grab active:cursor-grabbing`}
      >
        {/* Top Border Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${theme.accent} opacity-50`}
        />

        {/* Decorative Hole */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-800 rounded-full border border-slate-700 shadow-inner" />

        {/* Card Content */}
        <div className="p-6 pt-8 flex flex-col h-full z-10">
          {/* Top Section: Icon & Actions */}
          <div className="flex justify-between items-start mb-6">
            <div
              className={`p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg ${theme.glow} flex items-center justify-center`}
            >
              {getAccountIcon(account.name, account.icon)}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-md"
              >
                <Pencil size={14} />
              </button>
              {!account.isUnregistered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(account);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all backdrop-blur-md"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Account Identity */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
              {account.name}
            </h3>
            <div className="relative group">
              <p
                className={`text-[26px] font-black text-white tabular-nums leading-tight tracking-tight ${isZero ? "opacity-60" : ""}`}
              >
                {formatCurrency(account.balance)}
              </p>
              {isZero && (
                <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-widest block mt-0.5">
                  Belum ada transaksi
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[9px] ${theme.color} font-black uppercase tracking-widest bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5`}
              >
                {account.type}
              </span>
              {account.isUnregistered && (
                <span className="text-[8px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Unregistered
                </span>
              )}
            </div>
          </div>

          {/* Compact Stats Section */}
          <div className="mt-4 pt-4 border-t border-white/5 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                    In
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 tabular-nums">
                    {formatCurrency(account.income + account.transfers_in)
                      .replace("Rp", "")
                      .trim()}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                    Out
                  </span>
                  <span className="text-[10px] font-black text-rose-400 tabular-nums">
                    {formatCurrency(account.expense + account.transfers_out)
                      .replace("Rp", "")
                      .trim()}
                  </span>
                </div>
              </div>

              {/* Progress indicator for IN/OUT ratio */}
              <div className="flex-1 max-w-[60px] ml-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/50"
                  style={{
                    width: `${Math.min(100, ((account.income + account.transfers_in) / Math.max(1, account.income + account.transfers_in + account.expense + account.transfers_out)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} to-transparent opacity-30 pointer-events-none`}
        />

        {/* Identification Texture Background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Shine effect */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};
