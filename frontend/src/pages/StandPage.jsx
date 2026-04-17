import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getSchool } from "@/lib/api";

const LOGO_URL = "https://birdeo.com/wp-content/uploads/2024/11/LOGo-letudiant.jpg";

export default function StandPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getSchool(schoolId)
      .then(setSchool)
      .catch(() => setErr("Stand introuvable"));
  }, [schoolId]);

  if (err) {
    return (
      <div className="stand-wrap">
        <div className="stand-title">Stand introuvable</div>
        <button className="sub-btn ghost" style={{ maxWidth: 280 }} onClick={() => navigate("/")}>
          ← Retour
        </button>
      </div>
    );
  }

  if (!school) return <div className="stand-wrap"><div className="stand-sub">Chargement…</div></div>;

  return (
    <div className="stand-wrap">
      <img src={LOGO_URL} alt="l'Étudiant" style={{ height: 36, borderRadius: 6, marginBottom: 20 }} />
      <div className="stand-eyebrow">Stand · Salon Orientation 2026</div>
      <div className="stand-title" data-testid="stand-school-name">{school.name}</div>
      <div className="stand-sub">{school.type}</div>
      <div className="stand-qr-card">
        <QRCodeSVG value={school.qr_token} size={240} level="H" fgColor="#1A237E" />
        <div style={{ textAlign: "center", maxWidth: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>
            Scanne pour valider
          </div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.45 }}>
            Ouvre ton PasseportEtudiant, onglet <strong>Tampons</strong>, appuie sur <strong>Scanner un stand</strong>.
          </div>
        </div>
      </div>
      <div className="stand-token" data-testid="stand-token">
        {school.qr_token}
      </div>
      <button
        style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        ← Retour
      </button>
    </div>
  );
}
