import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { createClass, getClassStudents, getLeaderboard } from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

export default function TeacherPage() {
  const navigate = useNavigate();
  const { code: codeParam } = useParams();
  const [mode, setMode] = useState(codeParam ? "view" : "menu"); // menu | create | view
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState(codeParam || "");

  React.useEffect(() => {
    if (codeParam) {
      loadClass(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const onCreate = async () => {
    setErr("");
    if (!teacherName.trim() || !schoolName.trim()) {
      setErr("Renseigne ton nom et celui de ton établissement.");
      return;
    }
    setLoading(true);
    try {
      const cls = await createClass({
        teacher_name: teacherName.trim(),
        school_name: schoolName.trim(),
      });
      setClassInfo(cls);
      setStudents([]);
      setMode("view");
      navigate(`/teacher/${cls.code}`);
    } catch (e) {
      setErr("Impossible de créer la classe.");
    } finally {
      setLoading(false);
    }
  };

  const loadClass = async (code) => {
    setErr("");
    setLoading(true);
    try {
      const data = await getClassStudents(code.toUpperCase());
      setClassInfo(data.class);
      setStudents(data.students || []);
      setMode("view");
    } catch (e) {
      setErr("Code classe introuvable.");
      setClassInfo(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async () => {
    if (!inputCode.trim()) return setErr("Saisis un code.");
    navigate(`/teacher/${inputCode.trim().toUpperCase()}`);
  };

  return (
    <div className="desk-shell">
      <div className="desk-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <img src={LOGO_URL} alt="l'Étudiant" style={{ height: 36, borderRadius: 6 }} />
          <div>
            <div className="desk-h1">Espace professeur</div>
            <div className="desk-sub">
              Crée un code classe et suis les visites de tes élèves en direct.
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="sub-btn ghost" style={{ width: "auto", padding: "10px 18px" }} onClick={() => navigate("/")}>
            ← Retour au salon
          </button>
        </div>

        {mode === "menu" || (mode !== "view" && !classInfo) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <motion.div className="desk-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="desk-h1" style={{ fontSize: 20 }}>Créer une nouvelle classe</div>
              <div className="desk-sub">Obtiens un code à partager avec tes élèves.</div>
              <div className="spacer" />
              <div className="fg">
                <div className="fl">Ton nom</div>
                <input
                  className="fi"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ex : M. Bernard"
                  data-testid="teacher-name"
                />
              </div>
              <div className="spacer" />
              <div className="fg">
                <div className="fl">Établissement / classe</div>
                <input
                  className="fi"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ex : Lycée Henri-IV · Term. S3"
                  data-testid="teacher-school"
                />
              </div>
              {err && mode !== "view" ? <div className="inline-err">{err}</div> : null}
              <div className="spacer" />
              <button className="sub-btn" onClick={onCreate} disabled={loading} data-testid="btn-create-class">
                {loading ? "Création…" : "Générer un code classe"}
              </button>
            </motion.div>

            <motion.div className="desk-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="desk-h1" style={{ fontSize: 20 }}>Accéder à une classe</div>
              <div className="desk-sub">Entre le code pour voir tes élèves inscrits.</div>
              <div className="spacer" />
              <div className="fg">
                <div className="fl">Code classe</div>
                <input
                  className="fi"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ex : PROF2026"
                  style={{ letterSpacing: "0.1em", fontFamily: "Courier New, monospace", fontWeight: 700 }}
                  data-testid="teacher-code-input"
                />
              </div>
              <div className="spacer" />
              <button className="sub-btn dark" onClick={onJoin} data-testid="btn-access-class">
                Accéder au tableau de bord
              </button>
              <div className="muted" style={{ marginTop: 12 }}>
                Démo : utilise le code <strong>PROF2026</strong>
              </div>
            </motion.div>
          </div>
        ) : null}

        {mode === "view" && classInfo ? (
          <ClassDashboard classInfo={classInfo} students={students} err={err} loading={loading} onRefresh={() => loadClass(classInfo.code)} />
        ) : mode === "view" && err ? (
          <div className="desk-card">
            <div className="inline-err">{err}</div>
            <button className="sub-btn ghost" onClick={() => navigate("/teacher")} style={{ marginTop: 12 }}>
              ← Retour
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ClassDashboard({ classInfo, students, loading, onRefresh }) {
  const [leaderboard, setLeaderboard] = React.useState([]);
  React.useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [students]);

  const total = students.length;
  const withStamps = students.filter((s) => (s.stamp_count || 0) > 0).length;
  const avg = total > 0 ? (students.reduce((a, s) => a + (s.stamp_count || 0), 0) / total).toFixed(1) : "0";
  const myRank = leaderboard.find((r) => r.code === classInfo.code);

  return (
    <>
      <div className="desk-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="desk-h1" style={{ fontSize: 22 }} data-testid="teacher-class-name">
              {classInfo.school_name}
            </div>
            <div className="desk-sub">Prof : {classInfo.teacher_name}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Code à partager
            </div>
            <span className="code-pill" data-testid="teacher-class-code">
              {classInfo.code}
            </span>
          </div>
          <button className="sub-btn ghost" onClick={onRefresh} style={{ width: "auto", padding: "10px 18px" }} data-testid="btn-refresh-class">
            ↻ Actualiser
          </button>
        </div>
      </div>

      <div className="desk-kpis" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="kpi-label">Élèves inscrits</div><div className="kpi-val" data-testid="kpi-students">{total}</div></div>
        <div className="kpi red"><div className="kpi-label">Ont déjà tamponné</div><div className="kpi-val">{withStamps}</div><div className="kpi-hint">{total > 0 ? Math.round((withStamps / total) * 100) : 0}% de la classe</div></div>
        <div className="kpi navy"><div className="kpi-label">Tampons / élève</div><div className="kpi-val">{avg}</div><div className="kpi-hint">moyenne</div></div>
        <div className="kpi"><div className="kpi-label">Rang salon</div><div className="kpi-val" data-testid="kpi-rank">#{myRank?.rank ?? "—"}</div><div className="kpi-hint">sur {leaderboard.length} classes</div></div>
      </div>

      {leaderboard.length > 1 && (
        <div className="desk-card" style={{ marginBottom: 16 }}>
          <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>🏆 Classement des classes</div>
          <div className="desk-sub" style={{ marginBottom: 12 }}>
            Moyenne de tampons par élève — mis à jour en direct
          </div>
          {leaderboard.slice(0, 8).map((row) => {
            const mine = row.code === classInfo.code;
            const color = row.rank === 1 ? "#d97706" : row.rank === 2 ? "#6b7280" : row.rank === 3 ? "#b45309" : "#ccc";
            return (
              <div
                key={row.code}
                className="stu-row"
                style={{
                  background: mine ? "#fff8f8" : "transparent",
                  borderRadius: 10,
                  padding: "10px 12px",
                  borderBottom: "1px solid #f5f5f5",
                }}
                data-testid={`leaderboard-row-${row.code}`}
              >
                <div
                  className="stu-av"
                  style={{
                    background: row.rank <= 3 ? color : "#f5f5f5",
                    color: row.rank <= 3 ? "white" : "#999",
                    fontWeight: 900,
                    fontSize: 16,
                  }}
                >
                  #{row.rank}
                </div>
                <div>
                  <div className="stu-name">
                    {row.school_name}
                    {mine ? <span style={{ color: "var(--red)", marginLeft: 6 }}>· toi</span> : null}
                  </div>
                  <div className="stu-meta">
                    {row.teacher_name} · {row.students} élève{row.students > 1 ? "s" : ""}
                  </div>
                </div>
                <div>
                  <span className={`badge ${mine ? "red" : "ghost"}`}>{row.avg} / élève</span>
                </div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {row.stamps} tampons
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="desk-card">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div className="desk-h1" style={{ fontSize: 18 }}>Mes élèves</div>
          <div style={{ flex: 1 }} />
          {loading && <span className="muted">Chargement…</span>}
        </div>
        {total === 0 ? (
          <div className="uh" style={{ background: "#fafaf7" }}>
            <div style={{ fontSize: 30 }}>👋</div>
            <div className="uh-t">Aucun élève inscrit pour l'instant</div>
            <div className="uh-s">Partage ton code <strong>{classInfo.code}</strong> avec tes élèves pour qu'ils activent leur PasseportEtudiant.</div>
          </div>
        ) : (
          students.map((s) => (
            <div key={s.id} className="stu-row" data-testid={`stu-row-${s.id}`}>
              <div className="stu-av">{s.emoji || "🧑"}</div>
              <div>
                <div className="stu-name">{s.name}</div>
                <div className="stu-meta">
                  {s.classe} · {(s.filieres || []).join(", ") || "pas de filière"}
                </div>
              </div>
              <div>
                <span className={`badge ${s.stamp_count >= 3 ? "red" : s.stamp_count > 0 ? "green" : "ghost"}`}>
                  {s.stamp_count || 0} tampon{(s.stamp_count || 0) > 1 ? "s" : ""}
                </span>
              </div>
              <div className="muted" style={{ fontFamily: "Courier New, monospace", fontSize: 11 }}>
                {s.serial}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
