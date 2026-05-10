import React from 'react';

export default function TopBar({ title }) {
  return (
    <div className="topbar">
      <h2>{title}</h2>
      <div className="topbar-actions">
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
