import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

export const InfiniteMarquee = ({
  children,
  speed = 40,
  pauseOnHover = true,
  direction = "left",
  className = "",
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(0);
  const controls = useAnimationControls();

  useEffect(() => {
    if (scrollerRef.current) {
      // Get half width because we duplicate content
      setContentWidth(scrollerRef.current.scrollWidth / 2);
    }
  }, [children]);

  useEffect(() => {
    if (contentWidth > 0) {
      const duration = contentWidth / speed;
      const xTarget = direction === "left" ? -contentWidth : contentWidth;
      const initialX = direction === "left" ? 0 : -contentWidth;

      controls.set({ x: initialX });
      controls.start({
        x: xTarget,
        transition: {
          duration: duration,
          ease: "linear",
          repeat: Infinity,
        },
      });
    }
  }, [contentWidth, speed, direction, controls]);

  const handleMouseEnter = () => {
    if (pauseOnHover) controls.stop();
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && contentWidth > 0) {
      // Resume
      const currentX =
        scrollerRef.current.style.transform.match(
          /translateX\((.*)px\)/,
        )?.[1] || 0;
      const xVal = parseFloat(currentX);
      const remainingDistance =
        direction === "left"
          ? Math.abs(-contentWidth - xVal)
          : Math.abs(0 - xVal);

      const duration = remainingDistance / speed;

      controls.start({
        x: direction === "left" ? -contentWidth : 0,
        transition: {
          duration: duration,
          ease: "linear",
          onComplete: () => {
            // Loop reset
            controls.set({ x: direction === "left" ? 0 : -contentWidth });
            controls.start({
              x: direction === "left" ? -contentWidth : 0,
              transition: {
                duration: contentWidth / speed,
                ease: "linear",
                repeat: Infinity,
              },
            });
          },
        },
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={scrollerRef}
        className="flex items-center gap-4 w-max whitespace-nowrap"
        animate={controls}
      >
        {/* Render children twice for infinite effect */}
        {children}
        {children}
      </motion.div>
    </div>
  );
};
