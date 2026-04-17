import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import BottomNav from "@/components/BottomNav";
import { BackIcon } from "@/components/icons";
import { getRecap } from "@/lib/api";

export default function RecapPage() {
  const navigate = useNavigate();
  const { student, loading } = usePassport();
  const [recap, setRecap] = useState(null);

  useEffect(() => {
    if (!student) return;
    getRecap(student.id).then(setRecap).catch(() => setRecap(null));
  }, [student]);

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const isAnon = student.is_anonymous;
  const done = recap?.stamps?.length || 0;
  const score = recap?.score || 0;

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <button
            className="tb-back"
            onClick={() => navigate("/passport/stamps")}
            data-testid="btn-back"
          >
            <BackIcon />
          </button>
          <div className="tb-title">Récap post-salon</div>
          <div className="tb-chip">3 / 3</div>
        </div>
        <div className="rh">
          <div className="rht">
            <div>
              <div className="rhn">{student.name || "—"}</div>
              <div className="rhd">Paris · 15 avril 2026</div>
            </div>
            <motion.div
              className="sr2"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 170, damping: 14 }}
            >
              <div className="sn2" data-testid="recap-score">
                {isAnon || done === 0 ? "—" : score}
              </div>
              <div className="sl2">Score</div>
            </motion.div>
          </div>
          <div className="rhs">
            <div className="rstat">
              <div className="rsn">{done}</div>
              <div className="rsl">Tampons</div>
            </div>
            <div className="rstat">
              <div className="rsn">
                {isAnon || done === 0 ? "—" : `${recap?.duration_min || 0}m`}
              </div>
              <div className="rsl">Durée</div>
            </div>
            <div className="rstat">
              <div className="rsn">
                {isAnon ? "—" : student.consents?.d ? "✓" : "✗"}
              </div>
              <div className="rsl">Diplomeo</div>
            </div>
          </div>
        </div>
        <div className="rscroll">
          {isAnon ? (
            <>
              <div className="es">
                <div className="es-i">📭</div>
                <div className="es-t">Aucun récap disponible</div>
                <div className="es-s">
                  L'Étudiant ne sait pas que Théo était au salon. Pas de profil,
                  pas de tampon, pas de recommandation.
                </div>
              </div>
              <div className="sol-card">
                <div className="sol-title">✓ Ce que Théo aurait reçu</div>
                <div className="sol-text">
                  Un récap personnalisé avec les établissements visités, un
                  score d'exploration et les prochaines JPO.
                </div>
              </div>
              <button
                className="swb"
                onClick={() => navigate("/")}
                data-testid="btn-back-select"
              >
                ← Tester le profil de Lucas
              </button>
            </>
          ) : done < 3 ? (
            <>
              <div className="uh" data-testid="recap-unlock">
                <div style={{ fontSize: 30 }}>🗺️</div>
                <div className="uh-t">Explore encore le salon</div>
                <div className="uh-s">
                  Visite{" "}
                  <strong>
                    {3 - done} établissement{3 - done > 1 ? "s" : ""}
                  </strong>{" "}
                  supplémentaire{3 - done > 1 ? "s" : ""} pour débloquer tes
                  recommandations.
                </div>
              </div>
              <button
                className="swb"
                onClick={() => navigate("/passport/stamps")}
              >
                Aller tamponner →
              </button>
            </>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.07 } },
                }}
              >
                <div className="rsec">Établissements recommandés</div>
                {(recap?.recos || []).map((r, i) => (
                  <motion.div
                    key={i}
                    className="rc"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    data-testid={`reco-${i}`}
                  >
                    <div className="rct">
                      <div>
                        <div className="rcn">{r.name}</div>
                        <div className="rcy">{r.type}</div>
                      </div>
                      <div className={`rcb ${r.t ? "t" : ""}`}>{r.m}%</div>
                    </div>
                    <div className="rctr">
                      <motion.div
                        className={`rcf ${r.t ? "t" : ""}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${r.m}%` }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div>
                <div className="rsec">Prochaines étapes</div>
                {(recap?.next || []).map((n, i) => (
                  <motion.div
                    key={i}
                    className="nc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div className="nd" style={{ background: n.c }} />
                    <div>
                      <div className="nt">{n.t}</div>
                      <div className="nd2">{n.d}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div>
                <div className="rsec">Données capturées</div>
                <div className="db">
                  {done} établissement{done > 1 ? "s" : ""} visité
                  {done > 1 ? "s" : ""}
                  <br />
                  Filière : {student.filieres?.[0] || "non renseignée"}
                  <br />
                  Diplomeo : {student.consents?.d ? "Actif" : "Inactif"}
                  <br />
                  Lead score : <strong>{score} / 100</strong>
                </div>
              </div>

              <button
                className="swb"
                onClick={() => navigate("/")}
                data-testid="btn-back-select"
              >
                ← Tester un autre profil
              </button>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
