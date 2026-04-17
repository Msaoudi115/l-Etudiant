import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import BottomNav from "@/components/BottomNav";
import QRScanner from "@/components/QRScanner";
import Toast from "@/components/Toast";
import { BackIcon, ScanIcon } from "@/components/icons";
import { getHalls, getSchools, createStamp, deleteStamp } from "@/lib/api";

export default function StampsPage() {
  const navigate = useNavigate();
  const { student, stamps, setStamps, loading, loadStamps } = usePassport();
  const [halls, setHalls] = useState([]);
  const [schools, setSchools] = useState([]);
  const [activeHall, setActiveHall] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [slamId, setSlamId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "ok" });

  useEffect(() => {
    Promise.all([getHalls(), getSchools()]).then(([h, s]) => {
      setHalls(h);
      setSchools(s);
    });
  }, []);

  const stampsBySchool = useMemo(() => {
    const map = {};
    stamps.forEach((s) => (map[s.school_id] = s));
    return map;
  }, [stamps]);

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const isAnon = student.is_anonymous;

  const hall = halls[activeHall];
  const hallSchools = schools.filter((s) => s.hall_id === hall?.id);

  const totalSchools = schools.length;
  const doneCount = stamps.length;
  const pct = totalSchools > 0 ? Math.round((doneCount / totalSchools) * 100) : 0;

  const toggleStamp = async (school) => {
    if (isAnon) {
      setToast({ msg: "Profil anonyme — impossible", type: "err" });
      return;
    }
    const existing = stampsBySchool[school.id];
    if (existing) {
      // delete stamp
      try {
        await deleteStamp(existing.id);
        setStamps(stamps.filter((s) => s.id !== existing.id));
        setToast({ msg: "Tampon retiré", type: "ok" });
      } catch (e) {
        setToast({ msg: "Erreur", type: "err" });
      }
    } else {
      try {
        const res = await createStamp({
          student_id: student.id,
          qr_token: school.id,
        });
        if (res && res.stamp) {
          setStamps([...stamps.filter((s) => s.school_id !== school.id), res.stamp]);
          setSlamId(school.id);
          setTimeout(() => setSlamId(null), 900);
          setToast({ msg: `✓ Tampon ${school.name}`, type: "ok" });
        }
      } catch (e) {
        setToast({ msg: "Erreur lors du tampon", type: "err" });
      }
    }
  };

  const onScanResult = async (decoded) => {
    setScannerOpen(false);
    if (isAnon) {
      setToast({ msg: "Profil anonyme — impossible", type: "err" });
      return;
    }
    try {
      const res = await createStamp({
        student_id: student.id,
        qr_token: decoded,
      });
      if (res && res.stamp) {
        // reload stamps
        await loadStamps(student.id);
        setSlamId(res.school?.id);
        setTimeout(() => setSlamId(null), 900);
        if (res.duplicate) {
          setToast({ msg: `Déjà tamponné : ${res.school?.name}`, type: "ok" });
        } else {
          setToast({ msg: `✓ Tampon ${res.school?.name}`, type: "ok" });
        }
        // Switch to hall of the scanned school
        const hIdx = halls.findIndex((h) => h.id === res.school?.hall_id);
        if (hIdx >= 0) setActiveHall(hIdx);
      }
    } catch (e) {
      setToast({ msg: "QR code inconnu", type: "err" });
    }
  };

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <button
            className="tb-back"
            onClick={() => navigate("/passport/identity")}
            data-testid="btn-back"
          >
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
                  Sans QR code individuel, Théo ne peut pas enregistrer ses
                  visites. Aucune donnée in-fair ne peut être capturée.
                </div>
              </div>
              <div className="spacer" />
              <button
                className="rv-btn"
                onClick={() => navigate("/create")}
                data-testid="btn-activate-from-stamps"
              >
                Activer mon PasseportEtudiant
              </button>
              <div className="spacer" />
              <div className="sol-card">
                <div className="sol-title">✓ Avec le PasseportEtudiant</div>
                <div className="sol-text">
                  Si le professeur partageait un code classe, Théo aurait son
                  propre passeport et pourrait cocher chaque stand visité.
                </div>
              </div>
            </div>
            <div className="pf">
              <div className="pfr">
                <span className="pfl">Profil anonyme</span>
                <span className="pfp">—</span>
              </div>
              <div className="pft"><div className="pff" style={{ width: "0%" }} /></div>
              <div className="pfh">Sans profil, pas de suivi possible.</div>
            </div>
          </>
        ) : (
          <div className="stamps-bg">
            <div className="hall-tabs">
              {halls.map((h, i) => (
                <button
                  key={h.id}
                  className={`htab ${i === activeHall ? "a" : ""}`}
                  onClick={() => setActiveHall(i)}
                  data-testid={`hall-tab-${h.id}`}
                >
                  <span className="htab-dot" style={{ background: h.color }} />
                  {h.label}
                </button>
              ))}
            </div>
            <div className="stamps-body">
              {hall ? (
                <>
                  <div className="hh">
                    <div className="hd" style={{ background: hall.color }} />
                    <div className="hn">{hall.label}</div>
                    <div className="hc">
                      {hallSchools.filter((s) => stampsBySchool[s.id]).length}/
                      {hallSchools.length}
                    </div>
                  </div>
                  <div className="sl">
                    {hallSchools.map((s) => {
                      const stamp = stampsBySchool[s.id];
                      const v = !!stamp;
                      return (
                        <motion.div
                          key={s.id}
                          className={`si ${v ? "v" : ""}`}
                          onClick={() => toggleStamp(s)}
                          whileTap={{ scale: 0.98 }}
                          data-testid={`stamp-row-${s.id}`}
                        >
                          <div className="sc">
                            {v ? "✓" : s.initials.substring(0, 2)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sn">{s.name}</div>
                            <div className="st">{s.type}</div>
                          </div>
                          {v && <div className="stm">{stamp.time_label}</div>}
                          <AnimatePresence>
                            {slamId === s.id ? (
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
                    })}
                  </div>
                </>
              ) : null}
            </div>
            <button
              className="scan-fab"
              onClick={() => setScannerOpen(true)}
              data-testid="btn-scan-qr"
            >
              <ScanIcon />
              Scanner un stand
            </button>
            <div className="pf">
              <div className="pfr">
                <span className="pfl">
                  {doneCount} tampon{doneCount > 1 ? "s" : ""} sur {totalSchools}
                </span>
                <span className="pfp" data-testid="progress-pct">
                  {pct}%
                </span>
              </div>
              <div className="pft">
                <div className="pff" style={{ width: `${pct}%` }} />
              </div>
              <div className="pfh">
                {doneCount < 3
                  ? `Visite ${3 - doneCount} établissement${
                      3 - doneCount > 1 ? "s" : ""
                    } de plus pour débloquer tes recommandations`
                  : "✓ Récap personnalisé disponible"}
              </div>
            </div>
          </div>
        )}
        <BottomNav />
        <QRScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onResult={onScanResult}
        />
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast({ msg: "", type: "ok" })}
        />
      </div>
    </div>
  );
}
