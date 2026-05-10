require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { seedDatabase } = require('./database');
const whatsapp = require('./whatsapp');
const connectDB = require('./config/db');
connectDB();
const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/broadcasts', require('./routes/broadcasts'));

// WhatsApp QR Endpoint
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    const qr = whatsapp.getQR();

    if (!qr) {
      return res.json({
        success: false,
        message: 'QR not available yet or WhatsApp already connected'
      });
    }

    res.json({
      success: true,
      qr
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch QR'
    });
  }
});

// WhatsApp Connection Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: whatsapp.isReady()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', app: 'AsmaMedical API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║       AsmaMedical API Server           ║');
    console.log(`║       Running on port ${PORT}             ║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Login: admin@AsmaMedical.pk           ║');
    console.log('║  Pass:  password123                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
  });
});
