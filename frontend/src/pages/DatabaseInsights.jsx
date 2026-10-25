import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function DatabaseInsights() {
  const [overview, setOverview] = useState(null);
  const [indexes, setIndexes] = useState([]);
  const [explainResult, setExplainResult] = useState(null);
  const [explainType, setExplainType] = useState('indexed_disease_temporal');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [oRes, iRes, expRes, aRes] = await Promise.all([
        api.get('/api/database-insights/overview'),
        api.get('/api/database-insights/indexes'),
        api.get('/api/database-insights/explain-query', { params: { query_type: explainType } }),
        api.get('/api/database-insights/audit-logs?limit=25')
      ]);
      setOverview(oRes.data);
      setIndexes(iRes.data);
      setExplainResult(expRes.data);
      setAuditLogs(aRes.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [explainType]);

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database? This will drop and re-create schema, views, triggers, and seed 250 surveillance cases for viva demonstration.')) return;
    setResetting(true);
    try {
      const res = await api.post('/api/database-insights/reset-database');
      showSuccess(res.data.message);
      loadInsights();
    } catch (err) {
      showError(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Database Architecture & Viva Demonstration Insights</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Live metadata introspection from MySQL 8.0 / MariaDB 10.4 InnoDB Information Schema
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={loadInsights}>
            Refresh Metadata
          </button>
          <button className="btn btn-danger" onClick={handleResetDatabase} disabled={resetting}>
            {resetting ? 'Resetting DB...' : 'Reset & Re-seed Database'}
          </button>
        </div>
      </div>

      {/* Meta Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Target DBMS</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{overview?.rdbms_engine || 'MySQL (InnoDB)'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Port 3306 &bull; XAMPP Server</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Normalization Level</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{overview?.normalization_level || '3NF / BCNF'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Zero Transitive Dependencies</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Database Name</div>
          <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'monospace' }}>{overview?.database_name || 'disease_surveillance_db'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>utf8mb4_unicode_ci</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #3182CE' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Active Triggers & Views</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            {overview?.triggers?.length || 3} Triggers &bull; {overview?.views?.length || 4} Views
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Automated Audit Logging</div>
        </div>
      </div>

      {/* Table Inventory */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Physical Relational Tables Inventory (InnoDB)</div>
            <div className="card-subtitle">Exact table rows, physical storage volume, and collation metrics</div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Table Name</th>
                <th>Storage Engine</th>
                <th>Exact Record Count</th>
                <th>Data Size (KB)</th>
                <th>Index Size (KB)</th>
                <th>Collation</th>
              </tr>
            </thead>
            <tbody>
              {overview?.tables?.map((t) => (
                <tr key={t.table_name}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.table_name}</td>
                  <td>
                    <span className="badge badge-medium">
                      <span className="badge-dot" />
                      {t.engine}
                    </span>
                  </td>
                  <td><strong>{t.row_count}</strong> rows</td>
                  <td>{t.data_size_kb} KB</td>
                  <td>{t.index_size_kb} KB</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{t.collation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Stored Procedures & Triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Stored Procedures */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Stored Procedures & Cursor Program Units</div>
              <div className="card-subtitle">Server-side execution units in MySQL</div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Procedure / Function Name</th>
                  <th>Type</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>sp_register_case</td>
                  <td><span className="badge badge-active">PROCEDURE</span></td>
                  <td style={{ fontSize: '12px' }}>Atomically validates temporal date order and inserts surveillance case.</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>sp_get_surveillance_summary</td>
                  <td><span className="badge badge-active">PROCEDURE</span></td>
                  <td style={{ fontSize: '12px' }}>Aggregates KPI metrics (Active, Confirmed, Recovered, CFR%).</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>sp_rank_regional_hotspots</td>
                  <td><span className="badge badge-high">EXPLICIT CURSOR</span></td>
                  <td style={{ fontSize: '12px' }}>Iterates through regions via MySQL cursor to compute incidence rates.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Triggers */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Automated Database Triggers</div>
              <div className="card-subtitle">Automated event listeners populating audit_logs</div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Trigger Name</th>
                  <th>Event Timing</th>
                  <th>Target Table</th>
                  <th>Audited Action</th>
                </tr>
              </thead>
              <tbody>
                {overview?.triggers?.map((trg) => (
                  <tr key={trg.trigger_name}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{trg.trigger_name}</td>
                    <td>
                      <span className="badge badge-medium">
                        <span className="badge-dot" />
                        {trg.timing} {trg.event}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{trg.table}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Inserts serialized record into audit_logs table
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Live Query Plan EXPLAIN Demonstration */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Query Execution Plan (MySQL EXPLAIN Demonstration)</div>
            <div className="card-subtitle">Evaluate index utilization, scan types, and query optimization</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${explainType === 'indexed_disease_temporal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setExplainType('indexed_disease_temporal')}
            >
              Disease Temporal Index
            </button>
            <button
              className={`btn btn-sm ${explainType === 'region_hotspot_grouping' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setExplainType('region_hotspot_grouping')}
            >
              Region Join Grouping
            </button>
            <button
              className={`btn btn-sm ${explainType === 'alert_severity_lookup' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setExplainType('alert_severity_lookup')}
            >
              Alert Severity Lookup
            </button>
          </div>
        </div>

        <div className="card-body">
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Executed SQL Statement</div>
            <div className="sql-box">{explainResult?.sql_evaluated}</div>
          </div>

          <div style={{ background: 'var(--color-primary-light)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--color-primary-dark)' }}>
            <strong>Academic Examination Note:</strong> {explainResult?.academic_explanation}
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Select Type</th>
                  <th>Table</th>
                  <th>Access Type</th>
                  <th>Possible Keys</th>
                  <th>Key Used</th>
                  <th>Key Length</th>
                  <th>Rows Examined</th>
                  <th>Extra Details</th>
                </tr>
              </thead>
              <tbody>
                {explainResult?.execution_plan?.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.id}</td>
                    <td>{row.select_type}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.table}</td>
                    <td>
                      <span className={`badge badge-${row.type === 'ALL' ? 'critical' : 'active'}`}>
                        <span className="badge-dot" />
                        {row.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{row.possible_keys || 'NULL'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{row.key || 'None'}</td>
                    <td>{row.key_len || '—'}</td>
                    <td><strong>{row.rows}</strong></td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.Extra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Trigger-Generated Audit Trail Live Feed */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Trigger-Generated Audit Trail (audit_logs Table)</div>
            <div className="card-subtitle">Real-time inspection of change records populated automatically by database triggers</div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Entity Table</th>
                <th>Entity ID</th>
                <th>Action Type</th>
                <th>Logged At</th>
                <th>Previous Values</th>
                <th>New Values</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.log_id}>
                  <td style={{ fontFamily: 'monospace' }}>#{log.log_id}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{log.entity_type}</td>
                  <td>{log.entity_id}</td>
                  <td>
                    <span className={`badge badge-${log.action_type === 'STATUS_CHANGE' ? 'critical' : log.action_type === 'UPDATE' ? 'investigation' : 'active'}`}>
                      <span className="badge-dot" />
                      {log.action_type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{log.logged_at}</td>
                  <td style={{ fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.old_values}>
                    {log.old_values || '—'}
                  </td>
                  <td style={{ fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={log.new_values}>
                    {log.new_values || '—'}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
