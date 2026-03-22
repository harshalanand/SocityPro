import { useState, useEffect } from 'react';
import { budgetApi } from '../api';
import { StatCard, Card, Button, Table, fmt, PageLoader } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const FALLBACK = [
  { category:'Security',           planned:420000, actual:408000 },
  { category:'Housekeeping',        planned:180000, actual:175000 },
  { category:'Electricity',         planned:240000, actual:228000 },
  { category:'Repairs',             planned:120000, actual:168000 },
  { category:'Landscaping',         planned:60000,  actual:45000  },
  { category:'Admin & Misc',        planned:80000,  actual:72000  },
];

export default function BudgetPage() {
  const { user } = useAuth();
  const sid = user?.society_id ?? 1;
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetApi.list(sid).then((r) => setBudgets(r.data.length ? r.data : FALLBACK)).finally(() => setLoading(false));
  }, [sid]);

  const totalPlanned = budgets.reduce((s, b) => s + Number(b.planned ?? b.planned_amount), 0);
  const totalActual  = budgets.reduce((s, b) => s + Number(b.actual  ?? b.actual_amount),  0);

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Budget Planning</h2>
        <Button>+ Add Budget Line</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Planned" value={fmt(totalPlanned)} icon="📋" color="accent" />
        <StatCard label="Total Actual"  value={fmt(totalActual)}  icon="📊" color={totalActual>totalPlanned?'red':'green'} />
        <StatCard label="Variance"      value={fmt(totalPlanned-totalActual)} icon={totalActual>totalPlanned?'📉':'📈'} color={totalActual>totalPlanned?'red':'green'} />
      </div>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>Budget vs Actual — FY 2024-25</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={budgets} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="planned" fill="#4f7cff" name="Planned" radius={[4,4,0,0]} />
            <Bar dataKey="actual"  fill="#f97316" name="Actual"  radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
          {[['#4f7cff','Planned'],['#f97316','Actual']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
              <span style={{ color: 'var(--text2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
