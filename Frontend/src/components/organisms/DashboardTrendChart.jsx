import React, { useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";

export const DashboardTrendChart = ({ data, isMobile }) => {
  // Transform data for Nivo Line
  // data is array of { name: "Date", income: 100, expense: 50, ... }

  const lineData = useMemo(() => {
    const incomeSeries = {
      id: "Pemasukan",
      color: "#10b981", // Emerald 500
      data: data.map((d) => ({ x: d.name, y: d.income })),
    };
    const expenseSeries = {
      id: "Pengeluaran",
      color: "#f43f5e", // Rose 500
      data: data.map((d) => ({ x: d.name, y: d.expense })),
    };
    return [incomeSeries, expenseSeries];
  }, [data]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveLine
        data={lineData}
        margin={{ top: 20, right: 20, bottom: isMobile ? 60 : 50, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: 0,
          max: "auto",
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
        curve="monotoneX" // Smooth curves
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: isMobile ? -90 : -45, // Rotated further for mobile, and slight rotation for desktop
          legend: "",
          legendOffset: 36,
          legendPosition: "middle",
          // Show fewer tick values on mobile to avoid horizontal crowding
          tickValues: isMobile ? 5 : 10,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "",
          legendOffset: -40,
          legendPosition: "middle",
          format: formatCurrency,
          tickValues: isMobile ? 5 : undefined,
        }}
        enableGridX={false}
        enableGridY={true}
        colors={{ datum: "color" }}
        lineWidth={3}
        enablePoints={false} // Cleaner look like reference
        pointSize={8}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true} // Interactive hover
        enableArea={true} // Area fill under line
        areaOpacity={0.1}
        crosshairType="cross"
        legends={[]} // Custom legend is already in the UI header
        tooltip={({ point }) => (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: point.serieColor }}
              />
              <span>{point.serieId}</span>
            </div>
            <div className="text-base text-white">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(point.data.yFormatted)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {point.data.xFormatted}
            </div>
          </div>
        )}
        theme={{
          grid: {
            line: {
              stroke: "#334155",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            },
          },
          axis: {
            ticks: {
              text: {
                fill: "#94a3b8",
                fontSize: 10,
              },
            },
          },
        }}
      />
    </div>
  );
};
