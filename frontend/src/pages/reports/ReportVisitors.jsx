import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { visitorsApi } from '../../api';
import { Table, StatusBadge, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportVisitors() {
  const { sid } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    visitorsApi.list(sid).then(r => setVisitors(r.data)).finally(() => setLoading(false));
  }, [sid]);

  // Group by purpose
  const byPurpose = {};
  visitors.forEach(v => {
    const p = v.purpose ?? 'Unknown';
    byPurpose[p] = (byPurpose[p] ?? 0) + 1;
  });
  const purposeData = Object.entries(byPurpose).map(([purpose,count]) => ({ purpose, count }));

  const cols = [
    { key:'visitor_name',   label:'Visitor', render:v => <strong>{v}</strong> },
    { key:'purpose',        label:'Purpose'  },
    { key:'flat',           label:'Flat',    render:(v,r) => r.flat?.flat_no ?? '—' },
    { key:'status',         label:'Status',  render:v => <StatusBadge status={v} /> },
    { key:'check_in_time',  label:'Check In', render:v => v ? String(v).slice(0,16) : '—' },
    { key:'check_out_time', label:'Check Out',render:v => v ? String(v).slice(0,16) : '—' },
    { key:'otp_code',       label:'OTP',     render:v => <span style={{fontFamily:'monospace', color:'var(--accent)'}}>{v ?? '—'}</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Visitor Log" icon="🚪">
      <DownloadBar sid={sid} endpoint="visitors" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Visitors"   value={visitors.length}                                         icon="🚪" color="accent" />
        <SummaryCard label="Checked In"       value={visitors.filter(v=>v.status==='checked_in').length}      icon="✅" color="green"  />
        <SummaryCard label="Checked Out"      value={visitors.filter(v=>v.status==='checked_out').length}     icon="👋" color="purple" />
        <SummaryCard label="Deliveries"       value={visitors.filter(v=>v.is_delivery).length}                icon="📦" color="orange" />
      </div>

      {purposeData.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>Visits by Purpose</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={purposeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="purpose" tick={{ fill:'var(--text3)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="count" fill="#4f7cff" name="Visits" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card style={{ padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Visitor Records ({visitors.length})</span>
        </div>
        <Table columns={cols} data={visitors} />
      </Card>
    </ReportPage>
  );
}
