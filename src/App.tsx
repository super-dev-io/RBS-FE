import { Navigate, Route, Routes } from "react-router-dom";
import { RedirectIfAuthed, RequireAuth } from "./components/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";

import LoginPage from "./pages/auth/LoginPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBidders from "./pages/admin/AdminBidders";
import AdminProfiles from "./pages/admin/AdminProfiles";
import AdminProfileDetail from "./pages/admin/AdminProfileDetail";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminTemplateEditor from "./pages/admin/AdminTemplateEditor";
import AdminWorkLogs from "./pages/admin/AdminWorkLogs";

import BidderDashboard from "./pages/bidder/BidderDashboard";
import BidderProfiles from "./pages/bidder/BidderProfiles";
import BidderGenerate from "./pages/bidder/BidderGenerate";
import BidderFolders from "./pages/bidder/BidderFolders";
import BidderGenerationDetail from "./pages/bidder/BidderGenerationDetail";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth role="ADMIN">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="bidders" element={<AdminBidders />} />
        <Route path="profiles" element={<AdminProfiles />} />
        <Route path="profiles/:id" element={<AdminProfileDetail />} />
        <Route path="templates" element={<AdminTemplates />} />
        <Route path="templates/new" element={<AdminTemplateEditor />} />
        <Route path="templates/:id" element={<AdminTemplateEditor />} />
        <Route path="work-logs" element={<AdminWorkLogs />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireAuth role="BIDDER">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<BidderDashboard />} />
        <Route path="profiles" element={<BidderProfiles />} />
        <Route path="generate" element={<BidderGenerate />} />
        <Route path="folders" element={<BidderFolders />} />
        <Route path="history" element={<Navigate to="/app/folders" replace />} />
        <Route path="generations/:id" element={<BidderGenerationDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
