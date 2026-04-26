import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { usePassport } from "@/context/PassportContext";
import BottomNav from "@/components/BottomNav";
import { BackIcon } from "@/components/icons";
import { updateStudent } from "@/lib/api";

function mrzLine1(name) {
  const parts = (name || "")
    .toUpperCase()
    .replace(/[ÉÈÊ]/g, "E")
    .replace(/[À]/g, "A")
    .replace(/[Ç]/g, "C")
    .split(" ");
  const sn = parts.slice(1).join("<<") || parts[0] || "";
  const gn = parts[0] || "";
  const raw = "P<FRA" + sn + "<<" + gn;
  return raw.substring(0, 44).padEnd(44, "<");
}
function mrzLine2(serial, dob) {
  const num = (serial || "").replace(/-/g, "").padEnd(9, "<").substring(0, 9);
  const d = (dob || "").replace(/\//g, "");
  const yr = d.length >= 6 ? d.substring(4, 6) : "00";
  const mo = d.length >= 4 ? d.substring(2, 4) : "01";
  const dy = d.length >= 2 ? d.substring(0, 2) : "01";
  return (num + "<FRA" + yr + mo + dy + "1M3104015<<<<<<2").substring(0, 44).padEnd(44, "<");
}

const CONSENTS = [
  { key: "l", label: "Contenus personnalisés l'Étudiant" },
  { key: "d", label: "Contact Diplomeo — mise en relation" },
  { key: "c", label: "Offres partenaires" },
  { key: "e", label: "Enquêtes et études" },
];

export default function IdentityPage() {
  const navigate = useNavigate();
  const { student, setStudent, loading } = usePassport();

  const toggleConsent = async (key) => {
    if (!student || student.is_anonymous) return;
    const newConsents = { ...(student.consents || {}), [key]: !student.consents?.[key] };
    setStudent({ ...student, consents: newConsents });
    try {
      const updated = await updateStudent(student.id, { consents: newConsents });
      setStudent(updated);
    } catch {}
  };

  const qrPayload = useMemo(() => {
    if (!student) return "";
    return JSON.stringify({
      pass: student.serial,
      name: student.name,
      classe: student.classe,
      filieres: student.filieres,
    });
  }, [student]);

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const isAnon = student.is_anonymous;
  const parts = (student.name || "").split(" ");
  const sn = parts.length > 1 ? parts.slice(1).join(" ") : student.name;
  const gn = parts[0];
  const m1 = mrzLine1(student.name);
  const m2 = mrzLine2(student.serial, student.dob_short);

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <button
            className="tb-back"
            onClick={() => navigate("/passport/cover")}
            data-testid="btn-back"
          >
            <BackIcon />
          </button>
          <div className="tb-title">Page d'identité</div>
          <div className="tb-chip">1 / 3</div>
        </div>
        <div className="scroll-body pp-bg">
          <motion.div
            className="pp-wrap"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {isAnon ? (
              <motion.div
                className="alert-card"
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                data-testid="identity-anonymous-alert"
              >
                <div className="alert-title">Profil anonyme — groupe scolaire</div>
                <div className="alert-text">
                  Théo est venu avec sa classe. Son professeur a inscrit le groupe collectivement.
                  Théo n'a pas de QR code individuel, pas de profil, et aucun consentement en son
                  nom. Pour l'Étudiant, Théo n'existe pas.
                </div>
              </motion.div>
            ) : null}

            <motion.div
              className="pp-page"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="pp-band">
                <div className="ppb-left">Page d'identité · Identity Page</div>
                <div className="ppb-right">{student.serial}</div>
              </div>
              <div className="pp-content">
                <div className="pp-id-row">
                  <div className="pp-photo-wrap">
                    <div className={`pp-photo ${isAnon ? "empty" : ""}`}>
                      {isAnon ? "" : student.emoji}
                    </div>
                    <div className="pp-photo-num">
                      {isAnon ? "NON ENREG." : (student.serial || "").slice(-5)}
                    </div>
                  </div>
                  <div className="pp-fields">
                    <div className="ppf">
                      <div className="ppf-label">
                        <span className="fr">Nom</span>
                        <span className="en">/ Surname</span>
                      </div>
                      <div className={`ppf-val ${isAnon ? "na" : ""}`} data-testid="id-surname">
                        {isAnon ? "Non renseigné" : (sn || "").toUpperCase()}
                      </div>
                    </div>
                    <div className="ppf">
                      <div className="ppf-label">
                        <span className="fr">Prénoms</span>
                        <span className="en">/ Given names</span>
                      </div>
                      <div className={`ppf-val ${isAnon ? "na" : ""}`}>
                        {isAnon ? "Non renseigné" : (gn || "").toUpperCase()}
                      </div>
                    </div>
                    <div className="ppf">
                      <div className="ppf-label">
                        <span className="fr">Nationalité</span>
                        <span className="en">/ Nationality</span>
                      </div>
                      <div className={`ppf-val ${isAnon ? "na" : ""}`}>
                        {student.nat || "—"}
                      </div>
                    </div>
                    <div className="ppf">
                      <div className="ppf-label">
                        <span className="fr">Date de naissance</span>
                        <span className="en">/ Date of birth</span>
                      </div>
                      <div className={`ppf-val ${isAnon || student.dob_short === "—" ? "na" : ""}`}>
                        {student.dob_short || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                {!isAnon && (
                  <div>
                    <div className="pp-field-fw">
                      <div className="ppf-label">
                        <span className="fr">Sexe</span>
                        <span className="en">/ Sex</span>
                        &nbsp;&nbsp;
                        <span className="fr">Lieu</span>
                        <span className="en">/ Place</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
                        <div className={`ppf-val ${student.sex === "—" ? "na" : ""}`}>
                          {student.sex}
                        </div>
                        <div className={`ppf-val ${student.lieu === "—" ? "na" : ""}`} style={{ color: "var(--ink2)" }}>
                          {student.lieu}
                        </div>
                      </div>
                    </div>
                    <div className="pp-field-fw">
                      <div className="ppf-label">
                        <span className="fr">Classe · filière</span>
                        <span className="en">/ Academic profile</span>
                      </div>
                      <div className="pp-tags">
                        <span className="pp-tag ghost">{student.classe}</span>
                        {(student.filieres || []).map((f) => (
                          <span className="pp-tag" key={f}>
                            {f}
                          </span>
                        ))}
                        {(student.formation || []).map((f) => (
                          <span className="pp-tag red" key={f}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pp-field-fw" style={{ border: "none" }}>
                      <div className="ppf-label">
                        <span className="fr">Délivrance</span>
                        <span className="en">/ Issue</span>
                        &nbsp;&nbsp;
                        <span className="fr">Expiration</span>
                        <span className="en">/ Expiry</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
                        <div className="ppf-val">15/04/2026</div>
                        <div className="ppf-val" style={{ color: "var(--ink2)" }}>
                          {student.expire}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mrz-wrap">
                <div className="mrz-label">Zone de lecture automatique · MRZ</div>
                <div className="mrz-box">
                  {isAnon ? (
                    <>
                      ANONYME&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                      <br />
                      NON-ENREGISTRE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    </>
                  ) : (
                    <>
                      {m1.replaceAll("<", "\u2039")}
                      <br />
                      {m2.replaceAll("<", "\u2039")}
                    </>
                  )}
                </div>
              </div>

              <div className="qr-wrap">
                <div className="qr-label">QR d'accès · Access QR</div>
                <div className="qr-box">
                  {isAnon ? (
                    <div
                      className="qr-svg-wrap"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#b8b3a1",
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    >
                      N/A
                    </div>
                  ) : (
                    <div className="qr-svg-wrap">
                      <QRCodeSVG
                        value={qrPayload}
                        size={72}
                        level="M"
                        fgColor="#121212"
                        bgColor="#ffffff"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}
                  <div className="qr-meta">
                    <div className="qr-id" data-testid="qr-id">
                      ID: {student.serial || "NON-ACTIF"}
                    </div>
                    <div className="qr-hint">
                      {isAnon
                        ? "Active ton PasseportEtudiant pour générer ton QR."
                        : "Scanne ce QR à l'entrée des stands pour enregistrer tes visites."}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="consent-card"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="cc-header">Consentements recueillis · Consents on record</div>
              <div className="cc-body">
                {CONSENTS.map((c) => {
                  const on = !isAnon && !!student.consents?.[c.key];
                  return (
                    <div
                      key={c.key}
                      className={`con-row ${!isAnon ? "clickable" : ""}`}
                      onClick={() => !isAnon && toggleConsent(c.key)}
                      data-testid={`consent-${c.key}`}
                    >
                      <div className={`cdot ${on ? "on" : "off"}`} />
                      <div className="con-text">{c.label}</div>
                      {!isAnon && <div className={`con-tog ${on ? "on" : ""}`} />}
                    </div>
                  );
                })}
              </div>
              {!isAnon && (
                <button
                  onClick={() => navigate("/rgpd")}
                  style={{
                    width: "100%",
                    background: "var(--cream2)",
                    border: "none",
                    borderTop: "1px solid var(--cream3)",
                    padding: "12px 14px",
                    fontFamily: "var(--font)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--ink)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  data-testid="btn-go-rgpd"
                >
                  <span>🔐 Mon RGPD — finalités, audit, export, effacement</span>
                  <span style={{ color: "#999" }}>›</span>
                </button>
              )}
            </motion.div>

            {isAnon && (
              <motion.button
                className="rv-btn ghost"
                onClick={() => navigate("/create")}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                data-testid="btn-activate-from-anon"
              >
                Activer mon PasseportEtudiant
              </motion.button>
            )}
          </motion.div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
