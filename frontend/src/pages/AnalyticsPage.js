import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApi } from '../hooks/useApi';

const COLORS = ['#c2185b', '#1565c0', '#2e7d32', '#e65100', '#4a148c', '#00838f'];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={color ? { color } : {}}>{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        {icon && <span style={{ fontSize: 26 }}>{icon}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    api.get('/api/analytics/summary').then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading analytics...</div>;
  if (!stats) return <div className="alert alert-danger">Failed to load analytics.</div>;

  const stageData = Object.entries(stats.patientsByStage || {}).map(([k, v]) => ({
    name: { first_trimester: 'T1', second_trimester: 'T2', third_trimester: 'T3', postnatal: 'Postnatal' }[k] || k,
    value: v
  }));

  const riskData = Object.entries(stats.patientsByRisk || {}).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v
  }));

  const msgTypeData = Object.entries(stats.messagesByType || {}).map(([k, v]) => ({
    name: { milestone: 'Milestone', appointment: 'Appointment', followup: 'Follow-up', postnatal: 'Postnatal', broadcast: 'Broadcast', outbound: 'Direct' }[k] || k,
    count: v
  }));

  const engagementData = [
    { name: 'Sent', value: 100, fill: '#e3f2fd' },
    { name: 'Delivered', value: stats.deliveryRate, fill: '#1565c0' },
    { name: 'Read', value: stats.readRate, fill: '#2e7d32' },
    { name: 'Responded', value: stats.responseRate, fill: '#c2185b' }
  ];

  return (
    <div>
      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Patients" value={stats.totalPatients} sub={`${stats.optedIn} opted in · ${stats.optedOut} opted out`} icon="🤰" />
        <StatCard label="Messages Sent" value={stats.totalMessagesSent} sub="all time" icon="📤" />
        <StatCard label="Delivery Rate" value={`${stats.deliveryRate}%`} color="var(--green)" icon="✅" sub="of sent messages delivered" />
        <StatCard label="Read Rate" value={`${stats.readRate}%`} color="var(--blue)" icon="👁️" sub="of sent messages read" />
        <StatCard label="Response Rate" value={`${stats.responseRate}%`} color="var(--accent)" icon="💬" sub="patient replies received" />
        <StatCard label="Inbound Messages" value={stats.inboundMessages} sub="patient replies" icon="📩" />
        <StatCard label="Pending Follow-ups" value={stats.pendingFollowups} color={stats.pendingFollowups > 0 ? 'var(--amber)' : 'var(--green)'} icon="⏳" />
        <StatCard label="Overdue Follow-ups" value={stats.overdueFollowups} color={stats.overdueFollowups > 0 ? 'var(--red)' : 'var(--green)'} sub={stats.overdueFollowups > 0 ? 'Needs attention!' : 'All clear'} icon="🚨" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Engagement funnel */}
        <div className="card">
          <div className="card-header"><strong>Message Engagement Funnel</strong></div>
          <div style={{ padding: '16px 20px' }}>
            {engagementData.map((d, i) => (
              <div key={d.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  <span style={{ fontWeight: 600 }}>{d.value}%</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 6, height: 10 }}>
                  <div style={{ background: COLORS[i], borderRadius: 6, height: '100%', width: `${d.value}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient by stage pie */}
        <div className="card">
          <div className="card-header"><strong>Patients by Stage</strong></div>
          <div style={{ padding: 16 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {stageData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {stageData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                  <span>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk levels pie */}
        <div className="card">
          <div className="card-header"><strong>Risk Level Distribution</strong></div>
          <div style={{ padding: 16 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskData.map((entry, i) => {
                    const c = { High: '#b71c1c', Medium: '#e65100', Low: '#2e7d32' }[entry.name] || COLORS[i];
                    return <Cell key={i} fill={c} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Messages by type bar */}
        <div className="card">
          <div className="card-header"><strong>Messages by Type</strong></div>
          <div style={{ padding: '16px 20px' }}>
            {msgTypeData.length === 0 ? (
              <div className="empty-state"><p>No message data yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={msgTypeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="card">
          <div className="card-header"><strong>Quick Summary</strong></div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Broadcasts sent', value: stats.broadcasts, icon: '📢' },
              { label: 'Upcoming appointments', value: stats.upcomingAppointments, icon: '📅' },
              { label: 'High-risk patients', value: stats.patientsByRisk?.high || 0, icon: '🔴', color: 'var(--red)' },
              { label: 'Opted-out patients', value: stats.optedOut, icon: '🚫', color: 'var(--amber)' }
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                </div>
                <strong style={s.color ? { color: s.color } : {}}>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-header"><strong>Recent Message Activity</strong></div>
        <div className="table-wrap">
          {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
            <div className="empty-state"><p>No activity yet.</p></div>
          ) : (
            <table>
              <thead>
                <tr><th>Patient</th><th>Direction</th><th>Type</th><th>Message</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {stats.recentActivity.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.patientName}</strong></td>
                    <td>{m.direction === 'inbound' ? '📩 Inbound' : '📤 Outbound'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.type}</td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>{m.content}</td>
                    <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.sentAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
