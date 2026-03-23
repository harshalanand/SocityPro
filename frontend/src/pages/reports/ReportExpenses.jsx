import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi } from '../../api';
import { Table, fmt, fmtDate, Badge, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#4f7cff','#7c4fff','#22c55e','#f97316','#eab308','#8892b0','#06b6d4','#84cc16'];

export default function ReportExpenses() {
  const { sid } = useAuth();
  const [txns, setTxns]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear]     = useState(new Date().getFullYear());

  useEffect(() => {
    billingApi.transactions(sid, { transaction_type:'expense', year }).then(r => setTxns(r.data)).finally(() => setLoading(false));
  }, [sid, year]);

  const total = txns.reduce((s,t) => s + Number(t.amount), 0);

  // Group by category for pie
  const byCat = {};
  txns.forEach(t => {
    byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);
  });
  const catData = Object.entries(byCat).map(([category, amount]) => ({ category, amount })).sort((a,b) => b.amount-a.amount);

  const cols = [
    { key:'transaction_date', label:'Date',     render:v => fmtDate(v) },
    { key:'category',         label:'Category'  },
    { key:'description',      label:'Description' },
    { key:'amount',           label:'Amount',   render:v => <span style={{color:'var(--red)',fontWeight:600}}>{fmt(v)}</span> },
    { key:'payment_mode',     label:'Mode'      },
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Expense Report" icon="📉">
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <DownloadBar sid={sid} endpoint={`expenses?year=${year}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Expenses"  value={fmt(total)}           icon="📉" color="red"    />
        <SummaryCard label="Categories"      value={catData.length}       icon="📂" color="accent" />
        <SummaryCard label="Transactions"    value={txns.length}          icon="📋" color="purple" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <Card>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill:'var(--text3)', fontSize:11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="category" type="category" tick={{ fill:'var(--text3)', fontSize:11 }} width={90} />
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="amount" fill="#f97316" radius={[0,3,3,0]}>
                {catData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>Share</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {catData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Expense Transactions ({txns.length})</span>
        </div>
        <Table columns={cols} data={txns} />
      </Card>
    </ReportPage>
  );
}
