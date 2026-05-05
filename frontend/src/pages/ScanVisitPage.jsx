import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createStamp, getSchool } from "@/lib/api";
import { usePassport } from "@/context/PassportContext";

export default function ScanVisitPage() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const [params] = useSearchParams();
  const { studentId, selectStudent, loadStamps } = usePassport();
  const [school, setSchool] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Validation du scan...");
  const recordedRef = useRef(false);

  const targetStudentId = useMemo(
    () => params.get("student") || studentId,
    [params, studentId]
  );

  useEffect(() => {
    let cancelled = false;

    const recordVisit = async () => {
      if (recordedRef.current) return;
      if (!targetStudentId) {
        setStatus("needs-profile");
        setMessage("Choisis un passeport avant de scanner un stand.");
        return;
      }
      recordedRef.current = true;

      try {
        const schoolRow = await getSchool(schoolId);
        if (cancelled) return;
        setSchool(schoolRow);

        const result = await createStamp({
          student_id: targetStudentId,
          qr_token: schoolId,
        });
        if (cancelled) return;

        if (params.get("student")) {
          selectStudent(targetStudentId);
        }
        await loadStamps(targetStudentId);

        setStatus(result.duplicate ? "duplicate" : "success");
        setMessage(
          result.duplicate
            ? "Ce stand etait deja marque comme visite."
            : "Stand marque comme visite."
        );
      } catch (error) {
        recordedRef.current = false;
        if (cancelled) return;
        setStatus("error");
        setMessage(error?.response?.data?.detail || "Impossible de valider ce QR code.");
      }
    };

    recordVisit();
    return () => {
      cancelled = true;
    };
  }, [schoolId, targetStudentId, params, selectStudent, loadStamps]);

  const statusClass = status === "success" || status === "duplicate" ? "ok" : status;

  return (
    <div className="pe-shell">
      <div className="device">
        <div className="scanvisit">
          <div className={`scanvisit-mark ${statusClass}`}>
            {status === "loading" ? "..." : status === "error" ? "!" : status === "needs-profile" ? "?" : "OK"}
          </div>
          <div className="scanvisit-title">
            {school?.name || "Scan stand"}
          </div>
          <div className="scanvisit-sub">{message}</div>

          <div className="scanvisit-actions">
            {status === "needs-profile" ? (
              <button className="sub-btn" onClick={() => navigate("/")}>
                Choisir un passeport
              </button>
            ) : (
              <>
                <button className="sub-btn" onClick={() => navigate("/passport/stamps")}>
                  Voir mes tampons
                </button>
                <button className="sub-btn ghost" onClick={() => navigate("/analytics")}>
                  Voir le dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
