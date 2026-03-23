import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi } from '../../api';
import { Table, fmt, fmtDate, StatusBadge, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportCollection() {
  const { sid } = useAuth();
  const [bills, setBills]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth]   = useState('');
  const [year, setYear]     = useState(new Date().getFullYear());

  useEffect(() => {
    const params = {};
    if (month) params.month = month;
    if (year)  params.year  = year;
    billingApi.bills(sid, params).then(r => setBills(r.data)).finally(() => setLoading(false));
  }, [sid, month, year]);

  const totalBilled    = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalCollected = bills.reduce((s, b) => s + Number(b.paid_amount), 0);
  const totalPending   = totalBilled - totalCollected;
  const collectionPct  = totalBilled ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0;

  // Group by month for bar chart
  const byMonth = {};
  bills.forEach(b => {
    const key = `${MONTHS[(b.bill_month??1)-1]} ${b.bill_year}`;
    if (!byMonth[key]) byMonth[key] = { month: key, billed: 0, collected: 0 };
    byMonth[key].billed    += Number(b.total_amount);
    byMonth[key].collected += Number(b.paid_amount);
  });
  const chartData = Object.values(byMonth).slice(-6);

  const cols = [
    { key:'flat_no',       label:'Flat',    render:(v,r) => r.flat?.flat_no ?? v ?? '—' },
    { key:'bill_month',    label:'Period',  render:(v,r) => `${MONTHS[(v??1)-1]} ${r.bill_year}` },
    { key:'total_amount',  label:'Billed',  render:v => fmt(v) },
    { key:'paid_amount',   label:'Paid',    render:v => fmt(v) },
    { key:'total_amount',  label:'Balance', render:(v,r) => <span style={{color: Number(v)>Number(r.paid_amount)?'var(--red)':'var(--green)'}}>{fmt(Number(v)-Number(r.paid_amount))}</span> },
    { key:'status',        label:'Status',  render:v => <StatusBadge status={v} /> },
    { key:'paid_date',     label:'Paid On', render:v => fmtDate(v) },
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Collection Report" icon="💰">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <select value={month} onChange={e => setMonth(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          <option value="">All Months</option>
          {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <DownloadBar sid={sid} endpoint={`collection?month=${month}&year=${year}`} />
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Billed"     value={fmt(totalBilled)}    icon="💰" color="accent" />
        <SummaryCard label="Collected"        value={fmt(totalCollected)} icon="✅" color="green" />
        <SummaryCard label="Pending"          value={fmt(totalPending)}   icon="⏰" color="orange" />
        <SummaryCard label="Collection Rate"  value={`${collectionPct}%`} icon="📊" color={collectionPct>=80?'green':'red'} />
      </div>

      {/* Bar chart */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>Monthly Collection vs Billing</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:11 }} />
            <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
            <Bar dataKey="billed"    fill="#4f7cff" name="Billed"    radius={[3,3,0,0]} />
            <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card style={{ padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Bill Details ({bills.length} records)</span>
        </div>
        <Table columns={cols} data={bills} />
      </Card>
    </ReportPage>
  );
}
