import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavCoverIcon, NavIdIcon, NavStampIcon, NavRecapIcon } from "./icons";

const ITEMS = [
  { to: "/passport/cover", label: "Couv.", icon: NavCoverIcon, testid: "nav-cover" },
  { to: "/passport/identity", label: "Identité", icon: NavIdIcon, testid: "nav-identity" },
  { to: "/passport/stamps", label: "Tampons", icon: NavStampIcon, testid: "nav-stamps" },
  { to: "/passport/recap", label: "Récap", icon: NavRecapIcon, testid: "nav-recap" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const loc = useLocation();
  return (
    <div className="bnav">
      {ITEMS.map((it) => {
        const active = loc.pathname.startsWith(it.to);
        const Icon = it.icon;
        return (
          <button
            key={it.to}
            className={`nb ${active ? "a" : ""}`}
            onClick={() => navigate(it.to)}
            data-testid={it.testid}
          >
            <Icon />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
