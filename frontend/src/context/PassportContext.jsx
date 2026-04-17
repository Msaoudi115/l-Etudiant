import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getStudent, getStamps } from "@/lib/api";

const CURRENT_KEY = "passportCurrentStudentId_v1";

const PassportContext = createContext(null);

export function PassportProvider({ children }) {
  const [studentId, setStudentId] = useState(() => {
    try {
      return localStorage.getItem(CURRENT_KEY) || null;
    } catch {
      return null;
    }
  });
  const [student, setStudent] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStamps = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await getStamps(id);
      setStamps(data);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const reload = useCallback(async () => {
    if (!studentId) {
      setStudent(null);
      setStamps([]);
      return;
    }
    setLoading(true);
    try {
      const s = await getStudent(studentId);
      setStudent(s);
      const st = await getStamps(studentId);
      setStamps(st);
    } catch (e) {
      console.error("Student not found", e);
      setStudent(null);
      setStamps([]);
      try {
        localStorage.removeItem(CURRENT_KEY);
      } catch {}
      setStudentId(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selectStudent = (id) => {
    try {
      if (id) localStorage.setItem(CURRENT_KEY, id);
      else localStorage.removeItem(CURRENT_KEY);
    } catch {}
    setStudentId(id);
  };

  const clear = () => {
    try {
      localStorage.removeItem(CURRENT_KEY);
    } catch {}
    setStudent(null);
    setStamps([]);
    setStudentId(null);
  };

  return (
    <PassportContext.Provider
      value={{
        studentId,
        student,
        setStudent,
        stamps,
        setStamps,
        loading,
        selectStudent,
        loadStamps,
        reload,
        clear,
      }}
    >
      {children}
    </PassportContext.Provider>
  );
}

export const usePassport = () => {
  const ctx = useContext(PassportContext);
  if (!ctx) throw new Error("PassportProvider missing");
  return ctx;
};
