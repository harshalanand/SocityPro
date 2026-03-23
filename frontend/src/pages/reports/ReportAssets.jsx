import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { assetsApi } from '../../api';
import { Table, fmt, fmtDate, StatusBadge, Card, PageLoader } from '../../components/ui';
import { ReportPage, DownloadBar, SummaryCard } from './_shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CAT_COLORS = ['#4f7cff','#22c55e','#f97316','#7c4fff','#eab308','#06b6d4'];

export default function ReportAssets() {
  const { sid } = useAuth();
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assetsApi.list(sid).then(r => setAssets(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const totalValue  = assets.reduce((s,a) => s + Number(a.purchase_value ?? 0), 0);
  const byCat = {};
  assets.forEach(a => { byCat[a.category??'Other'] = (byCat[a.category??'Other'] ?? 0) + 1; });
  const catData = Object.entries(byCat).map(([category,count]) => ({ category, count }));

  const cols = [
    { key:'name',              label:'Asset',        render:v => <strong>{v}</strong> },
    { key:'category',          label:'Category'      },
    { key:'status',            label:'Status',       render:v => <StatusBadge status={v} /> },
    { key:'purchase_value',    label:'Purchase Value', render:v => fmt(v) },
    { key:'current_value',     label:'Current Value',  render:v => fmt(v) },
    { key:'last_service_date', label:'Last Service', render:v => fmtDate(v) },
    { key:'next_service_date', label:'Next Service', render:(v) => {
        const isOverdue = v && new Date(v) < new Date();
        return <span style={{color:isOverdue?'var(--red)':undefined}}>{fmtDate(v)}</span>;
    }},
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Asset Register" icon="⚙️">
      <DownloadBar sid={sid} endpoint="assets" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Assets"    value={assets.length}                                   icon="⚙️" color="accent" />
        <SummaryCard label="Total Value"     value={fmt(totalValue)}                                  icon="💰" color="green"  />
        <SummaryCard label="Active"          value={assets.filter(a=>a.status==='active').length}     icon="✅" color="green"  />
        <SummaryCard label="In Maintenance"  value={assets.filter(a=>a.status==='maintenance').length}icon="🔧" color="orange" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, marginBottom:20 }}>
        <Card>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:14 }}>By Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({category}) => category} labelLine={false} fontSize={10}>
                {catData.map((_,i) => <Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:10 }}>Service Due Soon</h3>
          {assets.filter(a => a.next_service_date).sort((a,b) => new Date(a.next_service_date) - new Date(b.next_service_date)).slice(0,5).map(a => {
            const isOverdue = new Date(a.next_service_date) < new Date();
            return (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{a.category}</div>
                </div>
                <span style={{ fontSize:12, color:isOverdue?'var(--red)':'var(--orange)', fontWeight:600 }}>{fmtDate(a.next_service_date)}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <Card style={{ padding:0 }}>
        <Table columns={cols} data={assets} />
      </Card>
    </ReportPage>
  );
}
