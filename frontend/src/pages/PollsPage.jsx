import { useState, useEffect } from 'react';
import { pollsApi } from '../api';
import { Card, Button, Badge, PageLoader } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const FALLBACK = [
  { id:1, title:'Preferred time for water maintenance', options:['Morning 6-8 AM','Afternoon 2-4 PM','Evening 6-8 PM'], votes:[12,8,15], total_votes:35, is_active:true, user_voted:false },
  { id:2, title:'Should we install CCTV in parking?',   options:['Yes, strongly agree','Yes, with conditions','No'],          votes:[42,8,5],  total_votes:55, is_active:true, user_voted:true  },
];

export default function PollsPage() {
  const { user, sid } = useAuth();
  const { sid } = useAuth();
  const [polls, setPolls]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pollsApi.list(sid).then((r) => setPolls(r.data.length ? r.data : FALLBACK)).finally(() => setLoading(false));
  }, [sid]);

  const handleVote = async (pollId, optIdx) => {
    try {
      await pollsApi.vote(sid, pollId, optIdx);
      setPolls((p) => p.map((pl) => pl.id === pollId
        ? { ...pl, user_voted: true, total_votes: pl.total_votes+1, votes: pl.votes.map((v,i) => i===optIdx?v+1:v) }
        : pl));
      toast.success('Vote recorded!');
    } catch { toast.error('Already voted or failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Polls & Voting</h2>
        <Button>+ Create Poll</Button>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {polls.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1, marginRight: 16 }}>{p.title}</h3>
              <Badge label={p.is_active ? 'Active' : 'Closed'} color={p.is_active ? 'green' : 'gray'} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {p.options.map((opt, i) => {
                const pct = p.total_votes > 0 ? Math.round(p.votes[i] / p.total_votes * 100) : 0;
                const canVote = !p.user_voted && p.is_active;
                return (
                  <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }} />
                    <div onClick={() => canVote && handleVote(p.id, i)}
                      style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: canVote ? 'pointer' : 'default' }}>
                      <span style={{ fontSize: 13 }}>{opt}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.votes[i]} votes</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
              Total: {p.total_votes} votes {p.user_voted && '• You voted'}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
