import { useState, useEffect } from 'react';
import { settingsApi } from '../api';
import { Button, Input, Select, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';

const TABS = [
  { id:'general',       label:'General',       icon:'⚙️' },
  { id:'billing',       label:'Billing',        icon:'💰' },
  { id:'notifications', label:'Notifications',  icon:'🔔' },
  { id:'sms',           label:'SMS',            icon:'📱' },
  { id:'email',         label:'Email',          icon:'📧' },
  { id:'whatsapp',      label:'WhatsApp',       icon:'💬' },
  { id:'database',      label:'Database',       icon:'🗄️' },
  { id:'security',      label:'Security',       icon:'🔒' },
];

const DEFAULTS = {
  app_name:'SocietyPro', currency:'INR', timezone:'Asia/Kolkata', date_format:'DD/MM/YYYY',
  maintenance_due_day:'10', late_fee_percent:'2', auto_generate_bills:'true', penalty_grace_days:'5',
  sms_enabled:'false', email_enabled:'false', whatsapp_enabled:'false',
  sms_provider:'twilio', twilio_account_sid:'', twilio_auth_token:'', twilio_from_number:'',
  email_provider:'smtp', smtp_host:'', smtp_port:'587', smtp_username:'', smtp_password:'', email_from:'noreply@societypro.com', sendgrid_api_key:'',
  whatsapp_provider:'twilio', whatsapp_from:'', wati_api_endpoint:'', wati_access_token:'',
  db_type:'sqlite', sqlite_path:'./societypro.db', mssql_server:'', mssql_database:'', mssql_username:'', mssql_password:'',
  session_timeout_minutes:'1440', require_otp_login:'false', password_min_length:'8',
};

export default function SettingsPage() {
  const [tab, setTab]           = useState('general');
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [dbTest, setDbTest]     = useState(null);
  const [notif, setNotif]       = useState({ channel:'sms', recipient:'' });

  useEffect(() => {
    settingsApi.getAll().then((r) => {
      const map = {};
      (r.data ?? []).forEach((s) => { map[s.key] = s.value; });
      setSettings((p) => ({ ...p, ...map }));
    }).finally(() => setLoading(false));
  }, []);

  const s   = (key)        => settings[key] ?? '';
  const set = (key, val)   => setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    try {
      const pairs = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await settingsApi.bulkUpdate(pairs);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleDbTest = async () => {
    setDbTest({ testing: true });
    try {
      const r = await settingsApi.testDb({ db_type: s('db_type'), sqlite_path: s('sqlite_path'), mssql_server: s('mssql_server'), mssql_database: s('mssql_database'), mssql_username: s('mssql_username'), mssql_password: s('mssql_password') });
      setDbTest({ success: true, message: r.data.message });
    } catch (e) { setDbTest({ success: false, message: e?.response?.data?.detail || 'Connection failed' }); }
  };

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</h3>
  );

  const Toggle = ({ label, desc, k }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => set(k, s(k) === 'true' ? 'false' : 'true')}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: s(k) === 'true' ? 'var(--green)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: s(k) === 'true' ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Settings sidebar */}
      <div style={{ width: 200, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 8 }}>Settings</div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: tab===t.id?'var(--accent-glow)':'transparent', color: tab===t.id?'var(--accent)':'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab===t.id?700:500, marginBottom: 2, textAlign: 'left' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {tab === 'general' && <>
          <SectionTitle>Application Settings</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="App Name"    value={s('app_name')}    onChange={(v) => set('app_name',    v)} />
            <Select label="Currency"   value={s('currency')}    onChange={(v) => set('currency',    v)} options={['INR','USD','EUR','GBP'].map((o) => ({ value:o, label:o }))} />
            <Select label="Timezone"   value={s('timezone')}    onChange={(v) => set('timezone',    v)} options={['Asia/Kolkata','America/New_York','Europe/London','Asia/Singapore'].map((o) => ({ value:o, label:o }))} />
            <Select label="Date Format" value={s('date_format')} onChange={(v) => set('date_format', v)} options={['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].map((o) => ({ value:o, label:o }))} />
          </div>
        </>}

        {tab === 'billing' && <>
          <SectionTitle>Billing Configuration</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Due Day"          value={s('maintenance_due_day')} onChange={(v) => set('maintenance_due_day', v)} type="number" />
            <Input label="Late Fee %"        value={s('late_fee_percent')}    onChange={(v) => set('late_fee_percent',    v)} type="number" />
            <Input label="Grace Days"        value={s('penalty_grace_days')}  onChange={(v) => set('penalty_grace_days',  v)} type="number" />
          </div>
          <Toggle label="Auto-generate Monthly Bills" desc="Create bills automatically on the 1st of each month" k="auto_generate_bills" />
        </>}

        {tab === 'notifications' && <>
          <SectionTitle>Notification Channels</SectionTitle>
          <Toggle label="SMS Notifications"       desc="Payment reminders and alerts"              k="sms_enabled"       />
          <Toggle label="Email Notifications"     desc="Bills, complaints, announcements"           k="email_enabled"     />
          <Toggle label="WhatsApp Notifications"  desc="All notifications via WhatsApp"             k="whatsapp_enabled"  />
          <div style={{ marginTop: 20 }}>
            <SectionTitle>Test Notification</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <Select label="Channel"   value={notif.channel}    onChange={(v) => setNotif((p) => ({ ...p, channel: v }))}    options={['sms','email','whatsapp'].map((o) => ({ value:o, label:o.toUpperCase() }))} />
              <Input  label="Recipient" value={notif.recipient}  onChange={(v) => setNotif((p) => ({ ...p, recipient: v }))}  placeholder="Mobile / Email" />
              <div style={{ marginBottom: 14 }}>
                <Button onClick={() => { settingsApi.testNotification(notif.channel, notif.recipient, 'Test from SocietyPro'); toast.success('Test sent (simulated)'); }}>Send Test</Button>
              </div>
            </div>
          </div>
        </>}

        {tab === 'sms' && <>
          <SectionTitle>SMS Configuration</SectionTitle>
          <Select label="Provider" value={s('sms_provider')} onChange={(v) => set('sms_provider', v)} options={[{value:'twilio',label:'Twilio'},{value:'msg91',label:'MSG91'}]} />
          {s('sms_provider') === 'twilio' && <>
            <Input label="Account SID"  value={s('twilio_account_sid')} onChange={(v) => set('twilio_account_sid', v)} placeholder="ACxxxxxxxx" />
            <Input label="Auth Token"   value={s('twilio_auth_token')}  onChange={(v) => set('twilio_auth_token',  v)} type="password" />
            <Input label="From Number"  value={s('twilio_from_number')} onChange={(v) => set('twilio_from_number', v)} placeholder="+1234567890" />
          </>}
          {s('sms_provider') === 'msg91' && <Input label="Auth Key" value={s('msg91_auth_key') ?? ''} onChange={(v) => set('msg91_auth_key', v)} type="password" />}
        </>}

        {tab === 'email' && <>
          <SectionTitle>Email Configuration</SectionTitle>
          <Select label="Provider" value={s('email_provider')} onChange={(v) => set('email_provider', v)} options={[{value:'smtp',label:'SMTP'},{value:'sendgrid',label:'SendGrid'}]} />
          {s('email_provider') === 'sendgrid' && <Input label="API Key" value={s('sendgrid_api_key')} onChange={(v) => set('sendgrid_api_key', v)} type="password" placeholder="SG.xxxxx" />}
          {s('email_provider') === 'smtp' && <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="SMTP Host" value={s('smtp_host')} onChange={(v) => set('smtp_host', v)} placeholder="smtp.gmail.com" />
              <Input label="Port"      value={s('smtp_port')} onChange={(v) => set('smtp_port', v)} type="number" />
            </div>
            <Input label="Username" value={s('smtp_username')} onChange={(v) => set('smtp_username', v)} />
            <Input label="Password" value={s('smtp_password')} onChange={(v) => set('smtp_password', v)} type="password" />
          </>}
          <Input label="From Address" value={s('email_from')} onChange={(v) => set('email_from', v)} type="email" />
        </>}

        {tab === 'whatsapp' && <>
          <SectionTitle>WhatsApp Configuration</SectionTitle>
          <Select label="Provider" value={s('whatsapp_provider')} onChange={(v) => set('whatsapp_provider', v)} options={[{value:'twilio',label:'Twilio'},{value:'wati',label:'WATI'},{value:'gupshup',label:'Gupshup'}]} />
          <Input label="From Number" value={s('whatsapp_from')} onChange={(v) => set('whatsapp_from', v)} placeholder="+91xxxxxxxxxx" />
          {s('whatsapp_provider') === 'wati' && <>
            <Input label="WATI Endpoint" value={s('wati_api_endpoint')} onChange={(v) => set('wati_api_endpoint', v)} />
            <Input label="Access Token"  value={s('wati_access_token')} onChange={(v) => set('wati_access_token', v)} type="password" />
          </>}
        </>}

        {tab === 'database' && <>
          <SectionTitle>Database Configuration</SectionTitle>
          <div style={{ padding: '12px 14px', background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            ⚠️ Changing the database requires an application restart and data migration.
          </div>
          <Select label="Database Type" value={s('db_type')} onChange={(v) => set('db_type', v)} options={[{value:'sqlite',label:'SQLite (Default)'},{value:'mssql',label:'Microsoft SQL Server'}]} />
          {s('db_type') === 'sqlite' && <Input label="SQLite Path" value={s('sqlite_path')} onChange={(v) => set('sqlite_path', v)} />}
          {s('db_type') === 'mssql' && <>
            <Input label="Server"   value={s('mssql_server')}   onChange={(v) => set('mssql_server',   v)} placeholder="localhost\SQLEXPRESS" />
            <Input label="Database" value={s('mssql_database')} onChange={(v) => set('mssql_database', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Username" value={s('mssql_username')} onChange={(v) => set('mssql_username', v)} />
              <Input label="Password" value={s('mssql_password')} onChange={(v) => set('mssql_password', v)} type="password" />
            </div>
          </>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
            <Button variant="secondary" onClick={handleDbTest}>{dbTest?.testing ? 'Testing…' : 'Test Connection'}</Button>
            {dbTest && !dbTest.testing && (
              <span style={{ fontSize: 13, color: dbTest.success ? 'var(--green)' : 'var(--red)' }}>
                {dbTest.success ? '✅' : '❌'} {dbTest.message}
              </span>
            )}
          </div>
          <div style={{ marginTop: 16, padding: 14, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text3)' }}>
            🔄 After switching to MSSQL: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>python migrate.py --from sqlite --to mssql</code>
          </div>
        </>}

        {tab === 'security' && <>
          <SectionTitle>Security Settings</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Input label="Session Timeout (min)"  value={s('session_timeout_minutes')} onChange={(v) => set('session_timeout_minutes', v)} type="number" />
            <Input label="Min Password Length"     value={s('password_min_length')}     onChange={(v) => set('password_min_length',     v)} type="number" />
          </div>
          <Toggle label="Require OTP Login" desc="Users must verify via OTP in addition to password" k="require_otp_login" />
        </>}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={() => setSettings(DEFAULTS)}>Reset to Defaults</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
