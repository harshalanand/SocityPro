import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { budgetApi } from '../../api';
import { Table, fmt, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportBudget() {
  const { sid } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [fy, setFy] = useState('2024-25');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetApi.list(sid, { financial_year: fy }).then(r => setBudgets(r.data)).finally(() => setLoading(false));
  }, [sid, fy]);

  const totalPlanned = budgets.reduce((s,b) => s + Number(b.planned_amount), 0);
  const totalActual  = budgets.reduce((s,b) => s + Number(b.actual_amount), 0);
  const variance     = totalPlanned - totalActual;

  const cols = [
    { key:'category',       label:'Category'   },
    { key:'financial_year', label:'FY'          },
    { key:'planned_amount', label:'Planned',  render:v => fmt(v) },
    { key:'actual_amount',  label:'Actual',   render:v => fmt(v) },
    { key:'planned_amount', label:'Variance', render:(v,r) => {
        const diff = Number(v) - Number(r.actual_amount);
        return <span style={{color:diff>=0?'var(--green)':'var(--red)', fontWeight:600}}>{diff>=0?'▲':'▼'} {fmt(Math.abs(diff))}</span>;
    }},
    { key:'planned_amount', label:'% Used', render:(v,r) => {
        const pct = Number(v) ? ((Number(r.actual_amount)/Number(v))*100).toFixed(0) : 0;
        return (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:60, height:6, background:'var(--border)', borderRadius:3 }}>
              <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background: pct>100?'var(--red)':pct>80?'var(--orange)':'var(--green)', borderRadius:3 }} />
            </div>
            <span style={{ fontSize:11 }}>{pct}%</span>
          </div>
        );
    }},
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Budget vs Actual" icon="📈">
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={fy} onChange={e => setFy(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          {['2022-23','2023-24','2024-25','2025-26'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <DownloadBar sid={sid} endpoint={`budget?fy=${fy}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Planned" value={fmt(totalPlanned)} icon="📋" color="accent" />
        <SummaryCard label="Total Actual"  value={fmt(totalActual)}  icon="📊" color={totalActual>totalPlanned?'red':'green'} />
        <SummaryCard label="Variance"      value={fmt(Math.abs(variance))} icon={variance>=0?'📈':'📉'} color={variance>=0?'green':'red'} sub={variance>=0?'Under budget':'Over budget'} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>Budget vs Actual by Category</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={budgets} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fill:'var(--text3)', fontSize:11 }} />
            <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
            <Bar dataKey="planned_amount" fill="#4f7cff" name="Planned" radius={[3,3,0,0]} />
            <Bar dataKey="actual_amount"  fill="#f97316" name="Actual"  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding:0 }}>
        <Table columns={cols} data={budgets} />
      </Card>
    </ReportPage>
  );
}
