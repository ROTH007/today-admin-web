import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { NewsListPage } from "./pages/NewsListPage";
import { NewsFormPage } from "./pages/NewsFormPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { EventsFormPage } from "./pages/EventsFormPage";
import { PageContentListPage } from "./pages/PageContentListPage";
import { PageContentEditPage } from "./pages/PageContentEditPage";
import { SectionEditPage } from "./pages/SectionEditPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/new" element={<NewsFormPage />} />
            <Route path="/news/:id" element={<NewsFormPage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<EventsFormPage />} />
            <Route path="/events/:id" element={<EventsFormPage />} />
            <Route path="/page-content" element={<PageContentListPage />} />
            <Route path="/page-content/:pageKey" element={<PageContentEditPage />} />
            <Route path="/page-content/:pageKey/:blockKey" element={<SectionEditPage />} />
            <Route
              path="/users"
              element={
                <RequireAuth roles={["super_admin", "admin"]}>
                  <UsersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <RequireAuth roles={["super_admin", "admin"]}>
                  <AuditLogsPage />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}