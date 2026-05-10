import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const SEGMENTS = [
  { key: 'all', label: 'All Opted-in Patients', icon: '👥', desc: 'All patients who have opted in to WhatsApp' },
  { key: 'first_trimester', label: 'First Trimester', icon: '🌱', desc: 'Patients in weeks 1–12' },
  { key: 'second_trimester', label: 'Second Trimester', icon: '🤰', desc: 'Patients in weeks 13–26' },
  { key: 'third_trimester', label: 'Third Trimester', icon: '🍼', desc: 'Patients in weeks 27–40' },
  { key: 'postnatal', label: 'Postnatal Mothers', icon: '👶', desc: 'Post-delivery patients' },
  { key: 'high', label: 'High-Risk Patients', icon: '🔴', desc: 'Patients flagged as high risk' }
];

const TEMPLATES = [
  { title: 'General Health Tip', text: 'Dear patient, staying hydrated and attending all your scheduled checkups is vital during pregnancy. Our team is here to support you every step of the way. — AsmaMedical Hospital' },
  { title: 'Ramadan Advisory', text: 'Dear patient, during Ramadan please ensure you take your prenatal vitamins after iftar, stay hydrated, and contact us immediately if you feel faint or notice reduced fetal movement. — AsmaMedical' },
  { title: 'Vaccination Reminder', text: "Dear patient, please don't forget your baby's vaccination schedule. Early immunisation protects against serious diseases. Visit our immunisation clinic Monday–Saturday, 9 AM–1 PM. — AsmaMedical" },
  { title: 'Appointment Availability', text: 'Dear patient, we have new appointment slots available this week. Please call 042-111-000-000 or WhatsApp us to book your next visit. — AsmaMedical Hospital' },
  { title: 'Emergency Contacts', text: 'Dear patient, our 24/7 emergency helpline is 042-111-000-000. In case of heavy bleeding, severe pain, reduced fetal movement, or any emergency, please call immediately or go to the nearest hospital. — AsmaMedical' },
  { title: 'Mental Health Check-in', text: "Dear patient, pregnancy and the postnatal period can be emotionally challenging. If you're feeling overwhelmed, anxious, or low, please reach out to us — we have dedicated mental health support. You are not alone. — AsmaMedical" }
];

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [segment, setSegment] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const api = useApi();

  useEffect(() => {
    api.get('/api/broadcasts').then(setBroadcasts);
    api.get('/api/patients').then(setPatients);
  }, []);

  const targetCount = () => {
    const opted = patients.filter(p => p.optedIn);
    if (segment === 'all') return opted.length;
    if (['high', 'medium', 'low'].includes(segment)) return opted.filter(p => p.riskLevel === segment).length;
    return opted.filter(p => p.stage === segment).length;
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) { setError('Title and message content are required.'); return; }
    if (!window.confirm(`Send this broadcast to ${targetCount()} patient(s)? This action cannot be undone.`)) return;
    setSending(true); setError('');
    try {
      const res = await api.post('/api/broadcasts/send', { title, content, targetSegment: segment });
      setSuccessMsg(`✅ Broadcast sent to ${res.sentCount} patients! (${res.note})`);
      setTitle(''); setContent('');
      const updated = await api.get('/api/broadcasts');
      setBroadcasts(updated);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) { setError(err.message); } finally { setSending(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

      {/* Compose panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="card-header"><strong>📢 Compose Broadcast</strong></div>
          <div className="card-body">
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Segment selector */}
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SEGMENTS.map(s => (
                  <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${segment === s.key ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', background: segment === s.key ? 'var(--accent-light)' : 'var(--bg-card)', transition: 'all 0.15s' }}>
                    <input type="radio" name="segment" value={s.key} checked={segment === s.key} onChange={() => setSegment(s.key)} style={{ width: 'auto' }} />
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--blue-bg)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              👥 This will reach <strong>{targetCount()}</strong> opted-in patient{targetCount() !== 1 ? 's' : ''}.
            </div>

            <div className="form-group">
              <label className="form-label">Broadcast Title (internal only)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ramadan Health Advisory" />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message here..." style={{ minHeight: 120 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{content.length} characters · WhatsApp allows up to 4096</div>
            </div>

            <button className="btn wa-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSend} disabled={sending || !title.trim() || !content.trim()}>
              {sending ? 'Sending...' : `📤 Send to ${targetCount()} Patient${targetCount() !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Quick templates */}
        <div className="card">
          <div className="card-header"><strong>📋 Quick Templates</strong></div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map((t, i) => (
              <button key={i} className="btn btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 14px', height: 'auto' }}
                onClick={() => { setTitle(t.title); setContent(t.text); }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t.text.substring(0, 60)}...</div>
              </button>
            ))}
          </div>
        </div>

        {/* Broadcast history */}
        <div className="card">
          <div className="card-header"><strong>📜 Broadcast History</strong></div>
          {broadcasts.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📢</div><h3>No broadcasts yet</h3></div>
          ) : broadcasts.map(b => (
            <div key={b.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 500 }}>{b.title}</div>
                <span className="badge badge-delivered">Sent</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{b.content.substring(0, 100)}...</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span>👥 Sent: <strong>{b.sentCount}</strong></span>
                <span>✓✓ Delivered: <strong>{b.deliveredCount}</strong></span>
                <span>👁️ Read: <strong>{b.readCount}</strong></span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                By {b.sentBy} · {new Date(b.sentAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })} · Segment: {b.targetSegment}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
