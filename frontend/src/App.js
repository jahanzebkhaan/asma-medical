import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import InboxPage from './pages/InboxPage';
import SchedulePage from './pages/SchedulePage';
import AnalyticsPage from './pages/AnalyticsPage';
import BroadcastPage from './pages/BroadcastPage';

function WhatsAppConnectPage() {
  const [qr, setQr] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/whatsapp/status');
        const data = await res.json();

        if (data.connected) {
          setConnected(true);
          return;
        }

        const qrRes = await fetch('http://localhost:5000/api/whatsapp/qr');
        const qrData = await qrRes.json();

        if (qrData.success) {
          setQr(qrData.qr);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '40px' }}>
      <h2>WhatsApp Integration</h2>

      {connected ? (
        <div>
          <h3 style={{ color: 'green' }}>✅ WhatsApp Connected</h3>
          <p>AsmaMedical is successfully linked to WhatsApp.</p>
        </div>
      ) : qr ? (
        <div>
          <p>Scan this QR code with WhatsApp:</p>

          <img
            alt="WhatsApp QR"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`}
          />
        </div>
      ) : (
        <p>Generating WhatsApp QR...</p>
      )}
    </div>
  );
}

function PrivateLayout({ children, title }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" />Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateLayout title="Dashboard"><DashboardPage /></PrivateLayout>} />
          <Route path="/patients" element={<PrivateLayout title="Patients"><PatientsPage /></PrivateLayout>} />
          <Route path="/inbox" element={<PrivateLayout title="Shared Inbox"><InboxPage /></PrivateLayout>} />
          <Route path="/schedule" element={<PrivateLayout title="Schedule & Follow-ups"><SchedulePage /></PrivateLayout>} />
          <Route path="/analytics" element={<PrivateLayout title="Analytics"><AnalyticsPage /></PrivateLayout>} />
          <Route path="/broadcast" element={<PrivateLayout title="Broadcast Messages"><BroadcastPage /></PrivateLayout>} />
          <Route path="/whatsapp" element={<PrivateLayout title="WhatsApp Integration"><WhatsAppConnectPage /></PrivateLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
