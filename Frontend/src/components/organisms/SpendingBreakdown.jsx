import React, { useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { PieChart, ArrowDownRight, Tag } from "lucide-react";

/**
 * SpendingBreakdown Component
 * Displays a Donut Chart of expenses and a detailed list of categories.
 * Styling inspired by Monarch Money (Clean, White, Elegant).
 */
export const SpendingBreakdown = ({ transactions, totalExpense }) => {
  const data = useMemo(() => {
    const expenseTx = transactions.filter((tx) => tx.type === "expense");
    const breakdown = expenseTx.reduce((acc, tx) => {
      const cat = tx.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = {
          id: cat,
          label: cat,
          value: 0,
          count: 0,
        };
      }
      acc[cat].value += parseFloat(tx.amount);
      acc[cat].count += 1;
      return acc;
    }, {});

    // Convert to array and sort by value (descending)
    return Object.values(breakdown).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Vibrant but professional color palette
  const colors = [
    "#f43f5e", // Rose 500
    "#3b82f6", // Blue 500
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
    "#06b6d4", // Cyan 500
    "#84cc16", // Lime 500
    "#6366f1", // Indigo 500
    "#d946ef", // Fuchsia 500
  ];

  /* Format Currency */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
        <PieChart size={48} className="mb-4 opacity-20" />
        <p className="font-medium">No expenses found for this period</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* LEFT: DONUT CHART */}
      <div className="w-full xl:w-5/12 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative min-h-[320px] md:min-h-[400px]">
        <h3 className="absolute top-6 left-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Spending Share
        </h3>
        <div className="h-[260px] md:h-[350px] w-full mt-6 md:mt-0">
          <ResponsivePie
            data={data}
            margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
            innerRadius={0.65} // Donut style
            padAngle={2}
            cornerRadius={5}
            activeOuterRadiusOffset={8}
            colors={colors}
            borderWidth={0}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor={
              window.document.documentElement.classList.contains("dark")
                ? "#cbd5e1"
                : "#333333"
            }
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            enableArcLabels={false} // Clean look, no text inside slices
            tooltip={({ datum }) => (
              <div className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-3 py-2 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: datum.color }}
                />
                <span>
                  {datum.label}: {formatCurrency(datum.value)}
                </span>
              </div>
            )}
          />
        </div>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", {
              notation: "compact", // "1.2jt" style for space saving
              compactDisplay: "short",
              maximumFractionDigits: 1,
            }).format(totalExpense)}
          </p>
        </div>
      </div>

      {/* RIGHT: DETAILED LIST (Monarch Style) */}
      <div className="w-full xl:w-7/12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
            <Tag size={16} className="text-rose-500" />
            Category Breakdown
          </h3>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {data.length} Categories
          </span>
        </div>

        <div className="overflow-y-auto max-h-[500px] p-2">
          <table className="w-full">
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.map((item, idx) => {
                const percentage = ((item.value / totalExpense) * 100).toFixed(
                  1,
                );
                const color = colors[idx % colors.length];

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default"
                  >
                    <td className="py-4 px-4 w-12">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm"
                        style={{ backgroundColor: `${color}15`, color: color }} // 15% opacity bg
                      >
                        {/* Fallback Icon or Initials */}
                        {item.label.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                        {item.count} transactions
                      </p>
                    </td>
                    <td className="py-4 px-2 w-10 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400">
                        <ArrowDownRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
