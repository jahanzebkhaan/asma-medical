const express = require('express');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const whatsapp = require('../whatsapp');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

// Get all messages (inbox view)
router.get('/', async (req, res) => {
  try {
    const { patientId, direction, type } = req.query;

    let query = {};

    if (patientId) query.patientId = patientId;
    if (direction) query.direction = direction;
    if (type) query.type = type;

    const messages = await Message.find(query)
      .sort({ sentAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation threads (unique patients with latest message)
router.get('/threads', async (req, res) => {
  try {
    const messages = await Message.find().sort({ sentAt: -1 });

    const threads = {};

    messages.forEach(m => {
      if (!threads[m.patientId]) {
        threads[m.patientId] = m;
      }
    });

    res.json(Object.values(threads));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get messages for one patient (conversation)
router.get('/conversation/:patientId', async (req, res) => {
  try {
    const normalizedPatientId = String(req.params.patientId).trim();
    const msgs = await Message.find({
      patientId: normalizedPatientId
    }).sort({ sentAt: 1 });

    res.json(msgs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a real WhatsApp message
router.post('/send', async (req, res) => {
  try {
    const { patientId, content, type = 'outbound', templateName } = req.body;
    const normalizedPatientId = String(patientId).trim();

    if (!normalizedPatientId || !content) {
      return res.status(400).json({ error: 'patientId and content required' });
    }

    const patient = await Patient.findById(normalizedPatientId);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.optedIn) {
      return res.status(400).json({
        error: 'Patient has opted out of WhatsApp messages'
      });
    }

    const cleanNumber = patient.whatsappNumber
      .replace(/\+/g, '')
      .replace(/\s/g, '');

    const chatId = `${cleanNumber}@c.us`;

    // Send real WhatsApp message
    await whatsapp.client.sendMessage(chatId, content);

    const msg = new Message({
      patientId: normalizedPatientId,
      patientName: patient.name,
      type,
      templateName: templateName || null,
      content,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(),
      sentBy: req.user.name
    });

    await msg.save();
    patient.lastContact = new Date();
    await patient.save();

    console.log(`✅ Real WhatsApp message sent to ${patient.whatsappNumber}`);

    res.status(201).json({
      success: true,
      message: msg,
      note: 'Real WhatsApp message sent successfully'
    });
  } catch (error) {
    console.error('❌ WhatsApp send failed:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message'
    });
  }
});

// Simulate receiving an inbound message (for testing)
router.post('/receive', async (req, res) => {
  try {
    const { patientId, content } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const msg = new Message({
      patientId,
      patientName: patient.name,
      type: 'inbound',
      content,
      direction: 'inbound',
      status: 'received',
      sentAt: new Date()
    });

    await msg.save();
    patient.lastContact = new Date();
    await patient.save();
    res.status(201).json(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to receive message' });
  }
});

// WhatsApp webhook (for Twilio/Meta to post to)
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;
    const phone = From ? From.replace('whatsapp:', '') : null;
    if (phone && Body) {
      const patient = await Patient.findOne({ whatsappNumber: phone });
      if (patient) {
        const msg = new Message({
          patientId: patient._id.toString(),
          patientName: patient.name,
          type: 'inbound',
          content: Body,
          direction: 'inbound',
          status: 'received',
          sentAt: new Date()
        });

        await msg.save();
        patient.lastContact = new Date();
        await patient.save();
      }
    }
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error(error);
    res.status(500).send('<Response></Response>');
  }
});

module.exports = router;
