const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { patientId, status, date } = req.query;
  let list = [...db.appointments];
  if (patientId) list = list.filter(a => a.patientId === patientId);
  if (status) list = list.filter(a => a.status === status);
  if (date) list = list.filter(a => a.date === date);
  res.json(list.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)));
});

router.post('/', (req, res) => {
  const { patientId, doctor, type, date, time, notes } = req.body;
  if (!patientId || !date || !time || !type) return res.status(400).json({ error: 'patientId, type, date, time required' });
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const appt = { id: uuidv4(), patientId, patientName: patient.name, doctor: doctor || patient.assignedDoctor, type, date, time, status: 'scheduled', reminderSent24h: false, reminderSent2h: false, notes: notes || '', createdAt: new Date().toISOString() };
  db.appointments.push(appt);

  // Auto-create follow-up reminders
  const apptDate = new Date(`${date}T${time}`);
  db.followups.push({ id: uuidv4(), patientId, patientName: patient.name, type: 'appointment', description: `${type} - 24h reminder`, scheduledFor: new Date(apptDate - 24 * 3600e3).toISOString(), status: 'pending', autoTrigger: true, templateName: 'APPT_REMINDER_24H', appointmentId: appt.id });
  db.followups.push({ id: uuidv4(), patientId, patientName: patient.name, type: 'appointment', description: `${type} - 2h reminder`, scheduledFor: new Date(apptDate - 2 * 3600e3).toISOString(), status: 'pending', autoTrigger: true, templateName: 'APPT_REMINDER_2H', appointmentId: appt.id });

  res.status(201).json(appt);
});

router.put('/:id', (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });
  db.appointments[idx] = { ...db.appointments[idx], ...req.body, id: req.params.id };
  res.json(db.appointments[idx]);
});

router.put('/:id/complete', (req, res) => {
  const appt = db.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  appt.status = 'completed';
  appt.completedAt = new Date().toISOString();

  // Auto-schedule post-visit follow-up after 2 days
  const patient = db.patients.find(p => p.id === appt.patientId);
  if (patient) {
    db.followups.push({ id: uuidv4(), patientId: appt.patientId, patientName: appt.patientName, type: 'followup', description: `Post-visit follow-up (${appt.type})`, scheduledFor: new Date(Date.now() + 2 * 864e5).toISOString(), status: 'pending', autoTrigger: true, templateName: 'POST_VISIT_2D', appointmentId: appt.id });
  }
  res.json(appt);
});

router.delete('/:id', (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });
  db.appointments[idx].status = 'cancelled';
  res.json({ message: 'Cancelled' });
});

module.exports = router;
