import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import { TeacherIcon, ChartIcon } from "@/components/icons";
import { getStudent } from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

export default function SelectPage() {
  const navigate = useNavigate();
  const { selectStudent, clear } = usePassport();
  const [loading, setLoading] = useState("");

  const loadDemo = async (id) => {
    setLoading(id);
    try {
      await getStudent(id);
      selectStudent(id);
      navigate("/passport/cover");
    } catch (e) {
      alert("Profil introuvable. Réessayez.");
    } finally {
      setLoading("");
    }
  };

  const reset = () => {
    clear();
    try {
      localStorage.clear();
    } catch {}
    alert("Session réinitialisée.");
  };

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <img src={LOGO_URL} alt="l'Étudiant" className="logo-img" />
          <div style={{ flex: 1 }} />
          <div className="tb-chip">PasseportEtudiant</div>
        </div>
        <div className="scroll-body">
          <motion.div
            className="sel-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="sel-hero-text">
              <div className="sel-hero-eyebrow">Salon · Orientation</div>
              <div className="sel-hero-title">
                Salon de
                <br />
                l'Orientation 2026
              </div>
              <div className="sel-hero-sub">
                Choisis un profil démo ou active ton propre PasseportEtudiant.
              </div>
            </div>
            <motion.div
              className="sel-passport-mini"
              initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
              animate={{ rotate: -2, scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 14 }}
            >
              <svg width="30" height="22" viewBox="0 0 26 20" fill="none">
                <rect x="1" y="1" width="24" height="18" rx="2" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" />
                <circle cx="8.5" cy="8" r="3.5" stroke="rgba(255,255,255,.55)" strokeWidth="1" />
                <line x1="14" y1="6" x2="22" y2="6" stroke="rgba(255,255,255,.5)" strokeWidth="1" />
                <line x1="14" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
                <line x1="3" y1="15.5" x2="23" y2="15.5" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
                <line x1="3" y1="18" x2="18" y2="18" stroke="rgba(255,255,255,.2)" strokeWidth="1" />
              </svg>
              <div className="spm-label">Passeport</div>
            </motion.div>
          </motion.div>

          <motion.div
            className="create-card"
            onClick={() => navigate("/create")}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            data-testid="btn-activate-passport"
          >
            <div className="cc-icon">＋</div>
            <div>
              <div className="cc-name">Activer mon PasseportEtudiant</div>
              <div className="cc-desc">
                Crée ton profil en 60s avec le code professeur
              </div>
            </div>
          </motion.div>

          <div className="entry-grid">
            <button
              className="entry-btn"
              onClick={() => navigate("/teacher")}
              data-testid="entry-teacher"
            >
              <TeacherIcon />
              <div className="eb-title">Espace professeur</div>
              <div className="eb-sub">
                Créer un code classe, voir mes élèves
              </div>
            </button>
            <button
              className="entry-btn"
              onClick={() => navigate("/analytics")}
              data-testid="entry-analytics"
            >
              <ChartIcon />
              <div className="eb-title">Dashboard salon</div>
              <div className="eb-sub">
                Stats temps réel · l'Étudiant
              </div>
            </button>
          </div>

          <div className="sel-label">Profils de démonstration</div>

          <div
            className="sel-row"
            onClick={() => loadDemo("demo-lucas")}
            data-testid="demo-lucas"
          >
            <div className="sr-avatar" style={{ background: "#fff0f0" }}>
              🎓
            </div>
            <div style={{ flex: 1 }}>
              <div className="sr-name">Lucas, 17 ans</div>
              <div className="sr-desc">
                Lycéen intentionniste · Venu seul · Ingénierie
              </div>
            </div>
            <span style={{ color: "#ddd", fontSize: 20 }}>
              {loading === "demo-lucas" ? "…" : "›"}
            </span>
          </div>

          <div
            className="sel-row"
            onClick={() => loadDemo("demo-theo")}
            data-testid="demo-theo"
          >
            <div className="sr-avatar" style={{ background: "#f5f5f5" }}>
              👥
            </div>
            <div style={{ flex: 1 }}>
              <div className="sr-name">Théo, 16 ans</div>
              <div className="sr-desc">
                Groupe scolaire anonyme · sans profil individuel
              </div>
            </div>
            <span style={{ color: "#ddd", fontSize: 20 }}>
              {loading === "demo-theo" ? "…" : "›"}
            </span>
          </div>

          <div className="sel-footer">
            Prototype · Albert School × l'Étudiant · 2026
            <div>
              <button
                className="reset-btn"
                onClick={reset}
                data-testid="btn-reset-session"
              >
                Réinitialiser la session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
