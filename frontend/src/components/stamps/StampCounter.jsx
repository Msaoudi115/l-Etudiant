import React from "react";
import { motion } from "framer-motion";

export default function StampCounter({
  doneCount,
  totalSchools,
  pct,
  scorePulse,
  classRank,
  stampsToNext,
  nextBadge,
}) {
  return (
    <>
      {/* Live score banner */}
      <div
        style={{
          padding: "10px 16px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}
        data-testid="live-score-banner"
      >
        <motion.div
          animate={scorePulse ? { scale: [1, 1.18, 1] } : {}}
          transition={{ duration: 0.55 }}
          style={{
            background: "var(--red)", color: "white", width: 36, height: 36,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, flexShrink: 0,
          }}
        >
          {doneCount}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Tampons collectés
          </div>
          <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>
            {doneCount === 0
              ? "Scanne ton 1er stand pour démarrer !"
              : doneCount < 3
                ? `Plus que ${3 - doneCount} pour débloquer ton récap`
                : "🔥 Récap personnalisé disponible"}
          </div>
        </div>
        {classRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: classRank <= 3 ? "var(--red)" : "#f3f4f6",
              color: classRank <= 3 ? "white" : "#555",
              borderRadius: 99, padding: "3px 8px", fontSize: 11, fontWeight: 800,
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            #{classRank} 🏫
          </motion.div>
        )}
      </div>

      {/* Next badge progress */}
      {stampsToNext && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "7px 16px", background: "#fafaf8", borderBottom: "1px solid #f0f0f0",
            display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#666", fontWeight: 600,
          }}
        >
          <span>{nextBadge.icon}</span>
          <span>
            Plus que{" "}
            <strong style={{ color: "var(--ink)" }}>{stampsToNext} stand{stampsToNext > 1 ? "s" : ""}</strong>{" "}
            pour débloquer <strong style={{ color: "var(--ink)" }}>{nextBadge.label}</strong>
          </span>
        </motion.div>
      )}
    </>
  );
}
