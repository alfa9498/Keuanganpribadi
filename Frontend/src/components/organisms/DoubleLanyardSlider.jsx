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

  // For infinity scroll, we need a decent amount of items.
  // We duplicate if items are few, or just always triple for safety.
  // We need items to be even for a perfect 2-row distribution.
  const baseItems =
    accounts.length % 2 === 0
      ? accounts
      : [...accounts, { ...accounts[0], id: "filler", isFiller: true }];
  const duplicatedItems = [...baseItems, ...baseItems, ...baseItems];

  useEffect(() => {
    if (scrollRef.current && duplicatedItems.length > 0) {
      // Start at the middle segment
      setTimeout(() => {
        const scrollContainer = scrollRef.current;
        const segmentWidth = scrollContainer.scrollWidth / 3;
        scrollContainer.scrollLeft = segmentWidth;
      }, 100);
    }
  }, [accounts.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth } = scrollRef.current;
    const segmentWidth = scrollWidth / 3;

    if (scrollLeft < 10) {
      scrollRef.current.scrollLeft = segmentWidth;
    } else if (scrollLeft > segmentWidth * 2 - 10) {
      scrollRef.current.scrollLeft = segmentWidth;
    }
  };

  return (
    <div className={`relative w-full overflow-hidden py-6 ${className}`}>
      {/* Decorative overhead strap rails - two rows */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent z-0 mt-8 opacity-40" />
      <div className="absolute top-[45%] left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent z-0 mt-8 opacity-40" />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide px-4 md:px-[5%] py-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div
          className="grid grid-rows-2 grid-flow-col gap-x-8 md:gap-x-12 gap-y-6 md:gap-y-4"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(duplicatedItems.length / 2)}, min-content)`,
          }}
        >
          {duplicatedItems.map((acc, index) => (
            <div key={`${acc.id}-${index}`} className="snap-center">
              {acc.isFiller ? (
                <div className="w-64 h-80 opacity-0 pointer-events-none" />
              ) : (
                <LanyardAccountCard
                  account={acc}
                  formatCurrency={formatCurrency}
                  getAccountIcon={getAccountIcon}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  className="scale-[0.9] md:scale-100 origin-top"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fade Gradients for visual depth - Significantly reduced on mobile */}
      <div className="absolute top-0 bottom-0 left-0 w-8 md:w-48 bg-gradient-to-r from-slate-100 dark:from-slate-950/40 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 bottom-0 right-0 w-8 md:w-48 bg-gradient-to-l from-slate-100 dark:from-slate-950/40 to-transparent pointer-events-none z-10" />
    </div>
  );
};
