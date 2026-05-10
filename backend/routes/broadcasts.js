const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(db.broadcasts.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)));
});

router.post('/send', (req, res) => {
  const { title, content, targetSegment } = req.body;
  if (!title || !content || !targetSegment) return res.status(400).json({ error: 'title, content, targetSegment required' });

  let targets = db.patients.filter(p => p.optedIn);
  if (targetSegment !== 'all') targets = targets.filter(p => p.stage === targetSegment || p.riskLevel === targetSegment);

  targets.forEach(patient => {
    db.messages.push({ id: uuidv4(), patientId: patient.id, patientName: patient.name, type: 'broadcast', content, direction: 'outbound', status: 'delivered', sentAt: new Date().toISOString(), deliveredAt: new Date().toISOString(), sentBy: req.user.name });
    patient.lastContact = new Date().toISOString();
    console.log(`[Broadcast] Simulated to ${patient.whatsappNumber}`);
  });

  const broadcast = { id: uuidv4(), title, content, targetSegment, sentCount: targets.length, deliveredCount: targets.length, readCount: 0, sentAt: new Date().toISOString(), status: 'sent', sentBy: req.user.name };
  db.broadcasts.push(broadcast);
  res.status(201).json({ ...broadcast, note: `Simulated send to ${targets.length} patients` });
});

module.exports = router;
