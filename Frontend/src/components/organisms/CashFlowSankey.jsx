import React, { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { Wallet } from "lucide-react";

/**
 * CashFlowSankey Component
 * Visualizes the flow of money: Income -> Expenses -> Categories
 * Also shows Savings if Income > Expenses
 */
export const CashFlowSankey = ({ transactions }) => {
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

    // Helper to push node if unique
    const addNode = (id, color = "hsl(150, 70%, 50%)") => {
      if (!nodes.find((n) => n.id === id)) {
        nodes.push({ id, nodeColor: color });
      }
    };

    // --- NODE: INCOME SOURCES ---
    // If we want detailed income sources, we add them here.
    // For simplicity, let's Aggregate all Income into one "Total Income" node for the middle.
    // But to look like the reference, we might want: Income Source A -> Income Pool -> Expenses
    // Let's do: [Income Sources] -> [Budget/Pool] -> [Expenses Categories] + [Savings]

    const ROOT_NODE = "Budget"; // Central Hub

    // A. Left Side: Income Sources -> Budget
    Object.entries(incomeSources).forEach(([source, amount]) => {
      if (amount > 0) {
        addNode(source, "#10b981"); // Emerald-500
        links.push({
          source: source,
          target: ROOT_NODE,
          value: amount,
        });
      }
    });

    // B. Central Hub
    addNode(ROOT_NODE, "#3b82f6"); // Blue-500

    // C. Right Side: Budget -> Expenses Categories
    Object.entries(expenseByCategory).forEach(([category, amount]) => {
      if (amount > 0) {
        addNode(category, "#f43f5e"); // Rose-500
        links.push({
          source: ROOT_NODE,
          target: category,
          value: amount,
        });
      }
    });

    // D. Right Side: Budget -> Savings
    if (savings > 0) {
      addNode("Savings", "#22c55e"); // Green-500
      links.push({
        source: ROOT_NODE,
        target: "Savings",
        value: savings,
      });
    }

    // Filter out nodes with no links just in case
    // (Sankey crashes if links reference missing nodes)
    return { nodes, links };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
        <Wallet size={48} className="mb-4 opacity-20" />
        <p className="font-medium">No transactions to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
      <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider mb-6">
        Cash Flow Visualization
      </h3>
      <ResponsiveSankey
        data={data}
        margin={{ top: 20, right: 160, bottom: 40, left: 120 }} // Extra margins for labels
        align="justify"
        colors={(node) => node.nodeColor || node.color}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={6} // Rounded nodes like the reference
        linkOpacity={0.2}
        linkHoverOthersOpacity={0.1}
        linkContract={3} // Gap between link and node
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={16}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1]],
        }}
        // Custom Tooltip
        tooltip={({ node }) => (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
            {node.id}:{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(node.value)}
          </div>
        )}
        linkTooltip={({ link }) => (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
            {link.source.id} ➔ {link.target.id}:<br />
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
