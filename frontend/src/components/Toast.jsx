import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, type = "ok", onClose, duration = 2400 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className={`toast ${type}`}
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          role="status"
          data-testid="toast"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
