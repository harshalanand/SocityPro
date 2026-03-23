import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi } from '../../api';
import { Table, fmt, fmtDate, StatusBadge, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportDefaulters() {
  const { sid } = useAuth();
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi.defaulters(sid).then(r => setDefaulters(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const totalDue    = defaulters.reduce((s,d) => s + Number(d.total_amount) - Number(d.paid_amount), 0);
  const overdue     = defaulters.filter(d => d.status === 'overdue');
  const partial     = defaulters.filter(d => d.status === 'partial');

  // Group by flat for chart
  const byFlat = defaulters.slice(0, 10).map(d => ({
    flat: d.flat?.flat_no ?? d.flat_id,
    due: Number(d.total_amount) - Number(d.paid_amount),
  }));

  const cols = [
    { key:'flat_no',      label:'Flat',    render:(v,r) => <strong>{r.flat?.flat_no ?? v ?? '—'}</strong> },
    { key:'bill_month',   label:'Period',  render:(v,r) => `${v}/${r.bill_year}` },
    { key:'total_amount', label:'Bill Amt', render:v => fmt(v) },
    { key:'paid_amount',  label:'Paid',    render:v => fmt(v) },
    { key:'total_amount', label:'Due',     render:(v,r) => <strong style={{color:'var(--red)'}}>{fmt(Number(v)-Number(r.paid_amount))}</strong> },
    { key:'status',       label:'Status',  render:v => <StatusBadge status={v} /> },
    { key:'due_date',     label:'Due Date',render:v => fmtDate(v) },
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Defaulters List" icon="⚠️">
      <DownloadBar sid={sid} endpoint="defaulters" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Defaulters" value={defaulters.length}   icon="⚠️" color="red"    />
        <SummaryCard label="Total Due"         value={fmt(totalDue)}       icon="💸" color="red"    />
        <SummaryCard label="Overdue"           value={overdue.length}      icon="🔴" color="orange" />
        <SummaryCard label="Partial Pay"       value={partial.length}      icon="🟡" color="yellow" />
      </div>

      {byFlat.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>Top Defaulters by Amount Due</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byFlat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill:'var(--text3)', fontSize:11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="flat" type="category" tick={{ fill:'var(--text3)', fontSize:11 }} width={50} />
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="due" fill="#ef4444" name="Amount Due" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card style={{ padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Defaulter Details ({defaulters.length} records)</span>
        </div>
        <Table columns={cols} data={defaulters} />
      </Card>
    </ReportPage>
  );
}
