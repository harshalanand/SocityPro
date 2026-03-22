import { useState, useEffect } from 'react';
import { auditApi } from '../api';
import { Card, Badge, fmtDate, PageLoader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const ACTION_COLORS = { CREATE_TRANSACTION:'green', UPDATE_COMPLAINT:'orange', BILL_PAYMENT:'blue', CREATE_ANNOUNCEMENT:'purple', DELETE:'red', UPDATE:'orange', CREATE:'green' };
const DOT_COLORS = ['#4f7cff','#7c4fff','#22c55e','#f97316','#eab308','#8892b0'];

export default function AuditPage() {
  const { user } = useAuth();
  const sid = user?.society_id ?? 1;
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditApi.list(sid).then((r) => setLogs(r.data)).finally(() => setLoading(false));
  }, [sid]);

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Audit Log</h2>
      <Card>
        {logs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No audit records</div>}
        {logs.map((l, i) => {
          const actionKey = Object.keys(ACTION_COLORS).find((k) => l.action?.includes(k)) ?? l.action;
          return (
            <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < logs.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLORS[i%DOT_COLORS.length], marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge label={(l.action ?? 'action').replace(/_/g,' ')} color={ACTION_COLORS[actionKey] ?? 'gray'} />
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>on {l.entity_type}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>
                  {JSON.stringify(l.new_values ?? {})}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{String(l.created_at ?? '').slice(0,16)}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
