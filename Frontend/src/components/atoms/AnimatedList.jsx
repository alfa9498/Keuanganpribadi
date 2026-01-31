import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AnimatedList = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  className,
  renderItem, // Optional custom renderer
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Handle Arrow Navigation
  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && selectedIndex !== -1) {
        onItemSelect?.(items[selectedIndex], selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableArrowNavigation, items, selectedIndex, onItemSelect]);

  // Scroll into view when selectedIndex changes
  useEffect(() => {
    if (selectedIndex !== -1 && containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={cn("relative h-full flex flex-col group/list", className)}>
      {/* Top Gradient */}
      {showGradients && (
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/list:opacity-100 transition-opacity duration-500" />
      )}

      {/* List Container */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 pt-2 space-y-3",
          displayScrollbar ? "custom-scrollbar" : "scrollbar-hide",
        )}
      >
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id || item.name || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: selectedIndex === index ? 1.02 : 1,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "cursor-pointer rounded-2xl transition-all duration-200",
                selectedIndex === index
                  ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
              onClick={() => {
                setSelectedIndex(index);
                onItemSelect?.(item, index);
              }}
            >
              {renderItem ? (
                renderItem(item, index)
              ) : (
                <div className="p-3">
                  {typeof item === "string"
                    ? item
                    : item.name || "Unnamed Item"}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Gradient */}
      {showGradients && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/list:opacity-100 transition-opacity duration-500" />
      )}
    </div>
  );
};

export default AnimatedList;
