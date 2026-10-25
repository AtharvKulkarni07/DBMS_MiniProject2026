import React, { useState } from 'react';
import { useToast } from '../components/Toast';
import api from '../services/api';

export default function Settings() {
  const [demonstrationMode, setDemonstrationMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleTestConnection = async () => {
    try {
      const res = await api.get('/api/health');
      showSuccess(`Database connection verified: ${res.data.database} running on port 3306.`);
    } catch (err) {
      showError(`Connection check failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>System Settings & Database Configuration</h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Environment variables, connection credentials, and local runtime management
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {/* Database Connection Profile */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">MySQL Database Connection Profile</div>
              <div className="card-subtitle">Active parameters configured via backend/.env</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleTestConnection}>
              Test Connection
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Database Host</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>127.0.0.1</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Port</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>3306 (XAMPP MySQL)</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Database Name</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>disease_surveillance_db</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Storage Engine</div>
                <div style={{ fontWeight: 600 }}>InnoDB (ACID Compliant)</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>phpMyAdmin Direct Access</div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                Inspect the database, execute raw SQL queries, and view trigger structures via XAMPP web portal:
              </p>
              <a
                href="http://localhost/phpmyadmin/index.php?route=/database/structure&db=disease_surveillance_db"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                Open http://localhost/phpmyadmin/
              </a>
            </div>
          </div>
        </div>

        {/* Demonstration Mode & Viva Preferences */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Academic Demonstration Preferences</div>
              <div className="card-subtitle">Settings optimized for practical viva presentations</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Demonstration Mode Label</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Displays 'Demonstration Data' badges across tables and charts
                </div>
              </div>
              <input
                type="checkbox"
                checked={demonstrationMode}
                onChange={(e) => setDemonstrationMode(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Polling & Auto-Refresh</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Periodically poll backend for surveillance updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Academic Citation & Repository</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                GitHub Repository:{' '}
                <a
                  href="https://github.com/AtharvKulkarni07/DBMS_MiniProject2026"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  AtharvKulkarni07/DBMS_MiniProject2026
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Prompt (CMD) Execution Cheatsheet */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Command Line Interface (CMD) Execution Cheatsheet</div>
            <div className="card-subtitle">Run the entire application stack directly from Command Prompt</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                1. Initialize / Reset Database:
              </div>
              <div className="sql-box">python scripts/init_database.py</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                2. Run Automated Test Suite:
              </div>
              <div className="sql-box">pytest -v backend</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                3. Launch FastAPI Backend:
              </div>
              <div className="sql-box">python -m uvicorn app.main:app --reload</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                4. Launch React Frontend:
              </div>
              <div className="sql-box">npm run dev</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
