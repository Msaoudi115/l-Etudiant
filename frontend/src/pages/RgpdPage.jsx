import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { BackIcon, LockIcon } from "@/components/icons";
import { getRgpd, rgpdExportUrl, deleteStudent } from "@/lib/api";

/**
 * RGPD information about each consent — finalité, base légale,
 * destinataires, durée de conservation. Used as a design constraint:
 * each consent the student gives is fully transparent before signing.
 */
const RGPD_DETAILS = {
  l: {
    label: "Contenus personnalisés l'Étudiant",
    finalite:
      "Recommandations d'établissements, articles, JPO et alertes Parcoursup ciblées sur tes filières d'intérêt.",
    base: "Consentement explicite (RGPD Art. 6.1.a)",
    destinataires: "Editialis SAS (l'Étudiant) uniquement.",
    duree: "36 mois après ta dernière interaction, puis effacement automatique.",
    cookies: "Aucun cookie tiers.",
  },
  d: {
    label: "Contact Diplomeo — mise en relation",
    finalite:
      "Diplomeo te contacte par e-mail/SMS avec des écoles correspondant à ton profil. Tu reçois ~3 propositions/semaine maximum.",
    base: "Consentement explicite (RGPD Art. 6.1.a) + transfert intra-groupe encadré.",
    destinataires:
      "Diplomeo (filiale du groupe l'Étudiant). Aucune revente à des tiers.",
    duree:
      "24 mois après ta dernière interaction Diplomeo. Désinscription possible à tout moment via lien dans chaque message.",
    cookies: "Pixel de mesure d'ouverture e-mail.",
  },
  c: {
    label: "Offres partenaires (écoles inscrites au salon)",
    finalite:
      "Les écoles dont tu as scanné le stand peuvent te recontacter (mail uniquement) avec une invitation à leurs JPO ou un dossier de candidature.",
    base: "Consentement explicite (RGPD Art. 6.1.a). Limité aux écoles dont tu as scanné le QR.",
    destinataires:
      "Uniquement les établissements dont tu as un tampon validé. Liste consultable dans cette page.",
    duree: "12 mois post-salon, puis suppression automatique.",
    cookies: "Aucun.",
  },
  e: {
    label: "Enquêtes & études",
    finalite:
      "Sondages anonymisés sur ton expérience du salon, agrégés pour améliorer l'événement.",
    base: "Intérêt légitime de l'Étudiant (RGPD Art. 6.1.f) — données pseudonymisées.",
    destinataires: "Service études interne. Aucun transfert externe.",
    duree:
      "Réponses pseudonymisées immédiatement, conservées 5 ans en agrégé sans lien avec ton identité.",
    cookies: "Aucun.",
  },
};

const COLLECTED_FIELDS = [
  { key: "name", label: "Nom & prénom", reason: "Personnalisation du badge & du récap." },
  { key: "emoji", label: "Avatar emoji", reason: "Trombinoscope visuel non-identifiant." },
  { key: "classe", label: "Classe / niveau", reason: "Filtrage des établissements pertinents." },
  { key: "filieres", label: "Filières d'intérêt", reason: "Recommandations & lead scoring." },
  { key: "formation", label: "Type de formation visé", reason: "Recommandations." },
  { key: "class_code", label: "Code classe (rattachement prof)", reason: "Suivi pédagogique." },
  { key: "stamps", label: "Établissements scannés", reason: "Affichage du parcours & matching." },
];

export default function RgpdPage() {
  const navigate = useNavigate();
  const { student, loading, clear } = usePassport();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "ok" });

  useEffect(() => {
    if (!student) return;
    if (student.is_anonymous) return;
    getRgpd(student.id).then(setData).catch(() => setData(null));
  }, [student]);

  if (!student && !loading) {
    navigate("/", { replace: true });
    return null;
  }
  if (!student) return null;

  const isAnon = student.is_anonymous;

  const onDelete = async () => {
    const phrase = prompt(
      "Tu vas exercer ton droit à l'effacement (RGPD Art. 17).\n\n" +
        "Toutes tes données seront détruites définitivement et l'Étudiant\n" +
        "ne pourra plus jamais te recontacter.\n\n" +
        "Tape SUPPRIMER pour confirmer :"
    );
    if (phrase !== "SUPPRIMER") return;
    setBusy(true);
    try {
      await deleteStudent(student.id);
      clear();
      try {
        localStorage.clear();
      } catch {}
      alert("Compte supprimé. Toutes tes données ont été effacées.");
      navigate("/", { replace: true });
    } catch (e) {
      setToast({
        msg: e?.response?.data?.detail || "Suppression impossible.",
        type: "err",
      });
    } finally {
      setBusy(false);
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
          <div className="tb-title">Mon RGPD</div>
          <div className="tb-chip">
            <LockIcon size={10} /> Privacy
          </div>
        </div>
        <div className="scroll-body" style={{ background: "#fafaf7" }}>
          <motion.div
            style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {/* Hero strip */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              style={{
                background: "linear-gradient(135deg, #1A237E, #2a35a0)",
                color: "white",
                padding: 18,
                borderRadius: 14,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", opacity: 0.55, marginBottom: 6 }}>
                RGPD · ART. 13 / 15 / 17 / 20
              </div>
              <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.01em", marginBottom: 6 }}>
                Tes données, tes règles.
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, opacity: 0.85 }}>
                Le RGPD est traité comme une <strong>contrainte de design</strong>, pas comme un caveat.
                Toutes les finalités, bases légales, destinataires et durées de conservation sont visibles
                <em> avant </em> que tu signes.
              </div>
            </motion.div>

            {isAnon ? (
              <motion.div
                className="alert-card"
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <div className="alert-title">Profil anonyme — aucune donnée</div>
                <div className="alert-text">
                  Aucune donnée personnelle n'est collectée pour Théo. Le RGPD ne s'applique
                  pas — c'est précisément le problème : aucune valeur capturable pour l'Étudiant.
                </div>
              </motion.div>
            ) : (
              <>
                {/* Données collectées */}
                <motion.div
                  className="consent-card"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  data-testid="rgpd-collected"
                >
                  <div className="cc-header">📋 Données collectées sur toi</div>
                  <div style={{ padding: "8px 14px 14px" }}>
                    {COLLECTED_FIELDS.map((f) => {
                      let val = "—";
                      if (f.key === "stamps") {
                        val = `${data?.stamps?.length ?? 0} tampon${(data?.stamps?.length ?? 0) > 1 ? "s" : ""}`;
                      } else if (f.key === "filieres" || f.key === "formation") {
                        val = (student[f.key] || []).join(", ") || "—";
                      } else {
                        val = student[f.key] || "—";
                      }
                      return (
                        <div
                          key={f.key}
                          style={{
                            padding: "8px 0",
                            borderBottom: "1px solid #f4f1ea",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>
                              {f.label}
                            </div>
                            <div style={{ fontSize: 11, color: "#999", marginTop: 2, lineHeight: 1.4 }}>
                              {f.reason}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 12, fontWeight: 700, color: "var(--ink)",
                            background: "#f5f4ef", padding: "4px 10px", borderRadius: 99,
                            maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Détail par consentement */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <div className="cr-sec">🔐 Mes consentements (détail)</div>
                  <div style={{ fontSize: 12, color: "#888", margin: "2px 0 12px", lineHeight: 1.5 }}>
                    Pour chaque consentement : finalité, base légale, destinataires, durée.
                  </div>
                </motion.div>

                {Object.entries(RGPD_DETAILS).map(([k, info]) => {
                  const on = !!student.consents?.[k];
                  return (
                    <motion.div
                      key={k}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      style={{
                        background: "white",
                        borderRadius: 14,
                        border: `1.5px solid ${on ? "#bbf7d0" : "#eee"}`,
                        overflow: "hidden",
                      }}
                      data-testid={`rgpd-consent-${k}`}
                    >
                      <div
                        style={{
                          padding: "12px 14px",
                          background: on ? "#f0fdf4" : "#fafaf7",
                          borderBottom: "1px solid #f0ecdf",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div className={`cdot ${on ? "on" : "off"}`} />
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                          {info.label}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            padding: "3px 10px",
                            borderRadius: 99,
                            background: on ? "var(--green)" : "#e4e4e4",
                            color: on ? "white" : "#999",
                          }}
                        >
                          {on ? "ACCEPTÉ" : "REFUSÉ"}
                        </span>
                      </div>
                      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                        <RgpdRow label="Finalité" value={info.finalite} />
                        <RgpdRow label="Base légale" value={info.base} />
                        <RgpdRow label="Destinataires" value={info.destinataires} />
                        <RgpdRow label="Durée de conservation" value={info.duree} />
                        <RgpdRow label="Cookies / traceurs" value={info.cookies} />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Audit trail */}
                <motion.div
                  className="consent-card"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  data-testid="rgpd-audit"
                >
                  <div className="cc-header">📜 Historique de mes consentements (audit)</div>
                  <div style={{ padding: "10px 14px 14px" }}>
                    {(!data?.consent_audit || data.consent_audit.length === 0) ? (
                      <div className="muted" style={{ fontSize: 12, padding: "8px 0" }}>
                        Aucune modification depuis l'inscription. L'état actuel des
                        consentements correspond à ceux signés à l'activation du passeport.
                      </div>
                    ) : (
                      data.consent_audit.slice(0, 12).map((row) => (
                        <div
                          key={row.id}
                          style={{
                            padding: "8px 0",
                            borderBottom: "1px solid #f4f1ea",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 12,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "Courier New, monospace",
                              fontSize: 11,
                              color: "#888",
                              minWidth: 130,
                            }}
                          >
                            {new Date(row.timestamp).toLocaleString("fr-FR")}
                          </div>
                          <div style={{ flex: 1, color: "var(--ink)", fontWeight: 700 }}>
                            {RGPD_DETAILS[row.consent_key]?.label || row.consent_key}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: row.to ? "var(--green)" : "#dc2626",
                              color: "white",
                            }}
                          >
                            {row.to ? "OPT-IN" : "OPT-OUT"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Mes droits — actions */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  style={{ background: "white", border: "1px solid var(--cream3)", borderRadius: 14, padding: 16 }}
                >
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>
                    ⚖️ Mes droits RGPD
                  </div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 14 }}>
                    Tu peux exercer chacun de tes droits ci-dessous, sans justification, à tout moment.
                  </div>

                  <a
                    href={rgpdExportUrl(student.id)}
                    download
                    className="rv-btn"
                    style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 8, background: "var(--ink)" }}
                    data-testid="btn-rgpd-export"
                  >
                    📥 Exporter mes données (Art. 20 — portabilité)
                  </a>

                  <button
                    className="rv-btn"
                    onClick={() => navigate("/passport/identity")}
                    style={{ background: "white", color: "var(--ink)", border: "1.5px solid #e4e4e4", marginBottom: 8 }}
                    data-testid="btn-rgpd-edit"
                  >
                    ✏️ Modifier mes consentements (Art. 16)
                  </button>

                  <button
                    className="rv-btn"
                    onClick={onDelete}
                    disabled={busy}
                    style={{ background: "#dc2626" }}
                    data-testid="btn-rgpd-delete"
                  >
                    {busy ? "Suppression…" : "🗑️ Effacer définitivement mon compte (Art. 17)"}
                  </button>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    textAlign: "center",
                    lineHeight: 1.5,
                    padding: "4px 8px",
                  }}
                >
                  Responsable de traitement : Editialis SAS — l'Étudiant.
                  <br />
                  Réclamation possible auprès de la CNIL · cnil.fr
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
        <BottomNav />
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast({ msg: "", type: "ok" })}
        />
      </div>
    </div>
  );
}

function RgpdRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#aaa",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
