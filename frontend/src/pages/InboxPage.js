import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : ''; }
function fmtDate(iso) { if (!iso) return ''; const d = new Date(iso); const today = new Date(); return d.toDateString() === today.toDateString() ? fmtTime(iso) : d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }); }

export default function InboxPage() {
  const [threads, setThreads] = useState([]);
  const [patients, setPatients] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const api = useApi();

  const loadThreads = useCallback(() => {
    api.get('/api/messages/threads').then(setThreads);
    api.get('/api/patients').then(setPatients);
  }, []);

  useEffect(() => { loadThreads(); setLoading(false); }, [loadThreads]);

  const selectPatient = async (patientId) => {
    setSelectedPatientId(patientId);
    const msgs = await api.get(`/api/messages/conversation/${patientId}`);
    setConversation(msgs);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedPatientId) return;
    setSending(true);
    try {
      await api.post('/api/messages/send', { patientId: selectedPatientId, content: message });
      setMessage('');
      const msgs = await api.get(`/api/messages/conversation/${selectedPatientId}`);
      setConversation(msgs);
      loadThreads();
    } catch (err) { alert(err.message); } finally { setSending(false); }
  };

  const simulateInbound = async () => {
    const sample = ['Hello, I have a question about my medication.', 'When is my next appointment?', 'I am feeling some discomfort, is this normal?', 'Thank you for the reminder!'];
    const msg = sample[Math.floor(Math.random() * sample.length)];
    await api.post('/api/messages/receive', { patientId: selectedPatientId, content: msg });
    const msgs = await api.get(`/api/messages/conversation/${selectedPatientId}`);
    setConversation(msgs);
    loadThreads();
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const filteredThreads = threads.filter(t => {
    if (tab === 'inbound') return t.direction === 'inbound';
    if (tab === 'unread') return t.status !== 'read';
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 58px)' }}>

      {/* Thread list */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Conversations ({threads.length})</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'inbound', 'unread'].map(t => (
              <span key={t} className={`filter-chip${tab === t ? ' active' : ''}`} style={{ fontSize: 11 }} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            ))}
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filteredThreads.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💬</div><h3>No conversations</h3></div>
          ) : filteredThreads.map(t => (
            <div key={t.patientId} className={`patient-row${selectedPatientId === t.patientId ? ' selected' : ''}`} onClick={() => selectPatient(t.patientId)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="patient-name">{t.patientName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{fmtDate(t.sentAt)}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                {t.direction === 'inbound' ? '📩' : '📤'}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{t.content}</span>
              </div>
              <span className={`badge badge-${t.status}`} style={{ marginTop: 4 }}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation panel */}
      {!selectedPatientId ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div className="empty-state"><div className="empty-state-icon">💬</div><h3>Select a conversation</h3><p>Choose a patient thread from the left to view and reply.</p></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{selectedPatient?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedPatient?.whatsappNumber} · {selectedPatient?.stage?.replace('_', ' ')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${selectedPatient?.optedIn ? 'badge-optin' : 'badge-optout'}`}>{selectedPatient?.optedIn ? '✓ Opted In' : '✗ Opted Out'}</span>
              <button className="btn btn-sm btn-secondary" onClick={simulateInbound} title="Simulate an inbound reply for testing">📩 Simulate Reply</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {conversation.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📭</div><h3>No messages yet</h3></div>
            ) : conversation.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: m.direction === 'outbound' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                <div className={`message-bubble ${m.direction}`}>
                  {m.templateName && <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 4, fontWeight: 500 }}>📋 {m.templateName}</div>}
                  <div>{m.content}</div>
                  <div className="message-meta" style={{ textAlign: m.direction === 'outbound' ? 'right' : 'left' }}>
                    {new Date(m.sentAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} · {m.direction === 'outbound' ? (m.status === 'read' ? '✓✓ Read' : m.status === 'delivered' ? '✓✓' : '✓') : 'Received'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compose */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            {!selectedPatient?.optedIn && <div className="alert alert-danger" style={{ marginBottom: 10 }}>This patient has opted out and cannot receive messages.</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                disabled={!selectedPatient?.optedIn}
                style={{ minHeight: 60, flex: 1, resize: 'none', fontSize: 13 }}
              />
              <button className="btn wa-btn" onClick={sendMessage} disabled={!message.trim() || !selectedPatient?.optedIn || sending} style={{ alignSelf: 'flex-end' }}>
                {sending ? '...' : '📤 Send'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              ℹ️ Messages are simulated. Add Twilio credentials to backend/.env to send real WhatsApp messages.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
