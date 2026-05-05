import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import BottomNav from "@/components/BottomNav";
import QRScanner from "@/components/QRScanner";
import Toast from "@/components/Toast";
import { BackIcon, ScanIcon } from "@/components/icons";
import { getHalls, getSchools, createStamp, deleteStamp, rateStamp, getLeaderboard } from "@/lib/api";
import { extractSchoolIdFromQr } from "@/lib/demoQr";
import StampCounter from "@/components/stamps/StampCounter";
import StampSearchBar from "@/components/stamps/StampSearchBar";
import HallSection from "@/components/stamps/HallSection";
import QrScanModal from "@/components/stamps/QrScanModal";

const FILIERE_TO_HALL = {
  "Ingénierie": "i",
  "Numérique": "i",
  "Commerce": "c",
  "Sciences Po": "s",
  "Santé": "s",
  "Arts": "a",
  "Droit": "s",
};

const BADGE_THRESHOLDS = [
  { stamps: 1, icon: "👣", label: "Premier pas" },
  { stamps: 5, icon: "🏃", label: "Marathonien" },
  { stamps: 10, icon: "🏆", label: "Complétiste" },
];

// Normalize location from school "type" field (format: "Desc · Ville")
const normalizeVille = (type) => {
  if (!type || !type.includes(" · ")) return null;
  const loc = type.split(" · ").pop();
  if (/national/i.test(loc)) return "National";
  if (/multi|en ligne/i.test(loc)) return "Multi-sites";
  const idf = ["Paris", "Villejuif", "Sceaux", "Cachan", "Marne-la-Vallée",
    "Levallois", "Ferrières", "Défense", "Palaiseau", "Villetaneuse",
    "Évry", "Essonne", "Île-de-France", "Ivry", "Kremlin"];
  if (idf.some((k) => loc.includes(k))) return "Paris / IDF";
  if (loc.includes("Lille")) return "Lille";
  if (loc.includes("Lyon")) return "Lyon";
  if (loc.includes("Rouen") || loc.includes("Havre")) return "Normandie";
  if (loc.includes("Nantes")) return "Nantes";
  if (loc.includes("Strasbourg") || loc.includes("Nancy")) return "Grand Est";
  if (loc.includes("Bordeaux")) return "Bordeaux";
  if (loc.includes("Toulouse")) return "Toulouse";
  if (loc.includes("Montpellier") || loc.includes("Nice") || loc.includes("Marseille")) return "Sud";
  return "Autres";
};

export default function StampsPage() {
  const navigate = useNavigate();
  const { student, stamps, setStamps, loading, loadStamps } = usePassport();
  const [halls, setHalls] = useState([]);
  const [schools, setSchools] = useState([]);
  const [activeHall, setActiveHall] = useState(-1); // -1 = Tous
  const [filterVille, setFilterVille] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [slamId, setSlamId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "ok" });
  const [scorePulse, setScorePulse] = useState(false);
  const [classRank, setClassRank] = useState(null);
  const [showRecapCelebration, setShowRecapCelebration] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ratingModal, setRatingModal] = useState(null); // { stamp, school }
  const prevDoneCountRef = useRef(0);
  const activeHallRef = useRef(-1);

  useEffect(() => {
    Promise.all([getHalls(), getSchools()]).then(([h, s]) => {
      setHalls(h);
      setSchools(s);
    });
  }, []);

  useEffect(() => {
    if (!student || student.is_anonymous || !student.class_code) return;
    getLeaderboard()
      .then((lb) => {
        const entry = lb.find((r) => r.code === student.class_code);
        if (entry) setClassRank(entry.rank);
      })
      .catch(() => {});
  }, [student]);

  useEffect(() => {
    if (!student || student.is_anonymous) return;
    const key = `stamps_onboarding_${student.id}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
      localStorage.setItem(key, "1");
    }
  }, [student]);

  useEffect(() => {
    const count = stamps.length;
    if (count !== prevDoneCountRef.current) {
      setScorePulse(true);
      setTimeout(() => setScorePulse(false), 800);
    }
    if (prevDoneCountRef.current < 3 && count >= 3 && student) {
      const key = `recap_celebration_${student.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        setTimeout(() => setShowRecapCelebration(true), 600);
      }
    }
    prevDoneCountRef.current = count;
  }, [stamps, student]);

  useEffect(() => {
    if (stamps.length > 0) setShowOnboarding(false);
  }, [stamps]);

  const stampsBySchool = useMemo(() => {
    const map = {};
    stamps.forEach((s) => (map[s.school_id] = s));
    return map;
  }, [stamps]);

  const hallFilteredForVilles = useMemo(() => {
    if (activeHall === -1) return schools;
    return schools.filter((s) => s.hall_id === halls[activeHall]?.id);
  }, [activeHall, schools, halls]);

  const availableVilles = useMemo(() => {
    const set = new Set();
    hallFilteredForVilles.forEach((s) => {
      const v = normalizeVille(s.type);
      if (v) set.add(v);
    });
    const order = ["Paris / IDF", "Lille", "Lyon", "Nantes", "Normandie",
      "Bordeaux", "Toulouse", "Grand Est", "Sud", "Autres", "Multi-sites", "National"];
    return order.filter((v) => set.has(v));
  }, [hallFilteredForVilles]);

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const isAnon = student.is_anonymous;
  const totalSchools = schools.length;
  const doneCount = stamps.length;
  const pct = totalSchools > 0 ? Math.round((doneCount / totalSchools) * 100) : 0;

  const visibleSchools = filterVille
    ? hallFilteredForVilles.filter((s) => normalizeVille(s.type) === filterVille)
    : hallFilteredForVilles;

  if (activeHall !== activeHallRef.current) {
    activeHallRef.current = activeHall;
    if (filterVille && !availableVilles.includes(filterVille)) {
      setFilterVille(null);
    }
  }

  const preferredHalls = new Set(
    (student.filieres || []).map((f) => FILIERE_TO_HALL[f]).filter(Boolean)
  );
  const suggestions = schools
    .filter((s) => !stampsBySchool[s.id] && preferredHalls.has(s.hall_id))
    .slice(0, 3);

  const nextBadge = BADGE_THRESHOLDS.find((b) => b.stamps > doneCount);
  const stampsToNext = nextBadge ? nextBadge.stamps - doneCount : null;
  const currentHall = activeHall >= 0 ? halls[activeHall] : null;

  const toggleStamp = async (school) => {
    if (isAnon) { setToast({ msg: "Profil anonyme — impossible", type: "err" }); return; }
    const existing = stampsBySchool[school.id];
    if (existing) {
      try {
        await deleteStamp(existing.id);
        setStamps(stamps.filter((s) => s.id !== existing.id));
        setToast({ msg: "Tampon retiré", type: "ok" });
      } catch (e) { setToast({ msg: "Erreur", type: "err" }); }
    } else {
      try {
        const res = await createStamp({ student_id: student.id, qr_token: school.id });
        if (res && res.stamp) {
          setStamps([...stamps.filter((s) => s.school_id !== school.id), res.stamp]);
          setSlamId(school.id);
          setTimeout(() => setSlamId(null), 900);
          setToast({ msg: `✓ Tampon ${school.name}`, type: "ok" });
          setTimeout(() => setRatingModal({ stamp: res.stamp, school }), 750);
        }
      } catch (e) { setToast({ msg: "Erreur lors du tampon", type: "err" }); }
    }
  };

  const onScanResult = async (decoded) => {
    setScannerOpen(false);
    const qrPayload = extractSchoolIdFromQr(decoded);
    if (isAnon) { setToast({ msg: "Profil anonyme — impossible", type: "err" }); return; }
    setToast({ msg: "QR lu, validation du tampon...", type: "ok" });
    try {
      const res = await createStamp({ student_id: student.id, qr_token: qrPayload });
      if (res && res.stamp) {
        setStamps((current) => [...current.filter((s) => s.school_id !== res.stamp.school_id), res.stamp]);
        loadStamps(student.id).catch(() => {});
        setSlamId(res.school?.id);
        setTimeout(() => setSlamId(null), 900);
        if (res.duplicate) {
          setToast({ msg: `Déjà tamponné : ${res.school?.name}`, type: "ok" });
        } else {
          setToast({ msg: `✓ Tampon ${res.school?.name}`, type: "ok" });
          setTimeout(() => setRatingModal({ stamp: res.stamp, school: res.school }), 750);
        }
        const hIdx = halls.findIndex((h) => h.id === res.school?.hall_id);
        if (hIdx >= 0) setActiveHall(hIdx);
      }
    } catch (e) {
      setToast({ msg: e?.response?.data?.detail || "QR code inconnu", type: "err" });
    }
  };

  const handleRate = async (stampId, rating) => {
    setRatingModal(null);
    try {
      const updated = await rateStamp(stampId, rating);
      setStamps(stamps.map((s) => (s.id === stampId ? updated : s)));
    } catch (e) { /* rating is optional, silent fail */ }
  };

  const jumpToSuggestion = (school) => {
    const hIdx = halls.findIndex((h) => h.id === school.hall_id);
    if (hIdx >= 0) setActiveHall(hIdx);
    setFilterVille(null);
  };

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <button className="tb-back" onClick={() => navigate("/passport/identity")} data-testid="btn-back">
            <BackIcon />
          </button>
          <div className="tb-title">Mes tampons</div>
          <div className="tb-chip">2 / 3</div>
        </div>

        {isAnon ? (
          <>
            <div className="stamps-body">
              <div className="es" data-testid="stamps-anonymous">
                <div className="es-i">🚫</div>
                <div className="es-t">Aucun tampon possible</div>
                <div className="es-s">
                  Sans QR code individuel, Théo ne peut pas enregistrer ses visites. Aucune donnée in-fair ne peut être capturée.
                </div>
              </div>
              <div className="spacer" />
              <button className="rv-btn" onClick={() => navigate("/create")} data-testid="btn-activate-from-stamps">
                Activer mon PasseportEtudiant
              </button>
              <div className="spacer" />
              <div className="sol-card">
                <div className="sol-title">✓ Avec le PasseportEtudiant</div>
                <div className="sol-text">
                  Si le professeur partageait un code classe, Théo aurait son propre passeport et pourrait cocher chaque stand visité.
                </div>
              </div>
            </div>
            <div className="pf">
              <div className="pfr"><span className="pfl">Profil anonyme</span><span className="pfp">—</span></div>
              <div className="pft"><div className="pff" style={{ width: "0%" }} /></div>
              <div className="pfh">Sans profil, pas de suivi possible.</div>
            </div>
          </>
        ) : (
          <div className="stamps-bg">
            <StampCounter
              doneCount={doneCount}
              totalSchools={totalSchools}
              pct={pct}
              scorePulse={scorePulse}
              classRank={classRank}
              stampsToNext={stampsToNext}
              nextBadge={nextBadge}
            />

            {/* Personalized suggestions */}
            {suggestions.length > 0 && doneCount < totalSchools && (
              <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #f0f0f0", background: "#fff9f9" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--red)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                  ✦ À ne pas manquer selon ton profil
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {suggestions.map((s) => {
                    const hallInfo = halls.find((h) => h.id === s.hall_id);
                    return (
                      <button key={s.id} onClick={() => jumpToSuggestion(s)}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #eee", borderRadius: 8, padding: "6px 10px", cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: hallInfo?.color || "#ccc", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                          {s.initials.substring(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                          <div style={{ fontSize: 10.5, color: "#888" }}>{s.type}</div>
                        </div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>→</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <StampSearchBar
              halls={halls}
              activeHall={activeHall}
              onHallChange={setActiveHall}
              availableVilles={availableVilles}
              filterVille={filterVille}
              onVilleChange={setFilterVille}
            />

            <div className="stamps-body">
              <HallSection
                currentHall={currentHall}
                filterVille={filterVille}
                visibleSchools={visibleSchools}
                stampsBySchool={stampsBySchool}
                slamId={slamId}
                halls={halls}
                activeHall={activeHall}
                onToggle={toggleStamp}
              />
            </div>

            {/* Onboarding tooltip */}
            <AnimatePresence>
              {showOnboarding && doneCount === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "white", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", zIndex: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setShowOnboarding(false)}
                >
                  👆 Commence par scanner un stand !
                  <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                  <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid var(--ink)" }} />
                </motion.div>
              )}
            </AnimatePresence>

            <button className="scan-fab" onClick={() => setScannerOpen(true)} data-testid="btn-scan-qr">
              <ScanIcon />
              Scanner un stand
            </button>
            <div className="pf">
              <div className="pfr">
                <span className="pfl">{doneCount} tampon{doneCount > 1 ? "s" : ""} sur {totalSchools}</span>
                <span className="pfp" data-testid="progress-pct">{pct}%</span>
              </div>
              <div className="pft"><div className="pff" style={{ width: `${pct}%` }} /></div>
              <div className="pfh">
                {doneCount < 3
                  ? `Visite ${3 - doneCount} établissement${3 - doneCount > 1 ? "s" : ""} de plus pour débloquer tes recommandations`
                  : "✓ Récap personnalisé disponible"}
              </div>
            </div>
          </div>
        )}

        <QrScanModal
          ratingModal={ratingModal}
          onRate={handleRate}
          onClose={() => setRatingModal(null)}
          showRecapCelebration={showRecapCelebration}
          onDismissCelebration={() => setShowRecapCelebration(false)}
        />

        <BottomNav />
        <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={onScanResult} />
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "ok" })} />
      </div>
    </div>
  );
}
