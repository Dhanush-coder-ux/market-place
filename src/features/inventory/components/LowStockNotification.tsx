import { motion, AnimatePresence } from "framer-motion";
import { CircleFadingPlus, X } from "lucide-react";
import { LowStockNotificationProps } from "../types";

const LowStockNotification :React.FC<LowStockNotificationProps>= ({
  lowestStockValue = 0,
  show = false,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 max-w-sm bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-start gap-4"
        >
          <div className="bg-red-50 p-2 rounded-lg">
            <CircleFadingPlus className="text-red-600" size={20} />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-800">Inventory Alert</h4>
            <p className="text-xs text-slate-500 mt-1">
              {lowestStockValue} items in your{" "}
              <span className="font-semibold text-slate-700">
                Digital Store
              </span>{" "}
              are below the threshold.
            </p>
            <button className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition">
              Restock Now →
            </button>
          </div>

          <button
            className="text-slate-400 hover:text-slate-600 transition"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LowStockNotification;
