import React, { useMemo, useState, useEffect } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { Wallet } from "lucide-react";

/**
 * CashFlowSankey Component
 * Visualizes the flow of money: Income -> Expenses -> Categories
 * Also shows Savings if Income > Expenses
 */
export const CashFlowSankey = ({ transactions }) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const data = useMemo(() => {
    // 1. Calculate Totals
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};
    const incomeSources = {}; // Optional: breakdown income sources if needed

    transactions.forEach((tx) => {
      const amount = parseFloat(tx.amount);
      if (tx.type === "income") {
        totalIncome += amount;
        // Group income sources if we want detailed left side
        // For now, simplify to one "Income" node or "Main Income" vs "Other"
        const source = tx.category || "Other Income";
        incomeSources[source] = (incomeSources[source] || 0) + amount;
      } else {
        totalExpense += amount;
        const cat = tx.category || "Uncategorized";
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amount;
      }
    });

    const savings = totalIncome > totalExpense ? totalIncome - totalExpense : 0;

    // 2. Build Nodes & Links
    const nodes = [];
    const links = [];

    const ROOT_NODE_ID = "hub:budget";
    const ROOT_NODE_LABEL = "Budget";

    // Helper to push node if unique
    const addNode = (id, label, color = "hsl(150, 70%, 50%)") => {
      if (!nodes.find((n) => n.id === id)) {
        nodes.push({ id, label, nodeColor: color });
      }
    };

    // --- NODE: INCOME SOURCES ---
    Object.entries(incomeSources).forEach(([source, amount]) => {
      if (amount > 0) {
        const nodeId = `in:${source}`;
        addNode(nodeId, source, "#10b981"); // Emerald-500
        links.push({
          source: nodeId,
          target: ROOT_NODE_ID,
          value: amount,
        });
      }
    });

    // B. Central Hub
    addNode(ROOT_NODE_ID, ROOT_NODE_LABEL, "#3b82f6"); // Blue-500

    // C. Right Side: Budget -> Expenses Categories
    Object.entries(expenseByCategory).forEach(([category, amount]) => {
      if (amount > 0) {
        const nodeId = `out:${category}`;
        addNode(nodeId, category, "#f43f5e"); // Rose-500
        links.push({
          source: ROOT_NODE_ID,
          target: nodeId,
          value: amount,
        });
      }
    });

    // D. Right Side: Budget -> Savings
    if (savings > 0) {
      const savingsId = "hub:savings";
      addNode(savingsId, "Savings", "#22c55e"); // Green-500
      links.push({
        source: ROOT_NODE_ID,
        target: savingsId,
        value: savings,
      });
    }

    return { nodes, links };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
        <Wallet size={48} className="mb-4 opacity-20" />
        <p className="font-medium">No transactions to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-6 overflow-hidden">
      <h3 className="text-sm md:text-lg font-black text-slate-700 dark:text-white uppercase tracking-wider mb-6">
        Cash Flow Visualization
      </h3>
      <ResponsiveSankey
        data={data}
        margin={{
          top: 20,
          right: windowWidth < 768 ? 40 : 160,
          bottom: 40,
          left: windowWidth < 768 ? 40 : 120,
        }} // Responsive margins
        align="justify"
        colors={(node) => node.nodeColor || node.color}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={windowWidth < 768 ? 12 : 18}
        nodeSpacing={windowWidth < 768 ? 16 : 24}
        nodeBorderWidth={0}
        nodeBorderRadius={6}
        linkOpacity={0.2}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={windowWidth < 768 ? 8 : 16}
        labelTextColor={
          window.document.documentElement.classList.contains("dark")
            ? "#e2e8f0" // slate-200 for dark mode
            : "#334155" // slate-700 for light mode
        }
        // Smaller labels for mobile
        theme={{
          labels: {
            text: {
              fontSize: windowWidth < 768 ? 8 : 11,
              fontWeight: 600,
            },
          },
        }}
        // Custom Tooltip
        tooltip={({ node }) => (
          <div className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
            {node.label || node.id}:{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(node.value)}
          </div>
        )}
        linkTooltip={({ link }) => (
          <div className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
            {link.source.label || link.source.id} ➔{" "}
            {link.target.label || link.target.id}:<br />
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(link.value)}
          </div>
        )}
      />
    </div>
  );
};
