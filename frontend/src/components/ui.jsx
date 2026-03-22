/**
 * components/ui.jsx — Shared atomic components
 * Badge, StatCard, Button, Input, Select, Textarea, Modal, Table, Spinner, EmptyState
 */
import { useEffect } from 'react';

// ── Badge ────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  blue:   'background:#1e3a5f;color:#4f9eff',
  green:  'background:#14532d;color:#4ade80',
  red:    'background:#450a0a;color:#f87171',
  orange: 'background:#431407;color:#fb923c',
  yellow: 'background:#422006;color:#facc15',
  gray:   'background:#1f2937;color:#9ca3af',
  purple: 'background:#2e1065;color:#c084fc',
};

export function Badge({ label, color = 'blue', size = 'sm' }) {
  const style = Object.fromEntries(
    (BADGE_COLORS[color] || BADGE_COLORS.blue).split(';').map((s) => s.split(':'))
  );
  return (
    <span style={{
      ...style, borderRadius: 20, fontWeight: 600, display: 'inline-block',
      fontSize: size === 'sm' ? 11 : 12, padding: size === 'sm' ? '2px 8px' : '3px 10px',
    }}>
      {label}
    </span>
  );
}

const STATUS_MAP = {
  open:        ['open', 'red'],
  in_progress: ['in progress', 'orange'],
  resolved:    ['resolved', 'green'],
  closed:      ['closed', 'gray'],
  paid:        ['paid', 'green'],
  pending:     ['pending', 'orange'],
  overdue:     ['overdue', 'red'],
  partial:     ['partial', 'yellow'],
  checked_in:  ['in', 'green'],
  checked_out: ['out', 'gray'],
  active:      ['active', 'green'],
  inactive:    ['inactive', 'gray'],
  maintenance: ['maintenance', 'yellow'],
};
export function StatusBadge({ status }) {
  const [label, color] = STATUS_MAP[status] || [status, 'gray'];
  return <Badge label={label} color={color} />;
}

// ── StatCard ─────────────────────────────────────────────────────────────────
const STAT_COLORS = { accent: '#4f7cff', green: '#22c55e', red: '#ef4444', orange: '#f97316', purple: '#7c4fff' };

export function StatCard({ label, value, sub, icon, trend, color = 'accent' }) {
  const c = STAT_COLORS[color] || STAT_COLORS.accent;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 12px 0 80px', background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{icon}</div>
      <div style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{value}</div>
      {sub   && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>}
      {trend != null && (
        <div style={{ fontSize: 12, color: trend >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4, fontWeight: 600 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, ...style }}>
      {children}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:   { background: 'var(--accent)',   color: '#fff', border: 'none' },
  secondary: { background: 'var(--surface3)', color: 'var(--text)', border: '1px solid var(--border)' },
  danger:    { background: 'var(--red)',       color: '#fff', border: 'none' },
  ghost:     { background: 'transparent',      color: 'var(--text2)', border: 'none' },
  success:   { background: 'var(--green)',     color: '#fff', border: 'none' },
};
const BTN_SIZES = {
  sm: { fontSize: 12, padding: '6px 12px' },
  md: { fontSize: 13, padding: '9px 16px' },
  lg: { fontSize: 14, padding: '11px 20px' },
};

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {}, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...BTN_VARIANTS[variant], ...BTN_SIZES[size],
      borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', fontWeight: 600, opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s', ...style,
    }}>
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder = '', required, style = {}, onKeyDown }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
      )}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', ...style }}
      />
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, rows = 4, placeholder = '', required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
      )}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, loading }) {
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading…</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No data found</td></tr>
            : data.map((row, i) => (
              <tr key={row.id ?? i}
                onClick={() => onRowClick?.(row)}
                style={{ borderBottom: '1px solid var(--border)', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '12px 14px' }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 28 }) {
  return (
    <>
      <div style={{ width: size, height: size, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── PageLoader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  );
}

// ── Formatting helpers ───────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
