import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PassportProvider } from "@/context/PassportContext";
import SelectPage from "@/pages/SelectPage";
import CreatePage from "@/pages/CreatePage";
import CoverPage from "@/pages/CoverPage";
import IdentityPage from "@/pages/IdentityPage";
import StampsPage from "@/pages/StampsPage";
import RecapPage from "@/pages/RecapPage";
import TeacherPage from "@/pages/TeacherPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import StandPage from "@/pages/StandPage";
import AdminPage from "@/pages/AdminPage";
import RgpdPage from "@/pages/RgpdPage";

export default function App() {
  return (
    <PassportProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/passport" element={<Navigate to="/passport/cover" replace />} />
          <Route path="/passport/cover" element={<CoverPage />} />
          <Route path="/passport/identity" element={<IdentityPage />} />
          <Route path="/passport/stamps" element={<StampsPage />} />
          <Route path="/passport/recap" element={<RecapPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/teacher/:code" element={<TeacherPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/rgpd" element={<RgpdPage />} />
          <Route path="/stand/:schoolId" element={<StandPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PassportProvider>
  );
}
