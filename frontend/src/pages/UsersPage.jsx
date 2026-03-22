import { useState, useEffect } from 'react';
import { usersApi } from '../api';
import { Card, Button, Badge, Table, Modal, Input, Select, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ROLE_COLORS = { superadmin: 'purple', admin: 'blue', resident: 'green', staff: 'orange', vendor: 'gray' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name:'', email:'', mobile:'', password:'', role:'resident' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    usersApi.list({ society_id: me?.society_id }).then((r) => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await usersApi.approve(id);
      setUsers((p) => p.map((u) => u.id === id ? { ...u, is_approved: true } : u));
      toast.success('User approved');
    } catch { toast.error('Failed'); }
  };

  const handleAdd = async () => {
    try {
      const r = await usersApi.create({ ...form, society_id: me?.society_id ?? 1 });
      setUsers((p) => [...p, r.data]);
      setShowAdd(false); toast.success('User created');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const cols = [
    { key: 'full_name', label: 'Name',   render: (v) => <strong>{v}</strong> },
    { key: 'email',     label: 'Email'  },
    { key: 'mobile',    label: 'Mobile' },
    { key: 'role',      label: 'Role',   render: (v) => <Badge label={v} color={ROLE_COLORS[v] ?? 'gray'} /> },
    { key: 'is_approved', label: 'Status', render: (v) => <Badge label={v ? 'Active' : 'Pending'} color={v ? 'green' : 'orange'} /> },
    { key: 'id', label: 'Action', render: (v, r) => !r.is_approved
      ? <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handleApprove(v); }}>Approve</Button>
      : <Button size="sm" variant="ghost">Edit</Button> },
  ];

  if (loading) return <PageLoader />;

  const pendingCount = users.filter((u) => !u.is_approved).length;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>User Management</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendingCount > 0 && <Badge label={`${pendingCount} pending approval`} color="orange" size="md" />}
          <Button onClick={() => setShowAdd(true)}>+ Add User</Button>
        </div>
      </div>
      <Card style={{ padding: 0 }}><Table columns={cols} data={users} /></Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User" width={440}>
        <Input label="Full Name" value={form.full_name} onChange={f('full_name')} required />
        <Input label="Email"     value={form.email}     onChange={f('email')} type="email" required />
        <Input label="Mobile"    value={form.mobile}    onChange={f('mobile')} />
        <Input label="Password"  value={form.password}  onChange={f('password')} type="password" required />
        <Select label="Role" value={form.role} onChange={f('role')}
          options={['resident','admin','staff','vendor'].map((o) => ({ value: o, label: o.charAt(0).toUpperCase()+o.slice(1) }))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Create User</Button>
        </div>
      </Modal>
    </div>
  );
}
