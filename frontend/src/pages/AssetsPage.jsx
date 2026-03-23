import { useState, useEffect } from 'react';
import { assetsApi } from '../api';
import { Card, Button, Badge, Modal, Input, Select, StatusBadge, fmt, fmtDate, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CAT_ICONS = { Lift:'🛗', Generator:'⚡', Water:'💧', Garden:'🌿', Security:'📷' };

export default function AssetsPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(null);
  const [logForm, setLogForm] = useState({ service_type:'Routine Maintenance', description:'', cost:'', next_service_date:'' });
  const fl = (k) => (v) => setLogForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    assetsApi.list(sid).then((r) => setAssets(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const handleLog = async () => {
    try {
      await assetsApi.addLog(sid, showLog.id, logForm);
      toast.success('Service logged'); setShowLog(null);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Asset Management</h2>
        <Button>+ Add Asset</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
        {assets.map((a) => (
          <Card key={a.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, background: 'var(--surface3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{CAT_ICONS[a.category] ?? '⚙️'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{a.category}</div>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Purchase Value', fmt(a.purchase_value)], ['Last Service', fmtDate(a.last_service_date)], ['Next Service', fmtDate(a.next_service_date)]].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" style={{ width: '100%' }} onClick={() => setShowLog(a)}>+ Log Service</Button>
          </Card>
        ))}
      </div>

      <Modal open={!!showLog} onClose={() => setShowLog(null)} title={`Log Service — ${showLog?.name}`} width={440}>
        <Input label="Service Type"    value={logForm.service_type}     onChange={fl('service_type')}     />
        <Input label="Description"     value={logForm.description}      onChange={fl('description')}      />
        <Input label="Cost (₹)"        value={logForm.cost}             onChange={fl('cost')}             type="number" />
        <Input label="Next Service Date" value={logForm.next_service_date} onChange={fl('next_service_date')} type="date" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowLog(null)}>Cancel</Button>
          <Button onClick={handleLog}>Save Log</Button>
        </div>
      </Modal>
    </div>
  );
}
