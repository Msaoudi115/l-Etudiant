import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminStats, adminAllStudents, adminAllClasses,
  deleteStudent, deleteClass, adminReset,
} from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";
const ADMIN_KEY = "letudiant2026"; // demo key

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem("pe_admin") === "ok";
    } catch {
      return false;
    }
  });
  const [keyInput, setKeyInput] = useState("");
  const [keyErr, setKeyErr] = useState("");

  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [s, st, cl] = await Promise.all([
      adminStats(),
      adminAllStudents(),
      adminAllClasses(),
    ]);
    setStats(s);
    setStudents(st);
    setClasses(cl);
  };

  useEffect(() => {
    if (!authed) return;
    reload();
  }, [authed]);

  const submitKey = (e) => {
    e?.preventDefault?.();
    if (keyInput.trim() === ADMIN_KEY) {
      try {
        sessionStorage.setItem("pe_admin", "ok");
      } catch {}
      setAuthed(true);
      setKeyErr("");
    } else {
      setKeyErr("Clé invalide.");
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem("pe_admin");
    } catch {}
    setAuthed(false);
    setKeyInput("");
  };

  const onDeleteStudent = async (s) => {
    if (s.is_demo) return alert("Les profils démo sont protégés.");
    if (!window.confirm(`Supprimer ${s.name} ?`)) return;
    setBusy(true);
    try {
      await deleteStudent(s.id);
      await reload();
    } catch (e) {
      alert(e?.response?.data?.detail || "Échec suppression.");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteClass = async (c) => {
    if (c.code === "PROF2026" || c.code === "PROF2026B") {
      return alert("Les classes démo sont protégées.");
    }
    const cascade = window.confirm(
      `Supprimer la classe ${c.code} ?\n\n` +
        `[OK]  = supprimer AUSSI ses ${c.student_count} élève(s) + tampons\n` +
        `[Annuler] = retour`
    );
    if (!cascade) return;
    setBusy(true);
    try {
      await deleteClass(c.code, true);
      await reload();
    } catch (e) {
      alert(e?.response?.data?.detail || "Échec suppression.");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async (keepDemo) => {
    const msg = keepDemo
      ? "Effacer tous les profils créés et leurs tampons ? (les profils démo sont conservés)"
      : "⚠️ DANGER : effacer ABSOLUMENT tout (y compris démos) ? Le seed se relancera au prochain restart.";
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      const res = await adminReset(keepDemo);
      alert(
        `Reset effectué.\n` +
          `- Élèves supprimés : ${res.students_deleted}\n` +
          `- Tampons supprimés : ${res.stamps_deleted}\n` +
          `- Classes supprimées : ${res.classes_deleted}`
      );
      await reload();
    } catch (e) {
      alert("Échec du reset.");
    } finally {
      setBusy(false);
    }
  };

  if (!authed) {
    return (
      <div className="desk-shell">
        <div className="desk-wrap" style={{ maxWidth: 420 }}>
          <div className="desk-card">
            <div className="desk-h1" style={{ fontSize: 22 }}>🔐 Admin</div>
            <div className="desk-sub" style={{ marginBottom: 16 }}>
              Accès réservé — saisis la clé d'administration pour continuer.
            </div>
            <form onSubmit={submitKey}>
              <input
                type="password"
                className="fi"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Clé admin"
                autoFocus
                data-testid="admin-key-input"
              />
              {keyErr && <div className="inline-err" style={{ marginTop: 8 }}>{keyErr}</div>}
              <div className="spacer" />
              <button type="submit" className="sub-btn" data-testid="admin-login">
                Entrer
              </button>
              <div className="muted" style={{ marginTop: 10 }}>
                Démo : clé <strong>letudiant2026</strong>
              </div>
            </form>
            <div className="spacer" />
            <button
              className="sub-btn ghost"
              onClick={() => navigate("/")}
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = students.filter((s) => {
    if (!showDemo && s.is_demo) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.serial?.toLowerCase().includes(q) ||
      s.class_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="desk-shell">
      <div className="desk-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <img src={LOGO_URL} alt="l'Étudiant" style={{ height: 36, borderRadius: 6 }} />
          <div>
            <div className="desk-h1">🔐 Admin PasseportEtudiant</div>
            <div className="desk-sub">Gestion des profils, classes et données salon</div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="sub-btn ghost" style={{ width: "auto", padding: "10px 18px" }} onClick={() => navigate("/")}>
            ← Retour salon
          </button>
          <button className="sub-btn ghost" style={{ width: "auto", padding: "10px 18px" }} onClick={logout}>
            Déconnexion
          </button>
        </div>

        {stats && (
          <div className="desk-kpis" style={{ marginBottom: 16 }}>
            <div className="kpi red">
              <div className="kpi-label">Profils réels</div>
              <div className="kpi-val">{stats.students.real}</div>
              <div className="kpi-hint">{stats.students.demo} démos · {stats.students.anonymous} anonymes</div>
            </div>
            <div className="kpi navy">
              <div className="kpi-label">Tampons</div>
              <div className="kpi-val">{stats.stamps}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Classes</div>
              <div className="kpi-val">{stats.classes}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Écoles</div>
              <div className="kpi-val">{stats.schools}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            className="sub-btn"
            style={{ width: "auto", padding: "10px 16px", background: "var(--ink)" }}
            onClick={reload}
            disabled={busy}
            data-testid="admin-refresh"
          >
            ↻ Actualiser
          </button>
          <button
            className="sub-btn"
            style={{ width: "auto", padding: "10px 16px", background: "#f59e0b" }}
            onClick={() => onReset(true)}
            disabled={busy}
            data-testid="admin-reset-keep"
          >
            🧹 Reset (garder démos)
          </button>
          <button
            className="sub-btn"
            style={{ width: "auto", padding: "10px 16px", background: "#dc2626" }}
            onClick={() => onReset(false)}
            disabled={busy}
            data-testid="admin-reset-all"
          >
            ☢️ Reset TOTAL
          </button>
        </div>

        <div className="desk-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <div className="desk-h1" style={{ fontSize: 18 }}>Élèves ({filtered.length})</div>
            <div style={{ flex: 1 }} />
            <input
              className="fi"
              style={{ maxWidth: 240, padding: "8px 12px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, serial, code classe)"
              data-testid="admin-search"
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#555" }}>
              <input
                type="checkbox"
                checked={showDemo}
                onChange={(e) => setShowDemo(e.target.checked)}
                data-testid="admin-show-demo"
              />
              Inclure démos
            </label>
          </div>
          {filtered.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>
              Aucun élève à afficher.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    {["Emoji", "Nom", "Classe", "Filières", "Code", "Tampons", "Type", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 10, fontWeight: 800, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5" }} data-testid={`admin-stu-${s.id}`}>
                      <td style={{ padding: "10px 8px", fontSize: 22 }}>{s.emoji || "🧑"}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa", fontFamily: "Courier New, monospace" }}>{s.serial}</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 12, color: "#555" }}>{s.classe}</td>
                      <td style={{ padding: "10px 8px", fontSize: 12, color: "#555" }}>{(s.filieres || []).join(", ") || "—"}</td>
                      <td style={{ padding: "10px 8px", fontFamily: "Courier New, monospace", fontSize: 11, color: "#888" }}>{s.class_code || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800, color: "var(--red)" }}>{s.stamp_count}</td>
                      <td style={{ padding: "10px 8px" }}>
                        {s.is_anonymous ? (
                          <span className="badge ghost">Anonyme</span>
                        ) : s.is_demo ? (
                          <span className="badge ghost">Démo</span>
                        ) : (
                          <span className="badge green">Réel</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <button
                          onClick={() => onDeleteStudent(s)}
                          disabled={s.is_demo || busy}
                          style={{
                            background: s.is_demo ? "#f5f5f5" : "#fff0f0",
                            color: s.is_demo ? "#ccc" : "var(--red)",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontWeight: 800,
                            cursor: s.is_demo ? "not-allowed" : "pointer",
                            fontSize: 12,
                          }}
                          data-testid={`admin-del-${s.id}`}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="desk-card">
          <div className="desk-h1" style={{ fontSize: 18, marginBottom: 12 }}>Classes ({classes.length})</div>
          {classes.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>Aucune classe.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    {["Code", "Établissement", "Professeur", "Élèves", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: 10, fontWeight: 800, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const protectedCls = c.code === "PROF2026" || c.code === "PROF2026B";
                    return (
                      <tr key={c.code} style={{ borderBottom: "1px solid #f5f5f5" }} data-testid={`admin-cls-${c.code}`}>
                        <td style={{ padding: "10px 8px" }}>
                          <span className="code-pill" style={{ fontSize: 13, padding: "6px 12px" }}>{c.code}</span>
                        </td>
                        <td style={{ padding: "10px 8px", fontSize: 13 }}>{c.school_name}</td>
                        <td style={{ padding: "10px 8px", fontSize: 12, color: "#555" }}>{c.teacher_name}</td>
                        <td style={{ padding: "10px 8px", fontWeight: 800 }}>{c.student_count}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right" }}>
                          <button
                            onClick={() => onDeleteClass(c)}
                            disabled={protectedCls || busy}
                            style={{
                              background: protectedCls ? "#f5f5f5" : "#fff0f0",
                              color: protectedCls ? "#ccc" : "var(--red)",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontWeight: 800,
                              cursor: protectedCls ? "not-allowed" : "pointer",
                              fontSize: 12,
                            }}
                            data-testid={`admin-delcls-${c.code}`}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
