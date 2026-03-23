import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui';

export function ReportPage({ title, icon, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/reports')}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          ← Back
        </button>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function DownloadBar({ sid, endpoint, label }) {
  const download = (fmt) => window.open(`/api/societies/${sid}/reports/${endpoint}?fmt=${fmt}`, '_blank');
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      <Button variant="secondary" onClick={() => download('xlsx')}>📥 Download Excel</Button>
      <Button variant="secondary" onClick={() => download('pdf')}>📄 Download PDF</Button>
    </div>
  );
}

export function SummaryCard({ label, value, sub, icon, color = 'accent', onClick }) {
  const COLORS = { accent: '#4f7cff', green: '#22c55e', red: '#ef4444', orange: '#f97316', purple: '#7c4fff' };
  const c = COLORS[color] || COLORS.accent;
  return (
    <div onClick={onClick}
      style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 'var(--radius)', padding: 18, position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.15s, transform 0.1s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = c; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: '0 12px 0 70px', background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}
