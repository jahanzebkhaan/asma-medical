import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

function fmtDT(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AddAppointmentModal({ onClose, onSaved }) {
  const api = useApi();
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patientId: '', type: '', date: '', time: '10:00', doctor: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/api/patients').then(setPatients); }, []);

  const apptTypes = ['OB Checkup', 'Anomaly Scan', 'Growth Scan', 'Glucose Tolerance Test', 'Blood Test', 'First Trimester Screening', 'Postnatal Checkup', 'Vaccination', 'Ultrasound', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const selected = patients.find(p => p.id === form.patientId);
      await api.post('/api/appointments', { ...form, doctor: form.doctor || selected?.assignedDoctor });
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📅 New Appointment</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="alert alert-info">Appointment reminders (24h and 2h) will be auto-scheduled for this patient.</div>
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.whatsappNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Appointment Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                <option value="">Select type...</option>
                {apptTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor</label>
              <input value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} placeholder="Will use patient's assigned doctor" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Special instructions, preparation required..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Appointment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFollowupModal({ onClose, onSaved }) {
  const api = useApi();
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patientId: '', description: '', scheduledFor: '', type: 'manual', templateName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/api/patients').then(setPatients); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.post('/api/followups', form); onSaved(); } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">➕ Add Follow-up Task</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="manual">Manual</option>
                <option value="milestone">Milestone</option>
                <option value="followup">Post-visit</option>
                <option value="postnatal">Postnatal</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Week 32 glucose reminder" required />
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled For *</label>
              <input type="datetime-local" value={form.scheduledFor} onChange={e => setForm({ ...form, scheduledFor: new Date(e.target.value).toISOString() })} required />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Template Name (optional)</label>
              <input value={form.templateName} onChange={e => setForm({ ...form, templateName: e.target.value })} placeholder="e.g. MILESTONE_W32" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Follow-up'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [tab, setTab] = useState('appointments');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [showAddFu, setShowAddFu] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const api = useApi();

  const load = useCallback(() => {
    api.get('/api/appointments' + (statusFilter ? `?status=${statusFilter}` : '')).then(setAppointments);
    api.get('/api/followups').then(setFollowups);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const completeAppt = async (id) => {
    await api.put(`/api/appointments/${id}/complete`, {});
    setActionMsg('Appointment marked complete. Post-visit follow-up auto-scheduled for 2 days.');
    setTimeout(() => setActionMsg(''), 4000);
    load();
  };

  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await api.del(`/api/appointments/${id}`);
    load();
  };

  const sendFollowup = async (id) => {
    const res = await api.put(`/api/followups/${id}/send`, {});
    setActionMsg(res.note || 'Follow-up sent!');
    setTimeout(() => setActionMsg(''), 4000);
    load();
  };

  const dismissFollowup = async (id) => {
    await api.put(`/api/followups/${id}/dismiss`, {});
    load();
  };

  const fuByStatus = (s) => followups.filter(f => f.status === s);
  const pendingFu = fuByStatus('pending');
  const overdueFu = fuByStatus('overdue');
  const sentFu = fuByStatus('sent');

  return (
    <div>
      {showAddAppt && <AddAppointmentModal onClose={() => setShowAddAppt(false)} onSaved={() => { setShowAddAppt(false); load(); }} />}
      {showAddFu && <AddFollowupModal onClose={() => setShowAddFu(false)} onSaved={() => { setShowAddFu(false); load(); }} />}

      {actionMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {actionMsg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['appointments', `📅 Appointments (${appointments.length})`], ['followups', `🔔 Follow-ups (${pendingFu.length + overdueFu.length} active)`]].map(([key, label]) => (
            <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'appointments' && (
            <>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddAppt(true)}>+ New Appointment</button>
            </>
          )}
          {tab === 'followups' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddFu(true)}>+ Add Follow-up</button>
          )}
        </div>
      </div>

      {/* Appointments Tab */}
      {tab === 'appointments' && (
        <div className="card">
          <div className="table-wrap">
            {appointments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No appointments</h3><p>Schedule one using the button above.</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Doctor</th>
                    <th>Reminders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.patientName}</strong></td>
                      <td>{a.type}</td>
                      <td>{a.date} {a.time}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.doctor || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className={`badge ${a.reminderSent24h ? 'badge-delivered' : 'badge-pending'}`} style={{ fontSize: 10 }}>24h {a.reminderSent24h ? '✓' : '⏳'}</span>
                          <span className={`badge ${a.reminderSent2h ? 'badge-delivered' : 'badge-pending'}`} style={{ fontSize: 10 }}>2h {a.reminderSent2h ? '✓' : '⏳'}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${a.status === 'scheduled' ? 'pending' : a.status === 'completed' ? 'delivered' : 'optout'}`}>{a.status}</span></td>
                      <td>
                        {a.status === 'scheduled' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-success" onClick={() => completeAppt(a.id)}>✓ Done</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => cancelAppt(a.id)}>Cancel</button>
                          </div>
                        )}
                        {a.status === 'completed' && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Completed</span>}
                        {a.status === 'cancelled' && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancelled</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Follow-ups Tab */}
      {tab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overdue */}
          {overdueFu.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ background: 'var(--red-bg)' }}>
                <strong style={{ color: 'var(--red)' }}>🚨 Overdue ({overdueFu.length})</strong>
              </div>
              {overdueFu.map(f => (
                <div key={f.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--red-bg)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{f.patientName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--red)' }}>Was due: {fmtDT(f.scheduledFor)}</div>
                    {f.templateName && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Template: {f.templateName}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm wa-btn" onClick={() => sendFollowup(f.id)}>📤 Send Now</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => dismissFollowup(f.id)}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending */}
          <div className="card">
            <div className="card-header">
              <strong>⏳ Pending ({pendingFu.length})</strong>
            </div>
            {pendingFu.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">✅</div><h3>All clear!</h3></div>
            ) : pendingFu.map(f => (
              <div key={f.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{f.patientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Scheduled: {fmtDT(f.scheduledFor)} · {f.autoTrigger ? '🤖 Auto' : '👤 Manual'}</div>
                  {f.templateName && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Template: {f.templateName}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm wa-btn" onClick={() => sendFollowup(f.id)}>📤 Send Now</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => dismissFollowup(f.id)}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>

          {/* Sent */}
          <div className="card">
            <div className="card-header"><strong>✅ Sent ({sentFu.length})</strong></div>
            {sentFu.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}><p>No sent follow-ups yet.</p></div>
            ) : sentFu.slice(0, 5).map(f => (
              <div key={f.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{f.patientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.description}</div>
                </div>
                <span className="badge badge-delivered">Sent ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
