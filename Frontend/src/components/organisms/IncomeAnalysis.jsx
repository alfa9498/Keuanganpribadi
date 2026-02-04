import React, { useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { PieChart, TrendingUp, Tag, ArrowDownRight } from "lucide-react";

/**
 * IncomeAnalysis Component
 * Displays detailed analysis of income streams:
 * 1. Trend (Bar Chart): Consistency of income over time.
 * 2. Sources (Donut + List): Breakdown of where money comes from.
 */
export const IncomeAnalysis = ({ transactions, totalIncome }) => {
  // 1. Prepare Data for Breakdown (Donut & List)
  const breakdownData = useMemo(() => {
    const incomeTx = transactions.filter((tx) => tx.type === "income");
    const groups = incomeTx.reduce((acc, tx) => {
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

    return Object.values(groups).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 2. Prepare Data for Trend (Bar Chart)
  const trendData = useMemo(() => {
    const incomeTx = transactions.filter((tx) => tx.type === "income");
    if (incomeTx.length === 0) return [];

    const dates = incomeTx.map((t) => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const isMonthly = diffDays > 60;

    // Group by Date or Month
    const groups = incomeTx.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const key = isMonthly
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!acc[key]) {
        acc[key] = { date: key, value: 0 };
      }
      acc[key].value += parseFloat(tx.amount);
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  // Palette: Emeralds, Teals, Limes (Money colors)
  const colors = [
    "#10b981", // Emerald 500
    "#34d399", // Emerald 400
    "#059669", // Emerald 600
    "#84cc16", // Lime 500
    "#06b6d4", // Cyan 500
    "#14b8a6", // Teal 500
    "#a3e635", // Lime 400
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const trendDateFormat = (v) => {
    const d = new Date(v);
    return trendData.length > 30 // Simplify axis if many bars
      ? d.toLocaleDateString("id-ID", { month: "short" })
      : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  if (breakdownData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p className="font-medium">No income data found for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION 1: INCOME TREND (Bar Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 z-10 relative">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <TrendingUp size={16} className="text-emerald-500" />
              Income Trend
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Consistency over time
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Income
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[250px] w-full">
          <ResponsiveBar
            data={trendData}
            keys={["value"]}
            indexBy="date"
            margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
            padding={0.4}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={["#10b981"]} // Emerald 500
            borderRadius={4}
            axisTop={null}
            axisRight={null}
            axisLeft={null} // Hide Left Axis for cleaner look (use tooltip)
            axisBottom={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: 0,
              format: trendDateFormat,
            }}
            enableLabel={false}
            tooltip={({ data }) => (
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
                {new Date(data.date).toLocaleDateString("id-ID", {
                  dateStyle: "medium",
                })}
                : {formatCurrency(data.value)}
              </div>
            )}
            theme={{
              grid: { line: { stroke: "#f1f5f9", strokeDasharray: "4 4" } },
              axis: {
                ticks: {
                  text: { fill: "#94a3b8", fontSize: 10, fontWeight: 600 },
                },
              },
            }}
          />
        </div>
      </div>

      {/* SECTION 2: BREAKDOWN (Donut + List) */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* DONUT CHART */}
        <div className="w-full xl:w-5/12 bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative min-h-[320px] md:min-h-[400px]">
          <h3 className="absolute top-6 left-6 text-sm font-black text-slate-400 uppercase tracking-widest">
            Income Sources
          </h3>
          <div className="h-[260px] md:h-[350px] w-full mt-6 md:mt-0">
            <ResponsivePie
              data={breakdownData}
              margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
              innerRadius={0.65}
              padAngle={2}
              cornerRadius={5}
              activeOuterRadiusOffset={8}
              colors={colors}
              borderWidth={0}
              enableArcLinkLabels={true}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              enableArcLabels={false}
              tooltip={({ datum }) => (
                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2">
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
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-800">
              {new Intl.NumberFormat("id-ID", {
                notation: "compact",
                compactDisplay: "short",
              }).format(totalIncome)}
            </p>
          </div>
        </div>

        {/* DETAILED LIST */}
        <div className="w-full xl:w-7/12 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Tag size={16} className="text-emerald-500" />
              Source Details
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {breakdownData.length} Sources
            </span>
          </div>

          <div className="overflow-y-auto max-h-[500px] p-2">
            <table className="w-full">
              <tbody className="divide-y divide-slate-50">
                {breakdownData.map((item, idx) => {
                  const percentage = ((item.value / totalIncome) * 100).toFixed(
                    1,
                  );
                  const color = colors[idx % colors.length];

                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50 transition-colors cursor-default"
                    >
                      <td className="py-4 px-4 w-12">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                          }}
                        >
                          {item.label.substring(0, 2).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <p className="font-bold text-slate-800 text-sm">
                          {item.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-black text-slate-800 text-sm">
                          {formatCurrency(item.value)}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {item.count} transactions
                        </p>
                      </td>
                      <td className="py-4 px-2 w-10 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
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
    </div>
  );
};
