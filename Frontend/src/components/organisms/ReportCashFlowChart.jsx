import React, { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";

export const ReportCashFlowChart = ({ transactions }) => {
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Group by Date (YYYY-MM-DD) or Month (YYYY-MM) depending on range?
    // For simplicity, let's auto-detect. If > 60 days, group by Month.
    // Assuming transactions are already filtered by range.

    const dates = transactions.map((t) => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    const isMonthly = diffDays > 60; // Group by Month if > 2 months

    const groups = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const key = isMonthly
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!acc[key]) {
        acc[key] = { date: key, income: 0, expense: 0 };
      }

      const amt = parseFloat(tx.amount);
      if (tx.type === "income") acc[key].income += amt;
      if (tx.type === "expense") acc[key].expense += amt;

      return acc;
    }, {});

    // Fill missing dates/months? (Optional, maybe skip for now to keep it simple)
    // Sorting
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No data for chart
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveBar
        data={data}
        keys={["income", "expense"]}
        indexBy="date"
        margin={{ top: 20, right: 10, bottom: 50, left: 50 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={({ id }) => (id === "income" ? "#10b981" : "#f43f5e")} // Emerald-500 & Rose-500
        borderRadius={4}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: (v) => {
            if (data.length > 10 && !v.endsWith("01") && !v.endsWith("15"))
              return ""; // Show fewer ticks if many bars
            const d = new Date(v);
            return data.length > 60
              ? d.toLocaleDateString("id-ID", { month: "short" })
              : d.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
          },
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: formatCurrency,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff"
        role="application"
        ariaLabel="Cash Flow Bar Chart"
        barAriaLabel={(e) => `${e.id}: ${e.formattedValue} on ${e.indexValue}`}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: window.document.documentElement.classList.contains(
                  "dark",
                )
                  ? "#1e293b"
                  : "#e2e8f0",
              },
            },
            ticks: { text: { fill: "#64748b", fontSize: 10 } },
          },
          grid: {
            line: {
              stroke: window.document.documentElement.classList.contains("dark")
                ? "#1e293b"
                : "#f1f5f9",
            },
          },
          tooltip: {
            container: {
              background: window.document.documentElement.classList.contains(
                "dark",
              )
                ? "#1e293b"
                : "#ffffff",
              color: window.document.documentElement.classList.contains("dark")
                ? "#cbd5e1"
                : "#334155",
              fontSize: 12,
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            },
          },
        }}
        enableLabel={false} // Clean look, use tooltip or axis
      />
    </div>
  );
};
