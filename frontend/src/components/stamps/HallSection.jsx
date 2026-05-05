import React from "react";
import StampGrid from "./StampGrid";

export default function HallSection({
  currentHall,
  filterVille,
  visibleSchools,
  stampsBySchool,
  slamId,
  halls,
  activeHall,
  onToggle,
}) {
  if (visibleSchools.length === 0) {
    return (
      <div className="es">
        <div className="es-i">🔍</div>
        <div className="es-t">Aucun établissement</div>
        <div className="es-s">Essaie un autre lieu ou secteur.</div>
      </div>
    );
  }

  return (
    <>
      <div className="hh">
        {currentHall && <div className="hd" style={{ background: currentHall.color }} />}
        <div className="hn">
          {currentHall ? currentHall.label : "Tous les secteurs"}
          {filterVille && (
            <span style={{ fontWeight: 400, color: "#888", fontSize: 11, marginLeft: 6 }}>
              · {filterVille}
            </span>
          )}
        </div>
        <div className="hc">
          {visibleSchools.filter((s) => stampsBySchool[s.id]).length}/{visibleSchools.length}
        </div>
      </div>
      <StampGrid
        schools={visibleSchools}
        stampsBySchool={stampsBySchool}
        slamId={slamId}
        halls={halls}
        activeHall={activeHall}
        onToggle={onToggle}
      />
    </>
  );
}
