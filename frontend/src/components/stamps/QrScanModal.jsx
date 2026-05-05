import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function QrScanModal({
  ratingModal,
  onRate,
  onClose,
  showRecapCelebration,
  onDismissCelebration,
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* Rating modal (shown after scanning a stand) */}
      <AnimatePresence>
        {ratingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 55,
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              borderRadius: "inherit",
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{
                background: "white", borderRadius: "20px 20px 0 0",
                padding: "24px 20px 36px", width: "100%", textAlign: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>⭐</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", marginBottom: 4 }}>
                {ratingModal.school?.name}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
                Tu as aimé cette école ?<br />Ta note personalise tes recommandations.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRate(ratingModal.stamp.id, star)}
                    style={{ fontSize: 34, background: "none", border: "none", cursor: "pointer", padding: "4px 2px", lineHeight: 1 }}
                    data-testid={`rate-star-${star}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >
                Passer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recap unlock celebration (shown after reaching 3 stamps) */}
      <AnimatePresence>
        {showRecapCelebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "inherit" }}
            onClick={onDismissCelebration}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ background: "white", borderRadius: 20, padding: "28px 24px", textAlign: "center", margin: "0 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>Récap débloqué !</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.5 }}>
                Tu as visité 3 stands. Découvre tes recommandations personnalisées et tes badges !
              </div>
              <button
                style={{ background: "var(--red)", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%", marginBottom: 8 }}
                onClick={() => { onDismissCelebration(); navigate("/passport/recap"); }}
              >
                Voir mon récap →
              </button>
              <button
                style={{ background: "transparent", color: "#888", border: "none", fontSize: 12, cursor: "pointer", padding: "4px" }}
                onClick={onDismissCelebration}
              >
                Continuer à explorer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
