import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi, societiesApi } from '../../api';
import { fmt, fmtDate } from '../../components/ui';
import { SummaryCard } from './_shared';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIE_COLORS = ['#4f7cff','#22c55e','#f97316','#ef4444','#7c4fff','#eab308'];

export default function ReportsOverview() {
  const { sid } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash]     = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    societiesApi.dashboard(sid).then(r => setDash(r.data)).catch(() => {});
    billingApi.summary(sid, {}).then(r => setSummary(r.data)).catch(() => {});
  }, [sid]);

  const monthly = dash?.monthly_data ?? [
    { month:'Oct', income:285000, expense:120000 },
    { month:'Nov', income:295000, expense:135000 },
    { month:'Dec', income:310000, expense:180000 },
    { month:'Jan', income:302000, expense:125000 },
    { month:'Feb', income:315000, expense:142000 },
    { month:'Mar', income:328000, expense:138000 },
  ];
  const expCats = dash?.expense_breakdown ?? [
    { category:'Security', amount:42000 }, { category:'Electricity', amount:28000 },
    { category:'Cleaning', amount:18000 }, { category:'Repairs', amount:15000 },
    { category:'Other', amount:8000 },
  ];

  const REPORTS = [
    { path:'/reports/collection', label:'Collection Report',   icon:'💰', color:'#4f7cff', desc:'Monthly maintenance collection summary' },
    { path:'/reports/defaulters', label:'Defaulters List',     icon:'⚠️', color:'#ef4444', desc:'Flats with pending or overdue bills' },
    { path:'/reports/expenses',   label:'Expense Report',      icon:'📉', color:'#f97316', desc:'Category-wise expense breakdown' },
    { path:'/reports/budget',     label:'Budget vs Actual',    icon:'📈', color:'#22c55e', desc:'Planned vs actual comparison' },
    { path:'/reports/visitors',   label:'Visitor Log',         icon:'🚪', color:'#eab308', desc:'Daily/monthly visitor entry report' },
    { path:'/reports/assets',     label:'Asset Register',      icon:'⚙️', color:'#06b6d4', desc:'Complete inventory with valuations' },
    { path:'/reports/audit',      label:'Audit Trail',         icon:'🔍', color:'#7c4fff', desc:'Complete action history' },
  ];

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Reports & Analytics</h2>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Click any report card to view detailed data with charts and downloads.</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Total Collection" value={fmt(dash?.total_income ?? 1285000)} icon="💰" color="accent" onClick={() => navigate('/reports/collection')} sub="Click to view details" />
        <SummaryCard label="Total Expenses"   value={fmt(dash?.total_expense ?? 638000)} icon="📉" color="orange" onClick={() => navigate('/reports/expenses')} sub="Click to view details" />
        <SummaryCard label="Pending Dues"     value={fmt(dash?.pending_dues ?? 142500)}  icon="⏰" color="red"    onClick={() => navigate('/reports/defaulters')} sub="Click to view defaulters" />
        <SummaryCard label="Net Balance"      value={fmt((dash?.total_income ?? 1285000) - (dash?.total_expense ?? 638000))} icon="🏦" color="green" sub="Income minus expenses" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>Income vs Expense (6 Months)</h3>
            <button onClick={() => navigate('/reports/collection')}
              style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View Details →</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f7cff" stopOpacity={0.3}/><stop offset="95%" stopColor="#4f7cff" stopOpacity={0}/></linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="income"  stroke="#4f7cff" fill="url(#gI)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#f97316" fill="url(#gE)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>Expense Breakdown</h3>
            <button onClick={() => navigate('/reports/expenses')}
              style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View →</button>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={expCats} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={65} label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {expCats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 6 }}>
            {expCats.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report cards */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>All Reports</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 12 }}>
        {REPORTS.map(r => (
          <div key={r.path} onClick={() => navigate(r.path)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, background: `${r.color}20`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.4 }}>{r.desc}</p>
            <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>View report →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
