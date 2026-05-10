# AsmaMedical - Hospital WhatsApp Engagement Platform

## Quick Start (VS Code)

### Prerequisites
- Node.js 18+ installed
- npm installed

### Step 1: Start the Backend
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:5000

### Step 2: Start the Frontend (new terminal)
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

### Login Credentials
| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@AsmaMedical.pk     | password123 |
| Doctor| doctor@AsmaMedical.pk    | password123 |
| Nurse | nurse@AsmaMedical.pk     | password123 |

---

## Project Structure
```
AsmaMedical/
├── backend/
│   ├── server.js           # Express server entry point
│   ├── database.js         # In-memory DB with seed data
│   ├── .env                # Environment variables
│   ├── middleware/
│   │   └── auth.js         # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js         # Login/logout
│   │   ├── patients.js     # Patient CRUD
│   │   ├── messages.js     # WhatsApp messaging
│   │   ├── appointments.js # Appointment management
│   │   ├── followups.js    # Follow-up tracker
│   │   ├── analytics.js    # Dashboard metrics
│   │   └── broadcasts.js   # Bulk messaging
│   └── services/
│       └── whatsapp.js     # WhatsApp API service
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/
        │   └── AuthContext.js
        ├── hooks/
        │   └── useApi.js
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.js
        │   │   └── TopBar.js
        │   ├── patients/
        │   │   ├── PatientList.js
        │   │   ├── PatientCard.js
        │   │   ├── PatientDetail.js
        │   │   ├── AddPatientModal.js
        │   │   └── BulkUploadModal.js
        │   ├── messages/
        │   │   ├── SharedInbox.js
        │   │   ├── MessageComposer.js
        │   │   └── ConversationView.js
        │   ├── appointments/
        │   │   └── AppointmentManager.js
        │   └── analytics/
        │       └── AnalyticsDashboard.js
        └── pages/
            ├── LoginPage.js
            ├── DashboardPage.js
            ├── PatientsPage.js
            ├── InboxPage.js
            ├── SchedulePage.js
            ├── AnalyticsPage.js
            └── BroadcastPage.js
```

## Features
- Patient management with CSV bulk upload
- WhatsApp automated messaging (Twilio integration ready)
- Appointment reminders (24h and 2h)
- Milestone-based pregnancy week reminders
- Postnatal follow-up workflows
- Shared staff inbox
- Analytics dashboard
- Role-based access (Admin / Doctor / Nurse)

## WhatsApp Setup (Production)
1. Create a Twilio account at twilio.com
2. Enable WhatsApp Sandbox or apply for WhatsApp Business API
3. Add your credentials to backend/.env
4. Templates are pre-configured in services/whatsapp.js
