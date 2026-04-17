import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePassport } from "@/context/PassportContext";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

export default function CoverPage() {
  const navigate = useNavigate();
  const { student, loading } = usePassport();

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const displayName =
    student.name && student.name !== "—"
      ? student.name.toUpperCase()
      : "—";

  return (
    <div className="pe-shell">
      <div className="device">
        <motion.div
          className="scroll-body"
          style={{ background: "var(--navy)", transformOrigin: "left center", perspective: 1600 }}
          initial={{ rotateY: -100, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.85, ease: [0.2, 0.8, 0.25, 1] }}
        >
          <div className="cover-wrap">
            <div className="cover-sec">
              <svg viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gpatt" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
                    <rect x="8" y="8" width="20" height="26" rx="2" fill="none" stroke="white" strokeWidth="1" />
                    <line x1="12" y1="14" x2="24" y2="14" stroke="white" strokeWidth="0.8" />
                    <line x1="12" y1="19" x2="24" y2="19" stroke="white" strokeWidth="0.8" />
                    <line x1="12" y1="24" x2="20" y2="24" stroke="white" strokeWidth="0.8" />
                    <g transform="translate(40 9) rotate(20)">
                      <rect x="0" y="0" width="20" height="5" rx="1.2" fill="none" stroke="white" strokeWidth="1" />
                      <path d="M20 0 L25 2.5 L20 5 Z" fill="none" stroke="white" strokeWidth="1" />
                    </g>
                    <g transform="translate(10 47)">
                      <rect x="0" y="0" width="28" height="8" rx="1.5" fill="none" stroke="white" strokeWidth="1" />
                      <line x1="5" y1="1" x2="5" y2="7" stroke="white" strokeWidth="0.8" />
                      <line x1="9" y1="1" x2="9" y2="5" stroke="white" strokeWidth="0.8" />
                      <line x1="13" y1="1" x2="13" y2="7" stroke="white" strokeWidth="0.8" />
                      <line x1="17" y1="1" x2="17" y2="5" stroke="white" strokeWidth="0.8" />
                      <line x1="21" y1="1" x2="21" y2="7" stroke="white" strokeWidth="0.8" />
                    </g>
                    <path d="M55 51 L56.8 54.8 L61 55.2 L58 58 L58.7 62.2 L55 60.2 L51.3 62.2 L52 58 L49 55.2 L53.2 54.8 Z" fill="none" stroke="white" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="390" height="844" fill="url(#gpatt)" />
              </svg>
            </div>

            <div className="cover-top">
              <div className="cover-rf">PasseportEtudiant</div>
            </div>

            <div className="cover-body">
              <motion.div
                className="emblem"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 140, damping: 12 }}
              >
                <svg width="46" height="46" viewBox="0 0 42 42" fill="none">
                  <circle cx="21" cy="21" r="17" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" />
                  <path d="M21 7v28M7 21h28" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
                  <path d="M10.5 10.5L31.5 31.5M31.5 10.5L10.5 31.5" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
                  <circle cx="21" cy="21" r="7" stroke="rgba(255,255,255,.45)" strokeWidth="1.2" />
                  <circle cx="21" cy="21" r="2.5" fill="rgba(255,255,255,.25)" />
                </svg>
              </motion.div>

              <motion.div
                className="cover-ue"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Plateforme Orientation
              </motion.div>
              <motion.div
                className="cover-passport-word"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                PASSEPORT
                <br />
                ETUDIANT
              </motion.div>
              <motion.div
                className="cover-edition"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95 }}
              >
                Édition Salon · 2025–2026
              </motion.div>

              <motion.div
                className="cover-logo-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.05 }}
              >
                <img src={LOGO_URL} alt="l'Étudiant" />
              </motion.div>

              <motion.div
                className="cover-holder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="cover-holder-label">Profil · Holder</div>
                <div className="cover-holder-name" data-testid="cover-holder-name">
                  {displayName}
                </div>
              </motion.div>

              <motion.button
                className="cover-open-btn"
                onClick={() => navigate("/passport/identity")}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.35 }}
                data-testid="btn-open-passport"
              >
                Ouvrir mon PasseportEtudiant →
              </motion.button>
            </div>

            <div className="cover-bottom">
              <div className="cover-serial" data-testid="cover-serial">
                {student.serial}
              </div>
              <button
                className="cover-back-btn"
                onClick={() => navigate("/")}
                data-testid="btn-change-profile"
              >
                ← Changer de profil
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
