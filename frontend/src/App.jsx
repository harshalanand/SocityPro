import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LoginPage         = lazy(() => import('./pages/LoginPage'));
const AppLayout         = lazy(() => import('./layouts/AppLayout'));
const DashboardPage     = lazy(() => import('./pages/DashboardPage'));
const SocietiesPage     = lazy(() => import('./pages/SocietiesPage'));
const UsersPage         = lazy(() => import('./pages/UsersPage'));
const BillingPage       = lazy(() => import('./pages/BillingPage'));
const TransactionsPage  = lazy(() => import('./pages/TransactionsPage'));
const ComplaintsPage    = lazy(() => import('./pages/ComplaintsPage'));
const VisitorsPage      = lazy(() => import('./pages/VisitorsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AssetsPage        = lazy(() => import('./pages/AssetsPage'));
const VendorsPage       = lazy(() => import('./pages/VendorsPage'));
const BudgetPage        = lazy(() => import('./pages/BudgetPage'));
const PollsPage         = lazy(() => import('./pages/PollsPage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));

// Reports sub-pages
const ReportsOverview   = lazy(() => import('./pages/reports/ReportsOverview'));
const ReportCollection  = lazy(() => import('./pages/reports/ReportCollection'));
const ReportDefaulters  = lazy(() => import('./pages/reports/ReportDefaulters'));
const ReportExpenses    = lazy(() => import('./pages/reports/ReportExpenses'));
const ReportBudget      = lazy(() => import('./pages/reports/ReportBudget'));
const ReportVisitors    = lazy(() => import('./pages/reports/ReportVisitors'));
const ReportAssets      = lazy(() => import('./pages/reports/ReportAssets'));
const ReportAudit       = lazy(() => import('./pages/reports/ReportAudit'));

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13 } }} />
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
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
              <Route path="settings"      element={<RequireAuth roles={['admin','superadmin']}><SettingsPage /></RequireAuth>} />
              {/* Reports sub-routes */}
              <Route path="reports" element={<RequireAuth roles={['admin','superadmin']}><ReportsOverview /></RequireAuth>} />
              <Route path="reports/collection" element={<RequireAuth roles={['admin','superadmin']}><ReportCollection /></RequireAuth>} />
              <Route path="reports/defaulters" element={<RequireAuth roles={['admin','superadmin']}><ReportDefaulters /></RequireAuth>} />
              <Route path="reports/expenses"   element={<RequireAuth roles={['admin','superadmin']}><ReportExpenses /></RequireAuth>} />
              <Route path="reports/budget"     element={<RequireAuth roles={['admin','superadmin']}><ReportBudget /></RequireAuth>} />
              <Route path="reports/visitors"   element={<RequireAuth roles={['admin','superadmin']}><ReportVisitors /></RequireAuth>} />
              <Route path="reports/assets"     element={<RequireAuth roles={['admin','superadmin']}><ReportAssets /></RequireAuth>} />
              <Route path="reports/audit"      element={<RequireAuth roles={['admin','superadmin']}><ReportAudit /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
