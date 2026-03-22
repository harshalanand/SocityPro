import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('admin@societypro.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(79,124,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(124,79,255,0.06) 0%, transparent 60%)' }} />
      <div style={{ width: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px' }}>🏠</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>SocietyPro</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Society Management System</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32 }}>
          <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="admin@societypro.com" />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />

          {error && (
            <div style={{ background: '#450a0a', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 13, color: '#f87171', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '11px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text3)' }}>
            <strong style={{ color: 'var(--text2)' }}>Default credentials:</strong><br />
            Email: admin@societypro.com<br />Password: Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, onKeyDown }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
      />
    </div>
  );
}
