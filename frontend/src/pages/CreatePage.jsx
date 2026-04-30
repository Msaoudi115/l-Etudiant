import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePassport } from "@/context/PassportContext";
import { BackIcon, LockIcon } from "@/components/icons";
import { createStudent } from "@/lib/api";

const EMOJIS = ["🧑", "👨", "👩", "🧑‍🎓", "👨‍🎓", "👩‍🎓", "😎", "🤓"];
const PROFILS = ["Terminale", "Étudiant", "Parent", "Professionnel"];
const FILIERES = [
  "Ingénierie",
  "Commerce",
  "Sciences Po",
  "Santé",
  "Arts",
  "Droit",
  "Numérique",
];
const FORMATIONS = [
  "École d'ingénieurs",
  "Grande École",
  "Université",
  "BTS / BUT",
  "Prépa CPGE",
  "IEP",
];

export default function CreatePage() {
  const navigate = useNavigate();
  const { selectStudent } = usePassport();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emoji, setEmoji] = useState("🧑");
  const [profil, setProfil] = useState("Terminale");
  const [filieres, setFilieres] = useState([]);
  const [formation, setFormation] = useState([]);
  const [classCode, setClassCode] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const onSubmit = async () => {
    setErr("");
    if (!firstName.trim()) return setErr("Ton prénom est requis.");
    setSubmitting(true);
    try {
      const payload = {
        name: (firstName.trim() + " " + lastName.trim()).trim(),
        emoji,
        classe: profil === "Terminale" ? "Terminale générale" : profil,
        filieres,
        formation,
        class_code: classCode.trim().toUpperCase(),
      };
      const student = await createStudent(payload);
      selectStudent(student.id);
      navigate("/passport/cover");
    } catch (e) {
      setErr(
        e?.response?.data?.detail ||
          "Impossible de créer ton PasseportEtudiant."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="top-bar">
          <button
            className="tb-back"
            onClick={() => navigate("/")}
            data-testid="btn-back"
          >
            <BackIcon />
          </button>
          <div className="tb-title">Activer mon PasseportEtudiant</div>
        </div>
        <div className="scroll-body">
          <motion.div
            className="cr-body"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
          >
            <motion.div
              className="guide-card"
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <div className="guide-step">Étape 1 / 2</div>
              <div className="guide-text">
                Tu as un code professeur ? Saisis-le pour rejoindre ta classe (ex :{" "}
                <strong>PROF2026</strong>). Sinon, laisse le champ vide et complète ton profil.
              </div>
            </motion.div>

            <motion.div
              className="fg"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="fl rowflex">
                <LockIcon /> Code professeur <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11, marginLeft: 4 }}>(facultatif)</span>
              </div>
              <input
                className="fi"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="Ex : PROF2026"
                style={{ letterSpacing: "0.1em", fontFamily: "Courier New, monospace", fontWeight: 700 }}
                data-testid="input-class-code"
              />
            </motion.div>

            <motion.div
              className="cr-sec"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              Ton identité
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Photo de profil (emoji)</div>
              <div className="emoji-grid">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`emoji-btn ${emoji === e ? "active" : ""}`}
                    onClick={() => setEmoji(e)}
                    data-testid={`emoji-${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Prénom</div>
              <input
                className="fi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ton prénom"
                data-testid="input-firstname"
              />
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Nom</div>
              <input
                className="fi"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ton nom"
                data-testid="input-lastname"
              />
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Profil</div>
              <div className="cg">
                {PROFILS.map((p) => (
                  <div
                    key={p}
                    className={`ch ${profil === p ? "s" : ""}`}
                    onClick={() => setProfil(p)}
                    data-testid={`profil-${p}`}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="cr-sec" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              Tes intérêts
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Filières</div>
              <div className="cg">
                {FILIERES.map((f) => (
                  <div
                    key={f}
                    className={`ch ${filieres.includes(f) ? "sr" : ""}`}
                    onClick={() => toggle(filieres, setFilieres, f)}
                    data-testid={`filiere-${f}`}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="fg" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <div className="fl">Type de formation</div>
              <div className="cg">
                {FORMATIONS.map((f) => (
                  <div
                    key={f}
                    className={`ch ${formation.includes(f) ? "sr" : ""}`}
                    onClick={() => toggle(formation, setFormation, f)}
                    data-testid={`formation-${f}`}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>

            {err ? <div className="inline-err" data-testid="create-error">{err}</div> : null}

            <motion.button
              className="sub-btn"
              onClick={onSubmit}
              disabled={submitting}
              whileTap={{ scale: 0.98 }}
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              data-testid="btn-create-passport"
            >
              {submitting ? "Activation en cours…" : "Activer mon passeport →"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
