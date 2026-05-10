const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, type, patientId } = req.query;
  let list = [...db.followups];
  if (status) list = list.filter(f => f.status === status);
  if (type) list = list.filter(f => f.type === type);
  if (patientId) list = list.filter(f => f.patientId === patientId);
  res.json(list.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)));
});

router.post('/', (req, res) => {
  const { patientId, type, description, scheduledFor, templateName, autoTrigger } = req.body;
  if (!patientId || !description || !scheduledFor) return res.status(400).json({ error: 'patientId, description, scheduledFor required' });
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const f = { id: uuidv4(), patientId, patientName: patient.name, type: type || 'manual', description, scheduledFor, status: 'pending', autoTrigger: autoTrigger || false, templateName: templateName || null, createdAt: new Date().toISOString() };
  db.followups.push(f);
  res.status(201).json(f);
});

// Mark as sent / trigger
router.put('/:id/send', (req, res) => {
  const f = db.followups.find(f => f.id === req.params.id);
  if (!f) return res.status(404).json({ error: 'Follow-up not found' });
  const patient = db.patients.find(p => p.id === f.patientId);

  if (patient && patient.optedIn) {
    const templates = {
      GTT_REMINDER_W28: `Dear ${patient.name}, this is a reminder to schedule your Glucose Tolerance Test (GTT) this week. It is an important check for gestational diabetes at Week 28. — AsmaMedical`,
      APPT_REMINDER_24H: `Dear ${patient.name}, reminder: you have a hospital appointment tomorrow. Please ensure you have fasted if required and bring all previous reports. — AsmaMedical`,
      APPT_REMINDER_2H: `Dear ${patient.name}, your appointment is in 2 hours. Please leave now to arrive on time. — AsmaMedical`,
      POST_VISIT_2D: `Dear ${patient.name}, how are you feeling after your recent visit? Please let us know if you have any concerns or questions about your care. — AsmaMedical`,
      POSTNATAL_D12: `Dear ${patient.name}, Day 12 postnatal check-in: How are you feeling? How is baby feeding? Are you experiencing any signs of baby blues or low mood? Please don't hesitate to reach out. — AsmaMedical`,
      MILESTONE_W10: `Dear ${patient.name}, you are in Week 10! Time to schedule your first trimester screening and nuchal translucency scan. — AsmaMedical`
    };
    const content = templates[f.templateName] || f.description;
    const msg = { id: uuidv4(), patientId: patient.id, patientName: patient.name, type: f.type, templateName: f.templateName, content, direction: 'outbound', status: 'delivered', sentAt: new Date().toISOString(), deliveredAt: new Date().toISOString(), sentBy: req.user.name };
    db.messages.push(msg);
    patient.lastContact = new Date().toISOString();
    console.log(`[WhatsApp] Simulated: ${patient.whatsappNumber} — ${f.templateName}`);
  }

  f.status = 'sent';
  f.sentAt = new Date().toISOString();
  res.json({ followup: f, note: 'Message simulated (add Twilio credentials to send real messages)' });
});

router.put('/:id/dismiss', (req, res) => {
  const f = db.followups.find(f => f.id === req.params.id);
  if (!f) return res.status(404).json({ error: 'Not found' });
  f.status = 'dismissed';
  res.json(f);
});

module.exports = router;
