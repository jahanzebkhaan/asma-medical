import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/api/analytics/summary'), api.get('/api/followups?status=pending'), api.get('/api/followups?status=overdue')])
      .then(([s, pf, of]) => {
        setStats(s);
        setFollowups([...of, ...pf].slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Good morning, {user?.name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 2 }}>Here's what needs your attention today.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Patients" value={stats?.totalPatients} sub={`${stats?.optedIn} opted in`} />
        <StatCard label="Messages Sent" value={stats?.totalMessagesSent} sub="this session" />
        <StatCard label="Delivery Rate" value={`${stats?.deliveryRate}%`} color="var(--green)" />
        <StatCard label="Read Rate" value={`${stats?.readRate}%`} color="var(--blue)" />
        <StatCard label="Pending Follow-ups" value={stats?.pendingFollowups} color="var(--amber)" />
        <StatCard label="Overdue Follow-ups" value={stats?.overdueFollowups} color="var(--red)" sub="needs action" />
        <StatCard label="Upcoming Appointments" value={stats?.upcomingAppointments} />
        <StatCard label="Inbound Messages" value={stats?.inboundMessages} sub="awaiting reply" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Follow-up Tracker */}
        <div className="card">
          <div className="card-header">
            <strong>Follow-up Tracker</strong>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/schedule')}>View all</button>
          </div>
          <div>
            {followups.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">✅</div><h3>All clear!</h3><p>No overdue or pending follow-ups.</p></div>
            ) : followups.map(f => (
              <div key={f.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{f.patientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{fmtDate(f.scheduledFor)}</div>
                </div>
                <span className={`badge badge-${f.status}`}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Segments */}
        <div className="card">
          <div className="card-header">
            <strong>Patient Segments</strong>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/patients')}>View all</button>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'first_trimester', label: 'First Trimester', cls: 'badge-first' },
              { key: 'second_trimester', label: 'Second Trimester', cls: 'badge-second' },
              { key: 'third_trimester', label: 'Third Trimester', cls: 'badge-third' },
              { key: 'postnatal', label: 'Postnatal', cls: 'badge-postnatal' }
            ].map(s => {
              const count = stats?.patientsByStage?.[s.key] || 0;
              const pct = stats?.totalPatients ? Math.round((count / stats.totalPatients) * 100) : 0;
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{count}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                    <div style={{ background: 'var(--accent)', borderRadius: 4, height: '100%', width: `${pct}%`, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔴 High Risk Patients</span>
                <strong style={{ color: 'var(--red)' }}>{stats?.patientsByRisk?.high || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <strong>Recent Activity</strong>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/inbox')}>Open inbox</button>
          </div>
          <div>
            {(stats?.recentActivity || []).slice(0, 5).map(m => (
              <div key={m.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{m.direction === 'inbound' ? '📩' : '📤'}</span>
                  <div>
                    <span style={{ fontWeight: 500 }}>{m.patientName}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>— {m.content.substring(0, 60)}...</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{fmtDate(m.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
