import { useState, useEffect } from 'react';
import { visitorsApi } from '../api';
import { StatCard, Card, Button, Modal, Input, Table, StatusBadge, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function VisitorsPage() {
  const { user } = useAuth();
  const sid = user?.society_id ?? 1;
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ visitor_name:'', visitor_mobile:'', purpose:'', flat_no:'' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    visitorsApi.list(sid).then((r) => setVisitors(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const checkin  = async (id)  => { try { await visitorsApi.checkin(sid, id, '000000'); setVisitors((p) => p.map((v) => v.id===id?{...v,status:'checked_in',check_in_time:new Date().toLocaleString()}:v)); toast.success('Checked in'); } catch { toast.error('Failed'); } };
  const checkout = async (id)  => { try { await visitorsApi.checkout(sid, id); setVisitors((p) => p.map((v) => v.id===id?{...v,status:'checked_out',check_out_time:new Date().toLocaleString()}:v)); toast.success('Checked out'); } catch { toast.error('Failed'); } };

  const handleAdd = async () => {
    try {
      const r = await visitorsApi.create(sid, { ...form, society_id: sid });
      setVisitors((p) => [r.data, ...p]);
      setShowAdd(false); toast.success('Visitor registered. OTP generated.');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const cols = [
    { key: 'visitor_name', label: 'Name',      render: (v) => <strong>{v}</strong> },
    { key: 'purpose',      label: 'Purpose'    },
    { key: 'otp_code',     label: 'OTP',       render: (v) => <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent)' }}>{v ?? '—'}</span> },
    { key: 'status',       label: 'Status',    render: (v) => <StatusBadge status={v} /> },
    { key: 'check_in_time',  label: 'Check In',  render: (v) => v ? String(v).slice(0,16) : '—' },
    { key: 'check_out_time', label: 'Check Out', render: (v) => v ? String(v).slice(0,16) : '—' },
    { key: 'id', label: 'Action', render: (v, r) =>
      r.status === 'pending'    ? <Button size="sm" variant="success"   onClick={(e) => { e.stopPropagation(); checkin(v);  }}>Check In</Button>  :
      r.status === 'checked_in' ? <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); checkout(v); }}>Check Out</Button> : '—'
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Visitor Management</h2>
        <Button onClick={() => setShowAdd(true)}>+ Register Visitor</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Today's Visitors"  value={visitors.length}                                   icon="🚪" color="accent" />
        <StatCard label="Currently Inside"   value={visitors.filter((v) => v.status==='checked_in').length} icon="👤" color="green"  />
        <StatCard label="Pending Approval"   value={visitors.filter((v) => v.status==='pending').length}    icon="⏳" color="orange" />
      </div>
      <Card style={{ padding: 0 }}><Table columns={cols} data={visitors} /></Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register Visitor" width={440}>
        <Input label="Visitor Name" value={form.visitor_name}   onChange={f('visitor_name')}   required />
        <Input label="Mobile"       value={form.visitor_mobile} onChange={f('visitor_mobile')} />
        <Input label="Purpose"      value={form.purpose}        onChange={f('purpose')}        placeholder="e.g. Meeting, Delivery" />
        <Input label="Flat No"      value={form.flat_no}        onChange={f('flat_no')}        placeholder="e.g. A-101" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Register & Generate OTP</Button>
        </div>
      </Modal>
    </div>
  );
}
