import { useState, useEffect } from 'react';
import { announcementsApi } from '../api';
import { Card, Button, Badge, Modal, Input, Select, Textarea, fmtDate, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CAT_COLORS = { general:'blue', event:'purple', notice:'orange', emergency:'red' };
const CAT_ICONS  = { general:'📢', event:'🎉', notice:'⚠️', emergency:'🚨' };
const CAT_BORDER = { general:'var(--accent)', event:'#7c4fff', notice:'var(--orange)', emergency:'var(--red)' };

export default function AnnouncementsPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]     = useState({ title:'', content:'', category:'general', is_pinned: false });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    announcementsApi.list(sid).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const handleAdd = async () => {
    try {
      const r = await announcementsApi.create(sid, { ...form, society_id: sid });
      setItems((p) => [r.data, ...p]);
      setShowAdd(false); toast.success('Announcement published');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async (id) => {
    try { await announcementsApi.delete(sid, id); setItems((p) => p.filter((i) => i.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Announcements & Notices</h2>
        <Button onClick={() => setShowAdd(true)}>+ Post Announcement</Button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((a) => (
          <Card key={a.id} style={{ borderLeft: `3px solid ${CAT_BORDER[a.category] ?? 'var(--accent)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span>{CAT_ICONS[a.category] ?? '📢'}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</span>
                  {a.is_pinned && <Badge label="Pinned" color="purple" />}
                  <Badge label={a.category} color={CAT_COLORS[a.category] ?? 'blue'} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{a.content}</p>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{fmtDate(a.publish_date ?? a.created_at)}</div>
              </div>
              <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No announcements yet</div>}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Post Announcement" width={480}>
        <Input label="Title" value={form.title} onChange={f('title')} required />
        <Select label="Category" value={form.category} onChange={f('category')}
          options={['general','event','notice','emergency'].map((o) => ({ value: o, label: o.charAt(0).toUpperCase()+o.slice(1) }))} />
        <Textarea label="Content" value={form.content} onChange={f('content')} rows={4} required />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Publish</Button>
        </div>
      </Modal>
    </div>
  );
}
