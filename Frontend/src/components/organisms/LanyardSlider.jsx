import React, { useRef, useEffect } from "react";
import { LanyardCard } from "../molecules/LanyardCard";

export const LanyardSlider = ({ items, className = "" }) => {
  const scrollRef = useRef(null);

  // Duplicating items for the "infinite" feel
  const duplicatedItems = [...items, ...items, ...items];

  useEffect(() => {
    if (scrollRef.current) {
      // Small delay to ensure layout is calculated
      setTimeout(() => {
        const middle = Math.floor(duplicatedItems.length / 3);
        const scrollItem = scrollRef.current.children[middle];
        if (scrollItem) {
          const scrollContainer = scrollRef.current;
          const centerPosition =
            scrollItem.offsetLeft -
            scrollContainer.offsetWidth / 2 +
            scrollItem.offsetWidth / 2;
          scrollContainer.scrollLeft = centerPosition;
        }
      }, 100);
    }
  }, [items]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth } = scrollRef.current;
    const segmentWidth = scrollWidth / 3;

    // Jump forward if scrolled into the first segment
    if (scrollLeft < 10) {
      scrollRef.current.scrollLeft = segmentWidth;
    }
    // Jump backward if scrolled into the third segment
    else if (scrollLeft > segmentWidth * 2) {
      scrollRef.current.scrollLeft = segmentWidth;
    }
  };

  return (
    <div
      className={`relative w-full py-4 ${className}`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      {/* Decorative overhead strap rail */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent z-0 mt-4" />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-6 scrollbar-hide px-1 py-8 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={`${item.type}-${index}`} className="snap-center">
            <LanyardCard
              title={item.title}
              value={item.value}
              type={item.type}
              details={item.details}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
