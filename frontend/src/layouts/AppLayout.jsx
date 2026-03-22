/**
 * layouts/AppLayout.jsx
 * Shared shell: collapsible Sidebar + Header + <Outlet /> for page content.
 */
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { path: '/dashboard',     label: 'Dashboard',     icon: '📊', roles: ['all'] },
  { path: '/societies',     label: 'Societies',     icon: '🏘️', roles: ['superadmin'] },
  { path: '/users',         label: 'Users',         icon: '👥', roles: ['superadmin', 'admin'] },
  { path: '/billing',       label: 'Billing',       icon: '💰', roles: ['all'] },
  { path: '/ledger',        label: 'Ledger',        icon: '📒', roles: ['all'] },
  { path: '/complaints',    label: 'Complaints',    icon: '🔧', roles: ['all'] },
  { path: '/visitors',      label: 'Visitors',      icon: '🚪', roles: ['all'] },
  { path: '/announcements', label: 'Announcements', icon: '📢', roles: ['all'] },
  { path: '/assets',        label: 'Assets',        icon: '⚙️', roles: ['admin', 'superadmin'] },
  { path: '/vendors',       label: 'Vendors',       icon: '🤝', roles: ['admin', 'superadmin'] },
  { path: '/budget',        label: 'Budget',        icon: '📈', roles: ['admin', 'superadmin'] },
  { path: '/polls',         label: 'Polls',         icon: '🗳️', roles: ['all'] },
  { path: '/reports',       label: 'Reports',       icon: '📋', roles: ['admin', 'superadmin'] },
  { path: '/audit',         label: 'Audit Log',     icon: '🔍', roles: ['admin', 'superadmin'] },
  { path: '/settings',      label: 'Settings',      icon: '⚙️', roles: ['superadmin', 'admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const nav = NAV.filter(
    (n) => n.roles.includes('all') || n.roles.includes(user?.role)
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <div
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36, height: 36, minWidth: 36,
              background: 'var(--accent)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >🏠</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>SocietyPro</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>MANAGEMENT SYSTEM</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {nav.map((n) => {
            const active = pathname === n.path || (n.path !== '/' && pathname.startsWith(n.path));
            return (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  marginBottom: 2, transition: 'all 0.15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16, minWidth: 20, textAlign: 'center' }}>{n.icon}</span>
                {!collapsed && <span>{n.label}</span>}
                {!collapsed && active && (
                  <div style={{ marginLeft: 'auto', width: 3, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ fontSize: 14 }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            height: 58, background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {NAV.find((n) => pathname.startsWith(n.path) && n.path !== '/')?.label ?? 'SocietyPro'}
            </h1>
          </div>
          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32, height: 32, background: 'var(--accent)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}
            >
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.full_name}</div>
              <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 700 }}>{user?.role}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                marginLeft: 8, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'transparent', color: 'var(--text2)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
