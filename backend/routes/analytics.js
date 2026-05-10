const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/summary', (req, res) => {
  const msgs = db.messages.filter(m => m.direction === 'outbound');
  const delivered = msgs.filter(m => ['delivered', 'read'].includes(m.status)).length;
  const read = msgs.filter(m => m.status === 'read').length;
  const inbound = db.messages.filter(m => m.direction === 'inbound').length;

  const byType = {};
  db.messages.forEach(m => {
    if (m.direction === 'outbound') byType[m.type] = (byType[m.type] || 0) + 1;
  });

  const byStage = {};
  db.patients.forEach(p => { byStage[p.stage] = (byStage[p.stage] || 0) + 1; });

  const byRisk = {};
  db.patients.forEach(p => { byRisk[p.riskLevel] = (byRisk[p.riskLevel] || 0) + 1; });

  res.json({
    totalPatients: db.patients.length,
    optedIn: db.patients.filter(p => p.optedIn).length,
    optedOut: db.patients.filter(p => !p.optedIn).length,
    totalMessagesSent: msgs.length,
    deliveryRate: msgs.length ? Math.round((delivered / msgs.length) * 100) : 0,
    readRate: msgs.length ? Math.round((read / msgs.length) * 100) : 0,
    responseRate: msgs.length ? Math.round((inbound / msgs.length) * 100) : 0,
    inboundMessages: inbound,
    pendingFollowups: db.followups.filter(f => f.status === 'pending').length,
    overdueFollowups: db.followups.filter(f => f.status === 'overdue').length,
    upcomingAppointments: db.appointments.filter(a => a.status === 'scheduled').length,
    messagesByType: byType,
    patientsByStage: byStage,
    patientsByRisk: byRisk,
    broadcasts: db.broadcasts.length,
    recentActivity: db.messages.slice(-10).reverse()
  });
});

module.exports = router;
