import React from "react";
import StampCard from "./StampCard";

export default function StampGrid({ schools, stampsBySchool, slamId, halls, activeHall, onToggle }) {
  return (
    <div className="sl">
      {schools.map((school) => (
        <StampCard
          key={school.id}
          school={school}
          stamp={stampsBySchool[school.id]}
          slamId={slamId}
          activeHall={activeHall}
          halls={halls}
          onClick={onToggle}
        />
      ))}
    </div>
  );
}
