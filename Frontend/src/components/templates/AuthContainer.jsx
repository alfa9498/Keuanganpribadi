import { motion, AnimatePresence } from "framer-motion";
import { ElectricBorder } from "../atoms/ElectricBorder";
import { Particles } from "../atoms/Particles";

export const AuthContainer = ({ children, activeTab }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Particles */}
      <Particles quantity={150} staticity={30} ease={40} />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -z-5" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-5" />

      <div className="w-full max-w-md relative z-10 px-4 md:px-0">
        <ElectricBorder>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ y: 100, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -100, opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.5,
                }}
                className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col justify-center"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </ElectricBorder>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-slate-500 text-xs font-medium tracking-[0.3em] uppercase opacity-50">
          Powered by MyTodo Financial
        </p>
      </div>
    </div>
  );
};
