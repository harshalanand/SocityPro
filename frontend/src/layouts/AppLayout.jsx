import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { societiesApi } from '../api';
import { useEffect } from 'react';

// Reports sub-menu items
const REPORT_CHILDREN = [
  { path: '/reports',              label: 'Overview',       icon: '📊' },
  { path: '/reports/collection',   label: 'Collection',     icon: '💰' },
  { path: '/reports/defaulters',   label: 'Defaulters',     icon: '⚠️' },
  { path: '/reports/expenses',     label: 'Expenses',       icon: '📉' },
  { path: '/reports/budget',       label: 'Budget',         icon: '📋' },
  { path: '/reports/visitors',     label: 'Visitor Log',    icon: '🚪' },
  { path: '/reports/assets',       label: 'Asset Register', icon: '⚙️' },
  { path: '/reports/audit',        label: 'Audit Trail',    icon: '🔍' },
];

const NAV = [
  { path: '/dashboard',     label: 'Dashboard',     icon: '📊', roles: ['all'] },
  { path: '/societies',     label: 'Societies',     icon: '🏘️', roles: ['superadmin'] },
  { path: '/users',         label: 'Users',         icon: '👥', roles: ['superadmin', 'admin'] },
  { path: '/billing',       label: 'Billing',       icon: '💰', roles: ['all'] },
  { path: '/ledger',        label: 'Ledger',        icon: '📒', roles: ['all'] },
  { path: '/complaints',    label: 'Complaints',    icon: '🔧', roles: ['all'] },
  { path: '/visitors',      label: 'Visitors',      icon: '🚪', roles: ['all'] },
  { path: '/announcements', label: 'Announcements', icon: '📢', roles: ['all'] },
  { path: '/assets',        label: 'Assets',        icon: '⚙️',  roles: ['admin', 'superadmin'] },
  { path: '/vendors',       label: 'Vendors',       icon: '🤝', roles: ['admin', 'superadmin'] },
  { path: '/budget',        label: 'Budget',        icon: '📈', roles: ['admin', 'superadmin'] },
  { path: '/polls',         label: 'Polls',         icon: '🗳️', roles: ['all'] },
  {
    path: '/reports', label: 'Reports', icon: '📋', roles: ['admin', 'superadmin'],
    children: REPORT_CHILDREN,
  },
  { path: '/settings',      label: 'Settings',      icon: '⚙️',  roles: ['superadmin', 'admin'] },
];

export default function AppLayout() {
  const { user, logout, isSuperAdmin, sid, activeSocietyId, setActiveSocietyId } = useAuth();
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed]         = useState(false);
  const [reportsOpen, setReportsOpen]     = useState(pathname.startsWith('/reports'));
  const [societies, setSocieties]         = useState([]);

  // Load societies list for SuperAdmin selector
  useEffect(() => {
    if (isSuperAdmin) {
      societiesApi.list().then(r => setSocieties(r.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  const nav = NAV.filter(n => n.roles.includes('all') || n.roles.includes(user?.role));

  const isActive = (path) => {
    if (path === '/reports') return pathname === '/reports';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navBtn = (path, label, icon, isChild = false) => {
    const active = isActive(path);
    return (
      <button key={path} onClick={() => navigate(path)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 8, padding: collapsed ? '9px' : isChild ? '7px 12px 7px 36px' : '9px 12px',
          borderRadius: 'var(--radius-sm)', border: 'none',
          background: active ? 'var(--accent-glow)' : 'transparent',
          color: active ? 'var(--accent)' : isChild ? 'var(--text3)' : 'var(--text2)',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: isChild ? 12 : 13, fontWeight: active ? 700 : 500,
          marginBottom: 1, transition: 'all 0.15s',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderLeft: active && isChild ? '2px solid var(--accent)' : '2px solid transparent',
        }}>
        <span style={{ fontSize: isChild ? 12 : 15, minWidth: 18, textAlign: 'center' }}>{icon}</span>
        {!collapsed && <span>{label}</span>}
        {!collapsed && active && !isChild && (
          <div style={{ marginLeft: 'auto', width: 3, height: 14, background: 'var(--accent)', borderRadius: 2 }} />
        )}
      </button>
    );
  };

  const PAGE_TITLES = {
    '/dashboard': 'Dashboard', '/societies': 'Societies', '/users': 'User Management',
    '/billing': 'Billing', '/ledger': 'Financial Ledger', '/complaints': 'Complaints',
    '/visitors': 'Visitors', '/announcements': 'Announcements', '/assets': 'Asset Management',
    '/vendors': 'Vendors', '/budget': 'Budget Planning', '/polls': 'Polls & Voting',
    '/reports': 'Reports — Overview', '/reports/collection': 'Reports — Collection',
    '/reports/defaulters': 'Reports — Defaulters', '/reports/expenses': 'Reports — Expenses',
    '/reports/budget': 'Reports — Budget vs Actual', '/reports/visitors': 'Reports — Visitor Log',
    '/reports/assets': 'Reports — Asset Register', '/reports/audit': 'Reports — Audit Trail',
    '/settings': 'Settings',
  };
  const pageTitle = PAGE_TITLES[pathname] ?? 'SocietyPro';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: collapsed ? 64 : 240, minWidth: collapsed ? 64 : 240,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, minWidth: 34, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏠</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>SocietyPro</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>MANAGEMENT SYSTEM</div>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Logged in as</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>
              {user?.role} {user?.society_id ? '' : '(All Societies)'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {nav.map(n => {
            if (n.children) {
              const parentActive = pathname.startsWith('/reports');
              return (
                <div key={n.path}>
                  <button onClick={() => { setReportsOpen(o => !o); if (!reportsOpen) navigate(n.path); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 8, padding: collapsed ? '9px' : '9px 12px',
                      borderRadius: 'var(--radius-sm)', border: 'none',
                      background: parentActive ? 'var(--accent-glow)' : 'transparent',
                      color: parentActive ? 'var(--accent)' : 'var(--text2)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                      fontWeight: parentActive ? 700 : 500, marginBottom: 1,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}>
                    <span style={{ fontSize: 15, minWidth: 18, textAlign: 'center' }}>{n.icon}</span>
                    {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>}
                    {!collapsed && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{reportsOpen ? '▾' : '▸'}</span>}
                  </button>
                  {reportsOpen && !collapsed && (
                    <div style={{ marginBottom: 4 }}>
                      {n.children.map(c => navBtn(c.path, c.label, c.icon, true))}
                    </div>
                  )}
                </div>
              );
            }
            return navBtn(n.path, n.label, n.icon);
          })}
        </nav>

        {/* Collapse */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setCollapsed(c => !c)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ height: 54, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{pageTitle}</h1>
          </div>

          {/* SuperAdmin society switcher */}
          {isSuperAdmin && societies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>SOCIETY:</span>
              <select value={activeSocietyId}
                onChange={e => setActiveSocietyId(Number(e.target.value))}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Admin — show their society name (non-clickable) */}
          {!isSuperAdmin && user?.society_id && (
            <div style={{ padding: '4px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text2)', border: '1px solid var(--border)' }}>
              🏘️ {user?.society_name ?? `Society #${user.society_id}`}
            </div>
          )}

          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ display: 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.full_name}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
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
