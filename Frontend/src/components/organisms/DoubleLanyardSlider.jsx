import React, { useRef, useEffect } from "react";
import { LanyardAccountCard } from "../molecules/LanyardAccountCard";

export const DoubleLanyardSlider = ({
  accounts,
  formatCurrency,
  getAccountIcon,
  onEdit,
  onDelete,
  className = "",
}) => {
  const scrollRef = useRef(null);

  // Ensure even number of items for 2-row grid
  const displayItems =
    accounts.length % 2 === 0
      ? accounts
      : [...accounts, { ...accounts[0], id: "filler", isFiller: true }];

  // Grid layout parameters
  const CARD_HEIGHT = 380; // approximate height with gap
  const RAIL_OFFSET = 32; // where the rail sits relative to card top

  return (
    <div className={`relative w-full py-8 ${className}`}>
      {/* Background Rails for multiple rows - assuming max 10 rows for safety */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent opacity-40"
            style={{ top: `${i * CARD_HEIGHT + RAIL_OFFSET}px` }}
          />
        ))}
      </div>

      <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center gap-x-6 md:gap-x-8 gap-y-12 px-4 md:px-8 relative z-10 mx-auto max-w-[1248px] snap-x snap-proximity md:snap-none scrollbar-hide pb-8 md:pb-0">
        {accounts.map((acc, index) => (
          <div
            key={`${acc.id}-${index}`}
            className="flex justify-center flex-shrink-0 snap-center"
          >
            <LanyardAccountCard
              account={acc}
              formatCurrency={formatCurrency}
              getAccountIcon={getAccountIcon}
              onEdit={onEdit}
              onDelete={onDelete}
              className="origin-top hover:z-20 transition-all duration-300"
            />
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="text-slate-500 italic text-sm py-10 w-full text-center">
            No accounts to display.
          </div>
        )}
      </div>
    </div>
  );
};
