const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const db = { users: [], patients: [], messages: [], appointments: [], followups: [], broadcasts: [] };

async function seedDatabase() {
  const hash = await bcrypt.hash('password123', 10);
  db.users = [
    { id: uuidv4(), name: 'Nabeel', email: 'admin@AsmaMedical.pk', password: hash, role: 'admin', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Maryam', email: 'maryam@AsmaMedical.pk', password: hash, role: 'owner', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Dr. Asma ', email: 'doctor@AsmaMedical.pk', password: hash, role: 'doctor', createdAt: new Date().toISOString() }
  ];

  db.patients = [];

  db.messages = [];

  db.appointments = [];

  db.followups = [];

  db.broadcasts = [];

  console.log('\n✅ AsmaMedical database seeded');
  console.log(`   Users: ${db.users.length} | Patients: ${db.patients.length} | Messages: ${db.messages.length}\n`);
}

module.exports = { db, seedDatabase };
