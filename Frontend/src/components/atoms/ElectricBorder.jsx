import { motion } from "framer-motion";

export const ElectricBorder = ({ children, className = "" }) => {
  return (
    <div
      className={`relative p-[1px] overflow-hidden rounded-3xl ${className}`}
    >
      {/* The Animated Border */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            "conic-gradient(from 0deg at 50% 50%, #0EA5E9 0%, transparent 20%, transparent 80%, #0EA5E9 100%)",
            "conic-gradient(from 360deg at 50% 50%, #0EA5E9 0%, transparent 20%, transparent 80%, #0EA5E9 100%)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          width: "200%",
          height: "200%",
          left: "-50%",
          top: "-50%",
        }}
      />

      {/* Inner Content Container */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl rounded-[23px] overflow-hidden">
        {children}
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 blur-xl opacity-50">
        <motion.div
          className="w-full h-full bg-sky-500"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};
