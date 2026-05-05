import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { getAnalytics, getLeads, leadsCsvUrl } from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

const FILIERES = ["Ingénierie", "Commerce", "Sciences Po", "Santé", "Arts", "Droit", "Numérique"];
const CONSENT_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "l", label: "l'Étudiant" },
  { value: "d", label: "Diplomeo" },
  { value: "c", label: "Partenaires" },
  { value: "e", label: "Enquêtes" },
];
const CONSENT_LABELS = { l: "l'Étudiant", d: "Diplomeo", c: "Partenaires", e: "Enquêtes" };
const HALL_COLORS = ["#1A237E", "#E3000B", "#6D28D9", "#047857"];
const PIE_COLORS = ["#E3000B", "#1A237E", "#6D28D9", "#047857", "#d97706", "#0891b2", "#db2777"];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview"); // overview | leads
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Leads state
  const [filiere, setFiliere] = useState("all");
  const [consent, setConsent] = useState("all");
  const [minStamps, setMinStamps] = useState(0);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

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

  const loadLeads = () => {
    setLeadsLoading(true);
    getLeads({ filiere, consent, min_stamps: minStamps })
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false));
  };

  useEffect(() => {
    if (tab === "leads") loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filiere, consent, minStamps]);

  return (
    <div className="desk-shell">
      <div className="desk-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <img src={LOGO_URL} alt="l'Étudiant" style={{ height: 36, borderRadius: 6 }} />
          <div>
            <div className="desk-h1">Dashboard salon · temps réel</div>
            <div className="desk-sub">
              Vue l'Étudiant · {tab === "overview" ? "actualisation auto 5s" : "leads qualifiés"}
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

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`ch ${tab === "overview" ? "s" : ""}`}
            style={{ padding: "10px 18px", fontSize: 14 }}
            onClick={() => setTab("overview")}
            data-testid="tab-overview"
          >
            Vue d'ensemble
          </button>
          <button
            className={`ch ${tab === "leads" ? "sr" : ""}`}
            style={{ padding: "10px 18px", fontSize: 14 }}
            onClick={() => setTab("leads")}
            data-testid="tab-leads"
          >
            🎯 Leads qualifiés
          </button>
        </div>

        {tab === "overview" && (
          loading || !data ? (
            <div className="desk-card">Chargement des statistiques…</div>
          ) : (
            <>
              <div className="desk-kpis" style={{ marginBottom: 16 }}>
                <div className="kpi red">
                  <div className="kpi-label">Passeports activés</div>
                  <div className="kpi-val" data-testid="kpi-total-students">{data.total_students}</div>
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

              <div className="desk-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Demo QR booths</div>
                    <div className="desk-sub">Albert, EPITA and Mines scan status for the board demo</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <button
                    className="sub-btn ghost"
                    style={{ width: "auto", padding: "10px 16px" }}
                    onClick={() => navigate("/demo-qr")}
                  >
                    Open QR board
                  </button>
                </div>
                <div className="demo-status-grid">
                  {(data.demo_booths || []).map((booth) => (
                    <div className={`demo-status-card ${booth.visited ? "visited" : ""}`} key={booth.school_id}>
                      <div className="demo-status-dot">{booth.visited ? "OK" : ""}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="demo-status-label">{booth.label}</div>
                        <div className="demo-status-name">{booth.name}</div>
                        <div className="demo-status-meta">
                          {booth.visited ? `Visited at ${booth.time_label}` : "Waiting for scan"}
                          {` - ${booth.total_visits} total visit${booth.total_visits > 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div className="desk-card">
                  <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Tampons par pôle</div>
                  <div className="desk-sub" style={{ marginBottom: 12 }}>Répartition des visites par univers</div>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.hall_counts} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: "rgba(227,0,11,0.05)" }} contentStyle={{ borderRadius: 10, border: "1px solid #eee" }} />
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
                  <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Top 5 stands</div>
                  <div className="desk-sub" style={{ marginBottom: 12 }}>Les écoles les plus visitées</div>
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
                  <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Filières déclarées</div>
                  <div className="desk-sub" style={{ marginBottom: 12 }}>Intentions des visiteurs</div>
                  {(data.filieres_dist || []).length === 0 ? (
                    <div className="muted">Pas encore de donnée.</div>
                  ) : (
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={data.filieres_dist} dataKey="count" nameKey="filiere" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {data.filieres_dist.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
                          background: PIE_COLORS[i % PIE_COLORS.length],
                          color: "white",
                        }}
                      >
                        {f.filiere} · {f.count}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="desk-card">
                  <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Consentements recueillis</div>
                  <div className="desk-sub" style={{ marginBottom: 12 }}>Opt-ins par levier (sur {data.total_students} élèves)</div>
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
                <div className="desk-h1" style={{ fontSize: 18, marginBottom: 4 }}>Flux en direct</div>
                <div className="desk-sub" style={{ marginBottom: 12 }}>Les 10 dernières visites</div>
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
          )
        )}

        {tab === "leads" && (
          <LeadsPanel
            filiere={filiere}
            setFiliere={setFiliere}
            consent={consent}
            setConsent={setConsent}
            minStamps={minStamps}
            setMinStamps={setMinStamps}
            leads={leads}
            leadsLoading={leadsLoading}
          />
        )}
      </div>
    </div>
  );
}

function LeadsPanel({ filiere, setFiliere, consent, setConsent, minStamps, setMinStamps, leads, leadsLoading }) {
  const csvHref = leadsCsvUrl({ filiere, consent, min_stamps: minStamps });

  return (
    <>
      <div className="desk-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div className="desk-h1" style={{ fontSize: 20 }}>Leads qualifiés</div>
            <div className="desk-sub">
              {leadsLoading ? "Chargement…" : `${leads.length} profil${leads.length > 1 ? "s" : ""} correspond${leads.length > 1 ? "ent" : ""} aux filtres`}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <a
            href={csvHref}
            download
            className="sub-btn"
            style={{
              width: "auto",
              padding: "12px 18px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            data-testid="btn-export-csv"
          >
            📥 Exporter CSV
          </a>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <div className="fg" style={{ minWidth: 180 }}>
            <div className="fl">Filière</div>
            <select
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
              className="fi"
              data-testid="leads-filiere"
              style={{ background: "white" }}
            >
              <option value="all">Toutes</option>
              {FILIERES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="fg" style={{ minWidth: 180 }}>
            <div className="fl">Consentement</div>
            <select
              value={consent}
              onChange={(e) => setConsent(e.target.value)}
              className="fi"
              data-testid="leads-consent"
              style={{ background: "white" }}
            >
              {CONSENT_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="fg" style={{ minWidth: 180 }}>
            <div className="fl">Tampons min</div>
            <input
              type="number"
              min={0}
              max={20}
              value={minStamps}
              onChange={(e) => setMinStamps(parseInt(e.target.value, 10) || 0)}
              className="fi"
              data-testid="leads-minstamps"
            />
          </div>
        </div>
      </div>

      <div className="desk-card">
        {leads.length === 0 ? (
          <div className="uh">
            <div style={{ fontSize: 30 }}>🔍</div>
            <div className="uh-t">Aucun lead sur ces critères</div>
            <div className="uh-s">Élargis ta sélection (baisse le minimum de tampons ou retire un consentement).</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  {["Score", "Nom", "Classe", "Filières", "Tampons", "Consents"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#999",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const cs = Object.entries(l.consents || {}).filter(([, v]) => v).map(([k]) => k);
                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid #f5f5f5" }} data-testid={`lead-row-${l.id}`}>
                      <td style={{ padding: "12px 8px" }}>
                        <span
                          className="badge"
                          style={{
                            background: l.score >= 80 ? "var(--red)" : l.score >= 60 ? "var(--navy)" : "#999",
                          }}
                        >
                          {l.score}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa", fontFamily: "Courier New, monospace" }}>{l.serial}</div>
                      </td>
                      <td style={{ padding: "12px 8px", fontSize: 12, color: "#555" }}>
                        {l.classe}
                        {l.class_code ? <div style={{ fontSize: 10, color: "#aaa" }}>{l.class_code}</div> : null}
                      </td>
                      <td style={{ padding: "12px 8px", fontSize: 12, color: "#555" }}>
                        {(l.filieres || []).join(", ") || <span className="muted">—</span>}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: 800, color: "var(--red)" }}>{l.stamp_count}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {["l", "d", "c", "e"].map((k) => (
                            <span
                              key={k}
                              title={CONSENT_LABELS[k]}
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: "3px 7px",
                                borderRadius: 99,
                                background: cs.includes(k) ? "var(--green)" : "#eee",
                                color: cs.includes(k) ? "white" : "#bbb",
                              }}
                            >
                              {k.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
