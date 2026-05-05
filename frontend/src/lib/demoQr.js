export const DEMO_QR_STUDENT_ID = "demo-lucas";

export const DEMO_QR_BOOTHS = [
  { schoolId: "s2", label: "Albert School booth" },
  { schoolId: "s4", label: "EPITA booth" },
  { schoolId: "s100", label: "Mines booth" },
];

export const buildDemoScanUrl = (origin, schoolId) =>
  `${origin}/scan/${schoolId}?student=${DEMO_QR_STUDENT_ID}`;

export const extractSchoolIdFromQr = (decoded) => {
  if (!decoded) return "";
  const value = String(decoded).trim();

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/scan\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    const match = value.match(/\/scan\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return value;
};
