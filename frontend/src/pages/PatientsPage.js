import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

const STAGES = [
  { key: '', label: 'All' },
  { key: 'first_trimester', label: 'T1' },
  { key: 'second_trimester', label: 'T2' },
  { key: 'third_trimester', label: 'T3' },
  { key: 'postnatal', label: 'Postnatal' }
];

const RISK = [
  { key: '', label: 'All Risk' },
  { key: 'high', label: 'High Risk' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' }
];

function stageBadge(s) {
  const map = { first_trimester: 'badge-first', second_trimester: 'badge-second', third_trimester: 'badge-third', postnatal: 'badge-postnatal' };
  const labels = { first_trimester: 'T1', second_trimester: 'T2', third_trimester: 'T3', postnatal: 'Postnatal' };
  return <span className={`badge ${map[s] || ''}`}>{labels[s] || s}</span>;
}

function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '—'; }

function AddPatientModal({ onClose, onSave }) {
  const api = useApi();
  const [form, setForm] = useState({ name: '', whatsappNumber: '', age: '', edd: '', bloodType: '', medicalHistory: '', assignedDoctor: '', riskLevel: 'low' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { const p = await api.post('/api/patients', form); onSave(p); } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add New Patient</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">WhatsApp Number *</label><input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} placeholder="+923001234567" required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Age *</label><input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} min="15" max="55" required /></div>
              <div className="form-group"><label className="form-label">Expected Delivery Date (EDD) *</label><input type="date" value={form.edd} onChange={e => setForm({...form, edd: e.target.value})} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Blood Type</label><select value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}><option value="">Select</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Risk Level</label><select value={form.riskLevel} onChange={e => setForm({...form, riskLevel: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Assigned Doctor</label><input value={form.assignedDoctor} onChange={e => setForm({...form, assignedDoctor: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Medical History</label><textarea value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})} placeholder="Previous conditions, surgeries, medications..." /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Patient'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkUploadModal({ onClose, onDone }) {
  const api = useApi();
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleCsv = `name,whatsappNumber,age,edd,bloodType,riskLevel,medicalHistory,assignedDoctor
Amna Khan,+923001111111,27,2026-09-10,O+,low,No history,Dr. Ayesha Mehra
Rabia Iqbal,+923002222222,33,2026-07-20,A+,medium,Previous C-section,Dr. Bilal Qureshi`;

  const handleUpload = async () => {
    setLoading(true);
    try {
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const patients = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
      const res = await api.post('/api/patients/bulk', { patients });
      setResult(res);
      onDone();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Bulk Upload Patients (CSV)</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!result ? (
            <>
              <div className="alert alert-info">Paste CSV data below. Required columns: name, whatsappNumber, age, edd</div>
              <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCsv(sampleCsv)}
                >
                  Load Sample CSV
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(sampleCsv);
                    alert('Sample CSV copied to clipboard');
                  }}
                >
                  📋 Copy Template
                </button>
              </div>
              <textarea value={csv} onChange={e => setCsv(e.target.value)} placeholder={sampleCsv} style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 160 }} />
            </>
          ) : (
            <div>
              <div className="alert alert-success">✅ Successfully imported {result.created} patients!</div>
              {result.errors?.length > 0 && (
                <div className="alert alert-warning">⚠️ {result.errors.length} rows had errors: {result.errors.map(e => `Row ${e.row}: ${e.error}`).join(', ')}</div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{result ? 'Close' : 'Cancel'}</button>
          {!result && <button className="btn btn-primary" onClick={handleUpload} disabled={!csv.trim() || loading}>{loading ? 'Uploading...' : 'Upload Patients'}</button>}
        </div>
      </div>
    </div>
  );
}

function SendMessageModal({ patient, onClose, onSent }) {
  const api = useApi();
  const [content, setContent] = useState('');
  const [type, setType] = useState('outbound');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  const templates = [
    { label: 'Appointment reminder (24h)', text: `Dear ${patient.name}, reminder: you have a hospital appointment tomorrow. Please ensure you bring all previous reports. — AsmaMedical` },
    { label: 'Post-visit follow-up', text: `Dear ${patient.name}, how are you feeling after your recent visit? Please let us know if you have any concerns. — AsmaMedical` },
    { label: 'Pregnancy milestone', text: `Dear ${patient.name}, congratulations on reaching Week ${patient.pregnancyWeek || '—'}! Please remember to attend your routine checkup. — AsmaMedical` },
    { label: 'Emergency info', text: `Dear ${patient.name}, in case of emergency please call our 24/7 helpline: 042-111-000-000 or go to the nearest emergency. — AsmaMedical` }
  ];

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post('/api/messages/send', { patientId: patient.id, content, type });
      setSuccess('Message sent successfully via WhatsApp ✅)');
      setTimeout(() => { onSent(); onClose(); }, 2000);
    } catch (err) { alert(err.message); } finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">💬 Send WhatsApp to {patient.name}</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {success ? <div className="alert alert-success">{success}</div> : (
            <>
              {!patient.optedIn && <div className="alert alert-danger">⚠️ This patient has opted out and cannot receive messages.</div>}
              <div className="form-group">
                <label className="form-label">Quick Templates</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {templates.map((t, i) => (
                    <button key={i} className="btn btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12 }} onClick={() => setContent(t.text)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message..." style={{ minHeight: 100 }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{content.length} characters</div>
              </div>
            </>
          )}
        </div>
        {!success && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn wa-btn" onClick={handleSend} disabled={!content.trim() || !patient.optedIn || sending}>
              {sending ? 'Sending...' : '📤 Send Message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientDetail({ patientId, onRefresh }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMsg, setShowMsg] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const api = useApi();

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/api/patients/${patientId}`).then(setPatient).finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete patient ${patient?.name}? This cannot be undone.`);

    if (!confirmed) return;

    try {
      setDeleting(true);

      await api.delete(`/api/patients/${patientId}`);

      alert('Patient deleted successfully');

      onRefresh();

      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!patient) return null;

  return (
    <div style={{ padding: 22, overflowY: 'auto', height: '100%' }}>
      {showMsg && <SendMessageModal patient={patient} onClose={() => setShowMsg(false)} onSent={load} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: patient.riskLevel === 'high' ? 'var(--red-bg)' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
            {patient.name.charAt(0)}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{patient.name}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{patient.whatsappNumber} · Age {patient.age}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm wa-btn" onClick={() => setShowMsg(true)}>
            💬 Message
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: '#dc2626', color: 'white', border: 'none' }}
          >
            {deleting ? 'Deleting...' : '🗑 Delete'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Stage', value: patient.stage?.replace('_', ' ') || '—' },
          { label: 'EDD', value: patient.edd ? new Date(patient.edd).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
          { label: 'Week', value: patient.pregnancyWeek ? `Wk ${patient.pregnancyWeek}` : patient.postnatalDay ? `Day ${patient.postnatalDay}` : '—' },
          { label: 'Risk', value: patient.riskLevel || '—' }
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {stageBadge(patient.stage)}
        <span className={`badge badge-${patient.riskLevel}`}>{patient.riskLevel} risk</span>
        <span className={`badge ${patient.optedIn ? 'badge-optin' : 'badge-optout'}`}>{patient.optedIn ? '✓ Opted In' : '✗ Opted Out'}</span>
        {patient.bloodType && <span className="badge" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>🩸 {patient.bloodType}</span>}
      </div>

      {/* Medical history */}
      {patient.medicalHistory && (
        <div style={{ background: 'var(--amber-bg)', borderLeft: '3px solid var(--amber)', padding: '12px 14px', borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>MEDICAL HISTORY</div>
          <div style={{ fontSize: 13 }}>{patient.medicalHistory}</div>
        </div>
      )}

      {/* Upcoming appointments */}
      {patient.appointments?.filter(a => a.status === 'scheduled').length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Upcoming Appointments</div>
          {patient.appointments.filter(a => a.status === 'scheduled').map(a => (
            <div key={a.id} style={{ background: 'var(--blue-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontWeight: 500 }}>{a.type}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.date} at {a.time} · {a.doctor}</div>
              {a.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📝 {a.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Message history */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Message History</div>
      {patient.messages?.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {patient.messages?.slice(0, 8).map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: m.direction === 'outbound' ? 'row-reverse' : 'row', gap: 8 }}>
              <div className={`message-bubble ${m.direction}`}>
                <div>{m.content}</div>
                <div className="message-meta" style={{ textAlign: m.direction === 'outbound' ? 'right' : 'left' }}>
                  {new Date(m.sentAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {m.direction === 'outbound' && ` · ${m.status}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const api = useApi();

  const loadPatients = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stageFilter) params.set('stage', stageFilter);
    if (riskFilter) params.set('riskLevel', riskFilter);
    setLoading(true);
    api.get(`/api/patients?${params}`).then(data => { setPatients(data); if (data.length && !selectedId) setSelectedId(data[0].id); }).finally(() => setLoading(false));
  }, [search, stageFilter, riskFilter]);

  useEffect(() => { const t = setTimeout(loadPatients, 300); return () => clearTimeout(t); }, [loadPatients]);

  return (
    <div style={{ height: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' }}>
      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onSave={p => { setShowAdd(false); loadPatients(); setSelectedId(p.id); }} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onDone={() => { setShowBulk(false); loadPatients(); }} />}

      {/* Toolbar */}
      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, background: 'var(--bg-card)', paddingLeft: 0, paddingRight: 0, marginBottom: 0 }}>
        <div className="search-input" style={{ flex: 1, maxWidth: 280 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." />
        </div>
        <div className="filters-bar">
          {STAGES.map(s => <span key={s.key} className={`filter-chip${stageFilter === s.key ? ' active' : ''}`} onClick={() => setStageFilter(s.key)}>{s.label}</span>)}
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ width: 120 }}>
          {RISK.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowBulk(true)}>📋 Bulk Upload</button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Patient</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Patient list */}
        <div className="panel" style={{ borderRight: '1px solid var(--border)' }}>
          {loading ? <div className="loading"><div className="spinner" /></div> : patients.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🤰</div><h3>No patients found</h3><p>Try adjusting your filters.</p></div>
          ) : patients.map(p => (
            <div key={p.id} className={`patient-row${selectedId === p.id ? ' selected' : ''}`} onClick={() => setSelectedId(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="patient-name">{p.name}</div>
                <span className={`badge badge-${p.riskLevel}`}>{p.riskLevel}</span>
              </div>
              <div className="patient-sub">
                {stageBadge(p.stage)}
                {p.pregnancyWeek && <span style={{ marginLeft: 6 }}>· Wk {p.pregnancyWeek}</span>}
                {p.postnatalDay && <span style={{ marginLeft: 6 }}>· Day {p.postnatalDay} postnatal</span>}
              </div>
              <div className="patient-sub" style={{ marginTop: 4 }}>
                EDD: {p.edd || '—'} · {p.optedIn ? '✓ WhatsApp' : '✗ Opted out'}
              </div>
              {p.lastContact && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>Last: {fmtDate(p.lastContact)}</div>}
            </div>
          ))}
        </div>

        {/* Patient detail */}
        <div style={{ overflow: 'hidden', background: 'var(--bg-card)' }}>
          {selectedId ? <PatientDetail key={selectedId} patientId={selectedId} onRefresh={loadPatients} /> : (
            <div className="empty-state"><div className="empty-state-icon">👈</div><h3>Select a patient</h3><p>Click a patient from the list to view their profile.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
