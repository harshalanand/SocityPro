import { useState, useEffect } from 'react';
import { complaintsApi } from '../api';
import { StatCard, Card, Button, Modal, Input, Select, Table, Badge, StatusBadge, fmtDate, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ComplaintsPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:'', category:'Plumbing', description:'', priority:'medium' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    complaintsApi.list(sid).then((r) => setComplaints(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const updateStatus = async (id, status) => {
    try {
      await complaintsApi.update(sid, id, { status });
      setComplaints((p) => p.map((c) => c.id === id ? { ...c, status } : c));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleAdd = async () => {
    try {
      const r = await complaintsApi.create(sid, { ...form, society_id: sid });
      setComplaints((p) => [r.data, ...p]);
      setShowAdd(false); toast.success('Complaint raised');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const cols = [
    { key: 'id',         label: '#'          },
    { key: 'title',      label: 'Title',     render: (v) => <strong>{v}</strong> },
    { key: 'category',   label: 'Category'   },
    { key: 'priority',   label: 'Priority',  render: (v) => <Badge label={v} color={v==='high'?'red':v==='medium'?'orange':'gray'} /> },
    { key: 'status',     label: 'Status',    render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date',      render: (v) => fmtDate(v) },
    { key: 'id', label: 'Action', render: (v, r) =>
      r.status === 'open'        ? <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); updateStatus(v, 'in_progress'); }}>Assign</Button> :
      r.status === 'in_progress' ? <Button size="sm" variant="success"   onClick={(e) => { e.stopPropagation(); updateStatus(v, 'resolved');    }}>Resolve</Button> : '—'
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Complaint Management</h2>
        <Button onClick={() => setShowAdd(true)}>+ Raise Complaint</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {['open','in_progress','resolved','closed'].map((s, i) => (
          <StatCard key={s} label={s.replace('_',' ')} value={complaints.filter((c) => c.status === s).length}
            icon={['🔴','🟡','✅','🔒'][i]} color={['red','orange','green','gray'][i]} />
        ))}
      </div>

      <Card style={{ padding: 0 }}><Table columns={cols} data={complaints} /></Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Raise Complaint" width={440}>
        <Input label="Title" value={form.title} onChange={f('title')} required />
        <Select label="Category" value={form.category} onChange={f('category')}
          options={['Plumbing','Electrical','Security','Housekeeping','Lift','Parking','Other'].map((o) => ({ value: o, label: o }))} />
        <Select label="Priority" value={form.priority} onChange={f('priority')}
          options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]} />
        <Input label="Description" value={form.description} onChange={f('description')} placeholder="Describe the issue…" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Submit</Button>
        </div>
      </Modal>
    </div>
  );
}
