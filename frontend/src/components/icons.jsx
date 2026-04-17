import React from "react";

export const BackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const NavCoverIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="2" width="7" height="9" rx="1.5" />
    <rect x="11" y="2" width="7" height="6" rx="1.5" />
    <rect x="2" y="13" width="7" height="5" rx="1.5" />
    <rect x="11" y="10" width="7" height="8" rx="1.5" />
  </svg>
);

export const NavIdIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <circle cx="8" cy="7" r="4" />
    <path d="M1 17c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    <rect x="13" y="11" width="6" height="2" rx="1" />
    <rect x="13" y="15" width="4" height="2" rx="1" />
  </svg>
);

export const NavStampIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <circle cx="5.5" cy="5.5" r="3.5" />
    <circle cx="14.5" cy="5.5" r="3.5" />
    <circle cx="5.5" cy="14.5" r="3.5" />
    <circle cx="14.5" cy="14.5" r="3.5" />
  </svg>
);

export const NavRecapIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="2" width="16" height="3" rx="1.5" />
    <rect x="2" y="8" width="11" height="3" rx="1.5" />
    <rect x="2" y="14" width="13" height="3" rx="1.5" />
  </svg>
);

export const ScanIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3" />
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.6" />
  </svg>
);

export const LockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const TeacherIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19V8l8-4 8 4v11" />
    <path d="M8 19v-6h8v6" />
    <path d="M12 4v4" />
  </svg>
);

export const ChartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 4 3 5-7" />
  </svg>
);
