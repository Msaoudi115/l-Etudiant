import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StampCard({ school, stamp, slamId, activeHall, halls, onClick }) {
  const visited = !!stamp;
  const hallInfo = halls.find((h) => h.id === school.hall_id);

  return (
    <motion.div
      className={`si ${visited ? "v" : ""}`}
      onClick={() => onClick(school)}
      whileTap={{ scale: 0.98 }}
      data-testid={`stamp-row-${school.id}`}
    >
      <div
        className="sc"
        style={!visited && activeHall === -1 ? { background: hallInfo?.color, color: "white" } : {}}
      >
        {visited ? "✓" : school.initials.substring(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sn">{school.name}</div>
        <div className="st">{school.type}</div>
      </div>
      {visited && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
          <div className="stm">{stamp.time_label}</div>
          {stamp.rating && (
            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 1 }}>
              {"★".repeat(stamp.rating)}{"☆".repeat(5 - stamp.rating)}
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {slamId === school.id ? (
          <motion.div
            className="stamp-slam"
            initial={{ opacity: 0, scale: 1.8, rotate: -24 }}
            animate={{ opacity: 1, scale: 1, rotate: -14 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="slam-mark">Visité</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
