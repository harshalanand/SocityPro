import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auditApi } from '../../api';
import { Table, Badge, Card, PageLoader } from '../../components/ui';
import { ReportPage, SummaryCard } from './_shared';

const ACTION_COLORS = { CREATE:'green', UPDATE:'orange', DELETE:'red', PAYMENT:'blue', LOGIN:'purple' };

export default function ReportAudit() {
  const { sid } = useAuth();
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    auditApi.list(sid, { limit: 200 }).then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const filtered = filter ? logs.filter(l => l.action?.includes(filter.toUpperCase()) || l.entity_type?.includes(filter.toLowerCase())) : logs;

  const colorFor = (action) => ACTION_COLORS[Object.keys(ACTION_COLORS).find(k => action?.includes(k))] ?? 'gray';

  const cols = [
    { key:'created_at',  label:'Time',    render:v => <span style={{fontSize:11}}>{String(v??'').slice(0,16)}</span> },
    { key:'action',      label:'Action',  render:v => <Badge label={(v??'').replace(/_/g,' ')} color={colorFor(v)} /> },
    { key:'entity_type', label:'Entity'   },
    { key:'entity_id',   label:'ID',      render:v => <span style={{fontFamily:'monospace',color:'var(--text3)'}}>{v}</span> },
    { key:'new_values',  label:'Details', render:v => <span style={{fontFamily:'monospace',fontSize:11,color:'var(--text3)'}}>{JSON.stringify(v??{}).slice(0,60)}</span> },
    { key:'user_id',     label:'User ID', render:v => v ?? '—' },
  ];

  if (loading) return <PageLoader />;

  return (
    <ReportPage title="Audit Trail" icon="🔍">
      <div style={{ marginBottom: 16 }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by action or entity…"
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit', width:280 }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Events"  value={logs.length}                                                   icon="📋" color="accent" />
        <SummaryCard label="Creates"       value={logs.filter(l=>l.action?.includes('CREATE')).length}           icon="➕" color="green"  />
        <SummaryCard label="Updates"       value={logs.filter(l=>l.action?.includes('UPDATE')).length}           icon="✏️" color="orange" />
        <SummaryCard label="Deletions"     value={logs.filter(l=>l.action?.includes('DELETE')).length}           icon="🗑️" color="red"    />
      </div>

      <Card style={{ padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Audit Records ({filtered.length})</span>
        </div>
        <Table columns={cols} data={filtered} />
      </Card>
    </ReportPage>
  );
}
