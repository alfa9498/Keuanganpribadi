import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { TrendingUp, Coins, Wallet, Landmark, CreditCard } from "lucide-react";

export const LanyardCard = ({
  title,
  value,
  type,
  icon: CustomIcon,
  className = "",
}) => {
  // Spring physics for swinging effect
  const x = useSpring(0, { stiffness: 100, damping: 10 });
  const rotate = useTransform(x, [-50, 50], [-15, 15]);

  const getTheme = () => {
    switch (type) {
      case "income":
        return {
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          icon: <TrendingUp className="text-emerald-500" size={24} />,
        };
      case "expense":
        return {
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
          icon: <CreditCard className="text-rose-500" size={24} />,
        };
      case "balance":
        return {
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          icon: <Wallet className="text-blue-500" size={24} />,
        };
      case "debt":
        return {
          color: "text-rose-600",
          bg: "bg-rose-600/10",
          border: "border-rose-600/20",
          icon: <Landmark className="text-rose-600" size={24} />,
        };
      case "receivable":
        return {
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          icon: <Coins className="text-amber-500" size={24} />,
        };
      default:
        return {
          color: "text-slate-500",
          bg: "bg-slate-500/10",
          border: "border-slate-500/20",
          icon: <Wallet className="text-slate-500" size={24} />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`relative flex flex-col items-center pt-10 min-w-[200px] select-none ${className}`}
    >
      {/* The Strap */}
      <div className="absolute top-0 w-[2px] h-12 bg-gradient-to-b from-slate-300 dark:from-slate-700 to-slate-400 dark:to-slate-600 rounded-full" />

      {/* The Connecting Clip */}
      <div className="absolute top-8 w-4 h-4 rounded-full border-4 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 z-10" />

      {/* The Card */}
      <motion.div
        style={{ rotate, x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        whileHover={{ scale: 1.05 }}
        className={`w-44 h-56 rounded-[2.5rem] bg-white dark:bg-slate-900 border ${theme.border} shadow-2xl flex flex-col items-center p-6 text-center justify-between cursor-grab active:cursor-grabbing overflow-hidden`}
      >
        {/* Decorative Hole */}
        <div className="absolute top-4 w-6 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700" />

        <div className={`mt-4 p-3 rounded-full ${theme.bg}`}>
          {CustomIcon ? (
            <CustomIcon className={theme.color} size={24} />
          ) : (
            theme.icon
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            {title}
          </p>
          <h3
            className={`text-xl font-black ${theme.color} break-words leading-tight px-2`}
          >
            {value}
          </h3>
        </div>

        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full bg-gradient-to-r from-transparent via-${theme.color.split("-")[1]}-500 to-transparent opacity-50`}
          />
        </div>

        {/* Identification Texture Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
      </motion.div>
    </div>
  );
};
