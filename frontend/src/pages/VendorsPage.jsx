import { useState, useEffect } from 'react';
import { vendorsApi } from '../api';
import { Card, Button, Table, Modal, Input, Select, StatusBadge, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function VendorsPage() {
  const { user } = useAuth();
  const sid = user?.society_id ?? 1;
  const [vendors, setVendors]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [showAdd, setShowAdd]  = useState(false);
  const [form, setForm]        = useState({ name:'', category:'Security', contact_person:'', mobile:'', email:'' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    vendorsApi.list(sid).then((r) => setVendors(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const handleAdd = async () => {
    try {
      const r = await vendorsApi.create(sid, { ...form, society_id: sid });
      setVendors((p) => [...p, r.data]); setShowAdd(false); toast.success('Vendor added');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const cols = [
    { key: 'name',           label: 'Vendor',  render: (v) => <strong>{v}</strong> },
    { key: 'category',       label: 'Category' },
    { key: 'contact_person', label: 'Contact'  },
    { key: 'mobile',         label: 'Mobile'   },
    { key: 'rating',         label: 'Rating',  render: (v) => <span style={{ color: 'var(--yellow)' }}>{'★'.repeat(Math.round(v ?? 0))} {v ?? 0}</span> },
    { key: 'is_active',      label: 'Status',  render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Vendor Management</h2>
        <Button onClick={() => setShowAdd(true)}>+ Add Vendor</Button>
      </div>
      <Card style={{ padding: 0 }}><Table columns={cols} data={vendors} /></Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Vendor" width={440}>
        <Input label="Vendor Name"   value={form.name}           onChange={f('name')}           required />
        <Select label="Category"     value={form.category}       onChange={f('category')}
          options={['Security','Housekeeping','Elevator','Plumbing','Electrical','Landscaping','Other'].map((o) => ({ value:o, label:o }))} />
        <Input label="Contact Person" value={form.contact_person} onChange={f('contact_person')} />
        <Input label="Mobile"        value={form.mobile}         onChange={f('mobile')}         />
        <Input label="Email"         value={form.email}          onChange={f('email')}  type="email" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Vendor</Button>
        </div>
      </Modal>
    </div>
  );
}
