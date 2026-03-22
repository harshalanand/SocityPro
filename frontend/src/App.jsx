/**
 * App.jsx — Root component + React Router setup
 *
 * Route layout:
 *   /login                     LoginPage
 *   /                          → redirect to /dashboard
 *   /dashboard                 DashboardPage
 *   /societies                 SocietiesPage          (superadmin)
 *   /users                     UsersPage              (admin+)
 *   /billing                   BillingPage
 *   /ledger                    TransactionsPage
 *   /complaints                ComplaintsPage
 *   /visitors                  VisitorsPage
 *   /announcements             AnnouncementsPage
 *   /assets                    AssetsPage             (admin+)
 *   /vendors                   VendorsPage            (admin+)
 *   /budget                    BudgetPage             (admin+)
 *   /polls                     PollsPage
 *   /reports                   ReportsPage            (admin+)
 *   /audit                     AuditPage              (admin+)
 *   /settings                  SettingsPage           (admin+)
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ── Lazy-loaded pages (all live in src/pages/) ──────────────────────────────
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const AppLayout        = lazy(() => import('./layouts/AppLayout'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const SocietiesPage    = lazy(() => import('./pages/SocietiesPage'));
const UsersPage        = lazy(() => import('./pages/UsersPage'));
const BillingPage      = lazy(() => import('./pages/BillingPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const ComplaintsPage   = lazy(() => import('./pages/ComplaintsPage'));
const VisitorsPage     = lazy(() => import('./pages/VisitorsPage'));
const AnnouncementsPage= lazy(() => import('./pages/AnnouncementsPage'));
const AssetsPage       = lazy(() => import('./pages/AssetsPage'));
const VendorsPage      = lazy(() => import('./pages/VendorsPage'));
const BudgetPage       = lazy(() => import('./pages/BudgetPage'));
const PollsPage        = lazy(() => import('./pages/PollsPage'));
const ReportsPage      = lazy(() => import('./pages/ReportsPage'));
const AuditPage        = lazy(() => import('./pages/AuditPage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));

// ── Guards ──────────────────────────────────────────────────────────────────
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 13,
            },
          }}
        />
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — wrapped in shared layout */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<DashboardPage />} />
              <Route path="societies"     element={<RequireAuth roles={['superadmin']}><SocietiesPage /></RequireAuth>} />
              <Route path="users"         element={<RequireAuth roles={['admin','superadmin']}><UsersPage /></RequireAuth>} />
              <Route path="billing"       element={<BillingPage />} />
              <Route path="ledger"        element={<TransactionsPage />} />
              <Route path="complaints"    element={<ComplaintsPage />} />
              <Route path="visitors"      element={<VisitorsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="assets"        element={<RequireAuth roles={['admin','superadmin']}><AssetsPage /></RequireAuth>} />
              <Route path="vendors"       element={<RequireAuth roles={['admin','superadmin']}><VendorsPage /></RequireAuth>} />
              <Route path="budget"        element={<RequireAuth roles={['admin','superadmin']}><BudgetPage /></RequireAuth>} />
              <Route path="polls"         element={<PollsPage />} />
              <Route path="reports"       element={<RequireAuth roles={['admin','superadmin']}><ReportsPage /></RequireAuth>} />
              <Route path="audit"         element={<RequireAuth roles={['admin','superadmin']}><AuditPage /></RequireAuth>} />
              <Route path="settings"      element={<RequireAuth roles={['admin','superadmin']}><SettingsPage /></RequireAuth>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
