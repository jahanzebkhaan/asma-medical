import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⬛' },
  { path: '/patients', label: 'Patients', icon: '🤰' },
  { path: '/inbox', label: 'WhatsApp Inbox', icon: '💬' },
  { path: '/schedule', label: 'Schedule', icon: '📅' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/broadcast', label: 'Broadcast', icon: '📢' }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>AsmaMedical</h1>
        <p>Hospital WhatsApp Platform</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path} className={`nav-item${location.pathname === item.path ? ' active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
