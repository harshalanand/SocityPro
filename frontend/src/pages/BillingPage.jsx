import { useState, useEffect } from 'react';
import { billingApi } from '../api';
import { StatCard, Card, Button, Modal, Input, Select, Table, StatusBadge, fmt, fmtDate, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BillingPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [bills, setBills]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [showPay, setShowPay] = useState(null);
  const [payForm, setPayForm] = useState({ paid_amount:'', payment_mode:'UPI', reference_no:'' });
  const fp = (k) => (v) => setPayForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    billingApi.bills(sid).then((r) => setBills(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const handlePay = async () => {
    try {
      await billingApi.pay(sid, showPay.id, payForm);
      setBills((p) => p.map((b) => b.id === showPay.id ? { ...b, status: 'paid', paid_amount: b.total_amount } : b));
      setShowPay(null); toast.success('Payment recorded');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const handleBulk = async () => {
    const now = new Date();
    try {
      await billingApi.generateBulk(sid, now.getMonth() + 1, now.getFullYear());
      toast.success('Bills generated for current month');
      billingApi.bills(sid).then((r) => setBills(r.data));
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const filtered = tab === 'all' ? bills : tab === 'defaulters' ? bills.filter((b) => b.status !== 'paid') : bills.filter((b) => b.status === tab);

  const totals = {
    billed:    bills.reduce((s, b) => s + Number(b.total_amount), 0),
    collected: bills.reduce((s, b) => s + Number(b.paid_amount), 0),
    pending:   bills.filter((b) => b.status === 'pending').length,
    overdue:   bills.filter((b) => b.status === 'overdue').length,
  };

  const cols = [
    { key: 'flat_no',       label: 'Flat',     render: (v, r) => r.flat?.flat_no ?? v ?? '—' },
    { key: 'bill_month',    label: 'Period',   render: (v, r) => `${MONTHS[(v??1)-1]} ${r.bill_year}` },
    { key: 'total_amount',  label: 'Amount',   render: (v) => fmt(v) },
    { key: 'paid_amount',   label: 'Paid',     render: (v) => fmt(v) },
    { key: 'due_date',      label: 'Due Date', render: (v) => fmtDate(v) },
    { key: 'status',        label: 'Status',   render: (v) => <StatusBadge status={v} /> },
    { key: 'id', label: 'Action', render: (v, r) => r.status !== 'paid'
      ? <Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); setShowPay(r); }}>Pay</Button>
      : '—' },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Billing Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={handleBulk}>Generate Bulk Bills</Button>
          <Button>+ Create Bill</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Billed"  value={fmt(totals.billed)}    icon="💰" color="accent"  />
        <StatCard label="Collected"     value={fmt(totals.collected)}  icon="✅" color="green"   />
        <StatCard label="Pending"       value={`${totals.pending} bills`} icon="⏰" color="orange" />
        <StatCard label="Overdue"       value={`${totals.overdue} bills`} icon="🔴" color="red"    />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {['all','pending','overdue','paid','defaulters'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: tab===t?'var(--accent)':'transparent', color: tab===t?'#fff':'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
        <Table columns={cols} data={filtered} />
      </Card>

      <Modal open={!!showPay} onClose={() => setShowPay(null)} title={`Record Payment — Flat ${showPay?.flat?.flat_no ?? showPay?.flat_no}`} width={420}>
        <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text3)' }}>Total Due</span>
          <strong>{fmt(showPay?.total_amount)}</strong>
        </div>
        <Input label="Amount (₹)" value={payForm.paid_amount} onChange={fp('paid_amount')} type="number" required />
        <Select label="Payment Mode" value={payForm.payment_mode} onChange={fp('payment_mode')}
          options={['UPI','NEFT','RTGS','Cheque','Cash'].map((o) => ({ value: o, label: o }))} />
        <Input label="Reference No" value={payForm.reference_no} onChange={fp('reference_no')} placeholder="Transaction ID / Cheque No" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowPay(null)}>Cancel</Button>
          <Button variant="success" onClick={handlePay}>Record Payment</Button>
        </div>
      </Modal>
    </div>
  );
}
