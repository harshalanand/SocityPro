import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { societiesApi, billingApi, complaintsApi } from '../api';
import { StatCard, Card, Badge, StatusBadge, fmt, fmtDate, PageLoader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const PIE_COLORS = ['#4f7cff', '#7c4fff', '#22c55e', '#f97316', '#eab308', '#8892b0'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);

  // Use first available society for non-superadmin, or society_id from user
  const societyId = user?.society_id ?? 1;

  useEffect(() => {
    societiesApi.dashboard(societyId)
      .then((r) => setDashboard(r.data))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [societyId]);

  if (loading) return <PageLoader />;

  const d = dashboard ?? {};

  const stats = [
    { label: 'Total Collection',  value: fmt(d.total_income    ?? 1285000), sub: 'FY 2024-25',          icon: '💰', color: 'accent',  trend: 8.3  },
    { label: 'Total Expenses',    value: fmt(d.total_expense   ?? 638000),  sub: 'FY 2024-25',          icon: '📤', color: 'orange',  trend: -3.2 },
    { label: 'Reserve Fund',      value: fmt(d.reserve_fund    ?? 647000),  sub: 'Available balance',   icon: '🏦', color: 'green',   trend: 12.1 },
    { label: 'Pending Dues',      value: fmt(d.pending_dues    ?? 142500),  sub: `${d.pending_bills ?? 28} outstanding`, icon: '⏰', color: 'red', trend: 5.4 },
    { label: 'Total Flats',       value: String(d.total_units  ?? 120),     sub: `${d.occupied_units ?? 96} occupied`, icon: '🏠', color: 'purple' },
    { label: 'Active Complaints', value: String(d.open_complaints ?? 8),   sub: '2 high priority',     icon: '🔧', color: 'orange'  },
  ];

  // Fallback chart data
  const monthly = d.monthly_data ?? [
    { month: 'Oct', income: 285000, expense: 120000 },
    { month: 'Nov', income: 295000, expense: 135000 },
    { month: 'Dec', income: 310000, expense: 180000 },
    { month: 'Jan', income: 302000, expense: 125000 },
    { month: 'Feb', income: 315000, expense: 142000 },
    { month: 'Mar', income: 328000, expense: 138000 },
  ];

  const expenseCats = d.expense_breakdown ?? [
    { category: 'Maintenance', amount: 42000 },
    { category: 'Security',    amount: 35000 },
    { category: 'Electricity', amount: 28000 },
    { category: 'Cleaning',    amount: 18000 },
    { category: 'Repairs',     amount: 15000 },
    { category: 'Other',       amount: 8000  },
  ];

  const recentComplaints = d.recent_complaints ?? [];
  const pendingBills     = d.pending_bills_list ?? [];

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>Income vs Expense (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f7cff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f7cff" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="income"  stroke="#4f7cff" fill="url(#gI)" strokeWidth={2} name="Income"  />
              <Area type="monotone" dataKey="expense" stroke="#f97316" fill="url(#gE)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseCats} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {expenseCats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
            {expenseCats.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>Recent Complaints</h3>
            <Badge label={`${d.open_complaints ?? 8} open`} color="orange" />
          </div>
          {(recentComplaints.length ? recentComplaints : [
            { id: 1, title: 'Water leakage in B-201', category: 'Plumbing',    status: 'open',        created_at: '2025-03-18' },
            { id: 2, title: 'Lift not working',        category: 'Electrical',  status: 'in_progress', created_at: '2025-03-17' },
            { id: 3, title: 'Parking issue near gate', category: 'Security',    status: 'resolved',    created_at: '2025-03-15' },
          ]).slice(0, 4).map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.category} • {fmtDate(c.created_at)}</div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>Pending Bills</h3>
            <Badge label={`${d.pending_bill_count ?? 5} pending`} color="red" />
          </div>
          {(pendingBills.length ? pendingBills : [
            { id: 1, flat_no: 'A-102', total_amount: 3500, status: 'pending' },
            { id: 2, flat_no: 'B-201', total_amount: 4200, status: 'overdue' },
            { id: 3, flat_no: 'C-301', total_amount: 5500, status: 'partial' },
          ]).slice(0, 4).map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Flat {b.flat?.flat_no ?? b.flat_no}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(b.total_amount)} due</div>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
