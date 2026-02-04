import React from "react";
import { ResponsivePie } from "@nivo/pie";

export const DashboardPieChart = ({ data, colors }) => {
  // Data is array of { name, value }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
        No data
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const defaultColors = [
    "#f43f5e", // Rose
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
  ];

  const chartColors = colors || defaultColors;

  return (
    <div className="h-full w-full relative">
      <ResponsivePie
        data={data}
        id="name"
        value="value"
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.7} // Donut
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
        colors={chartColors}
        borderWidth={0}
        enableArcLinkLabels={false} // Clean, no lines
        enableArcLabels={false} // Clean, no text inside
        tooltip={({ datum }) => (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2 z-50">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: datum.color }}
            />
            <span>
              {datum.id}: {formatCurrency(datum.value)}
            </span>
          </div>
        )}
      />
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Total
        </p>
        <p className="text-sm font-black text-white">
          {new Intl.NumberFormat("id-ID", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
          }).format(total)}
        </p>
      </div>
    </div>
  );
};
