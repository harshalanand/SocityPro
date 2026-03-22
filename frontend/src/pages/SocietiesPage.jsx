import { useState, useEffect } from 'react';
import { societiesApi } from '../api';
import { Card, Button, Badge, Input, Select, Modal, StatCard, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';

export default function SocietiesPage() {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', city:'', state:'', total_units:'' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    societiesApi.list().then((r) => setSocieties(r.data)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    try {
      const r = await societiesApi.create({ ...form, total_units: Number(form.total_units) });
      setSocieties((p) => [...p, r.data]);
      setShowAdd(false); setForm({ name:'', code:'', city:'', state:'', total_units:'' });
      toast.success('Society created');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Manage Societies</h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>Super Admin — all societies on the platform</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Add Society</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {societies.map((s) => (
          <Card key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: 'var(--surface3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏘️</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{s.code}</div>
                </div>
              </div>
              <Badge label={s.is_active ? 'Active' : 'Inactive'} color={s.is_active ? 'green' : 'gray'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['📍 Location', `${s.city}, ${s.state}`], ['🏠 Units', s.total_units], ['👥 Users', s.total_users ?? 0]].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" style={{ flex: 1 }}>View Dashboard</Button>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Society">
        <Input label="Society Name"  value={form.name}        onChange={f('name')}        required />
        <Input label="Society Code"  value={form.code}        onChange={f('code')}        placeholder="e.g. SOC004" required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="City"  value={form.city}  onChange={f('city')} />
          <Input label="State" value={form.state} onChange={f('state')} />
        </div>
        <Input label="Total Units" value={form.total_units} onChange={f('total_units')} type="number" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Create Society</Button>
        </div>
      </Modal>
    </div>
  );
}
