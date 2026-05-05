import React from "react";

export default function StampSearchBar({
  halls,
  activeHall,
  onHallChange,
  availableVilles,
  filterVille,
  onVilleChange,
}) {
  return (
    <>
      {/* Secteur tabs (Tous + halls) */}
      <div className="hall-tabs">
        <button
          className={`htab ${activeHall === -1 ? "a" : ""}`}
          onClick={() => onHallChange(-1)}
          data-testid="hall-tab-tous"
        >
          Tous
        </button>
        {halls.map((h, i) => (
          <button
            key={h.id}
            className={`htab ${i === activeHall ? "a" : ""}`}
            onClick={() => onHallChange(i)}
            data-testid={`hall-tab-${h.id}`}
          >
            <span className="htab-dot" style={{ background: h.color }} />
            {h.label}
          </button>
        ))}
      </div>

      {/* Lieu filter chips */}
      {availableVilles.length > 1 && (
        <div
          style={{
            display: "flex", gap: 6, padding: "8px 16px",
            overflowX: "auto", borderBottom: "1px solid #f0f0f0",
            background: "white", flexShrink: 0,
          }}
        >
          <button
            onClick={() => onVilleChange(null)}
            style={{
              padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              border: "1.5px solid",
              borderColor: filterVille === null ? "var(--ink)" : "#e5e7eb",
              background: filterVille === null ? "var(--ink)" : "white",
              color: filterVille === null ? "white" : "#666",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            📍 Tous
          </button>
          {availableVilles.map((v) => (
            <button
              key={v}
              onClick={() => onVilleChange(filterVille === v ? null : v)}
              style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                border: "1.5px solid",
                borderColor: filterVille === v ? "var(--red)" : "#e5e7eb",
                background: filterVille === v ? "var(--red)" : "white",
                color: filterVille === v ? "white" : "#666",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
