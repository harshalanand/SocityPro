import { useState, useEffect } from 'react';
import { billingApi } from '../api';
import { StatCard, Card, Button, Modal, Input, Select, Table, Badge, fmt, fmtDate, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function TransactionsPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ transaction_type:'income', category:'', amount:'', description:'', payment_mode:'UPI' });
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    billingApi.transactions(sid).then((r) => setTxns(r.data)).finally(() => setLoading(false));
  }, [sid]);

  const handleAdd = async () => {
    try {
      const r = await billingApi.createTransaction(sid, { ...form, amount: Number(form.amount) });
      setTxns((p) => [r.data, ...p]);
      setShowAdd(false); toast.success('Transaction added');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const filtered  = filter === 'all' ? txns : txns.filter((t) => t.transaction_type === filter);
  const totalIn   = txns.filter((t) => t.transaction_type === 'income' ).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut  = txns.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const cols = [
    { key: 'transaction_date', label: 'Date',        render: (v) => fmtDate(v) },
    { key: 'transaction_type', label: 'Type',        render: (v) => <Badge label={v} color={v==='income'?'green':'red'} /> },
    { key: 'category',         label: 'Category'     },
    { key: 'description',      label: 'Description'  },
    { key: 'amount',           label: 'Amount',      render: (v) => fmt(v) },
    { key: 'payment_mode',     label: 'Mode'         },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Financial Ledger</h2>
        <Button onClick={() => setShowAdd(true)}>+ Add Transaction</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Income"  value={fmt(totalIn)}         icon="📈" color="green"  />
        <StatCard label="Total Expense" value={fmt(totalOut)}        icon="📉" color="red"    />
        <StatCard label="Net Balance"   value={fmt(totalIn-totalOut)} icon="💰" color={totalIn>totalOut?'accent':'orange'} />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          {['all','income','expense'].map((f_) => (
            <button key={f_} onClick={() => setFilter(f_)}
              style={{ padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: filter===f_?'var(--surface3)':'transparent', color: filter===f_?'var(--text)':'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>
              {f_}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} entries</div>
        </div>
        <Table columns={cols} data={filtered} />
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction" width={440}>
        <Select label="Type" value={form.transaction_type} onChange={f('transaction_type')}
          options={[{value:'income',label:'Income'},{value:'expense',label:'Expense'}]} />
        <Input label="Category"      value={form.category}    onChange={f('category')}    placeholder="e.g. Maintenance" required />
        <Input label="Amount (₹)"    value={form.amount}      onChange={f('amount')}      type="number" required />
        <Input label="Description"   value={form.description} onChange={f('description')} placeholder="Transaction details" />
        <Select label="Payment Mode" value={form.payment_mode} onChange={f('payment_mode')}
          options={['UPI','NEFT','RTGS','Cheque','Cash'].map((o) => ({ value: o, label: o }))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Transaction</Button>
        </div>
      </Modal>
    </div>
  );
}
