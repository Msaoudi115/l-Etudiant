import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { getAnalytics } from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getAnalytics()
        .then((d) => {
          if (!cancelled) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const CONSENT_LABELS = {
    l: "l'Étudiant",
    d: "Diplomeo",
    c: "Partenaires",
    e: "Enquêtes",
  };

  const HALL_COLORS = ["#1A237E", "#E3000B", "#6D28D9", "#047857"];

  return (
    <div className="desk-shell">
      <div className="desk-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <img src={LOGO_URL} alt="l'Étudiant" style={{ height: 36, borderRadius: 6 }} />
          <div>
            <div className="desk-h1">Dashboard salon · temps réel</div>
            <div className="desk-sub">
              Vue l'Étudiant · actualisation auto toutes les 5s
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="sub-btn ghost"
            style={{ width: "auto", padding: "10px 18px" }}
            onClick={() => navigate("/")}
            data-testid="btn-analytics-back"
          >
            ← Retour au salon
          </button>
        </div>

        {loading || !data ? (
          <div className="desk-card">Chargement des statistiques…</div>
        ) : (
          <>
            <div className="desk-kpis" style={{ marginBottom: 16 }}>
              <div className="kpi red">
                <div className="kpi-label">Passeports activés</div>
                <div className="kpi-val" data-testid="kpi-total-students">
                  {data.total_students}
                </div>
                <div className="kpi-hint">profils individuels</div>
              </div>
              <div className="kpi navy">
                <div className="kpi-label">Tampons enregistrés</div>
                <div className="kpi-val">{data.total_stamps}</div>
                <div className="kpi-hint">visites trackées</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Classes inscrites</div>
                <div className="kpi-val">{data.total_classes}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Moy. tampons / élève</div>
                <div className="kpi-val">{data.avg_stamps}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="desk-card">
                <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>
                  Tampons par pôle
                </div>
                <div className="desk-sub" style={{ marginBottom: 12 }}>
                  Répartition des visites par univers
                </div>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.hall_counts} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(227,0,11,0.05)" }}
                        contentStyle={{ borderRadius: 10, border: "1px solid #eee" }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.hall_counts.map((h, i) => (
                          <Cell key={i} fill={h.color || HALL_COLORS[i % HALL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="desk-card">
                <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>
                  Top 5 stands
                </div>
                <div className="desk-sub" style={{ marginBottom: 12 }}>
                  Les écoles les plus visitées
                </div>
                {(data.top_schools || []).length === 0 ? (
                  <div className="muted">Pas encore de visite enregistrée.</div>
                ) : (
                  data.top_schools.map((s, i) => {
                    const max = Math.max(1, ...data.top_schools.map((x) => x.count));
                    const pct = Math.round((s.count / max) * 100);
                    return (
                      <div key={s.school_id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          <span>{i + 1}. {s.name}</span>
                          <span style={{ color: "var(--red)" }}>{s.count}</span>
                        </div>
                        <div style={{ height: 8, background: "#f5f5f5", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--red), #ff5b66)", borderRadius: 99, transition: "width 0.6s" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="desk-card">
                <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>
                  Filières déclarées
                </div>
                <div className="desk-sub" style={{ marginBottom: 12 }}>
                  Intentions des visiteurs
                </div>
                {(data.filieres_dist || []).length === 0 ? (
                  <div className="muted">Pas encore de donnée.</div>
                ) : (
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.filieres_dist} dataKey="count" nameKey="filiere" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {data.filieres_dist.map((_, i) => (
                            <Cell key={i} fill={["#E3000B", "#1A237E", "#6D28D9", "#047857", "#d97706", "#0891b2", "#db2777"][i % 7]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {(data.filieres_dist || []).map((f, i) => (
                    <span
                      key={f.filiere}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                        background: ["#E3000B", "#1A237E", "#6D28D9", "#047857", "#d97706", "#0891b2", "#db2777"][i % 7],
                        color: "white",
                      }}
                    >
                      {f.filiere} · {f.count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="desk-card">
                <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>
                  Consentements recueillis
                </div>
                <div className="desk-sub" style={{ marginBottom: 12 }}>
                  Opt-ins par levier (sur {data.total_students} élèves)
                </div>
                {Object.entries(data.consents || {}).map(([k, v]) => {
                  const pct = data.total_students > 0 ? Math.round((v / data.total_students) * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        <span>{CONSENT_LABELS[k]}</span>
                        <span>{v} · {pct}%</span>
                      </div>
                      <div style={{ height: 8, background: "#f5f5f5", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--green)", borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="desk-card">
              <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>
                Flux en direct
              </div>
              <div className="desk-sub" style={{ marginBottom: 12 }}>
                Les 10 dernières visites
              </div>
              {(data.recent || []).length === 0 ? (
                <div className="muted">Aucune activité récente.</div>
              ) : (
                (data.recent || []).map((r) => (
                  <div key={r.id} className="stu-row">
                    <div className="stu-av" style={{ background: "#fff0f0" }}>🔴</div>
                    <div>
                      <div className="stu-name">{r.school_name}</div>
                      <div className="stu-meta">Stand scanné · {r.time_label}</div>
                    </div>
                    <div />
                    <div className="muted" style={{ fontFamily: "Courier New, monospace", fontSize: 11 }}>
                      {new Date(r.timestamp).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
