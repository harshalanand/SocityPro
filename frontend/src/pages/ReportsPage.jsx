import { Card, Button } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const REPORTS = [
  { name:'Collection Report',    desc:'Monthly/Yearly maintenance collection',   icon:'💰', color:'#4f7cff', endpoint:'collection'  },
  { name:'Defaulters List',       desc:'Flats with pending/overdue bills',          icon:'⚠️', color:'#ef4444', endpoint:'defaulters'  },
  { name:'Expense Report',        desc:'Category-wise expense breakdown',           icon:'📊', color:'#f97316', endpoint:'expenses'    },
  { name:'Budget vs Actual',      desc:'Planned vs actual comparison',              icon:'📈', color:'#22c55e', endpoint:'budget'      },
  { name:'Visitor Log',           desc:'Daily/monthly visitor entry report',        icon:'🚪', color:'#eab308', endpoint:'visitors'    },
  { name:'Asset Register',        desc:'Complete inventory with valuations',        icon:'⚙️', color:'#06b6d4', endpoint:'assets'      },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const sid = user?.society_id ?? 1;
  const base = `/api/societies/${sid}/reports`;

  const download = (endpoint, fmt) => {
    window.open(`${base}/${endpoint}?fmt=${fmt}`, '_blank');
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Reports & Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
        {REPORTS.map((r) => (
          <Card key={r.name} style={{ cursor: 'default', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = r.color}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, background: `${r.color}20`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 14 }}>{r.desc}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => download(r.endpoint, 'xlsx')} style={{ flex: 1 }}>📥 Excel</Button>
              <Button variant="secondary" size="sm" onClick={() => download(r.endpoint, 'pdf')}  style={{ flex: 1 }}>📄 PDF</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
