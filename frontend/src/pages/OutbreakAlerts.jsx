import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function OutbreakAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [severitySummary, setSeveritySummary] = useState({});
  const [diseases, setDiseases] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    disease_id: '',
    region_id: '',
    alert_title: '',
    alert_level: 'High',
    detection_date: '',
    status: 'Open',
    description: '',
    cases_threshold_exceeded: 10
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/api/diseases'),
      api.get('/api/regions'),
      api.get('/api/outbreak-alerts/severity-summary')
    ]).then(([dRes, rRes, sRes]) => {
      setDiseases(dRes.data);
      setRegions(rRes.data);
      setSeveritySummary(sRes.data);
    }).catch(console.error);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/outbreak-alerts', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          alert_level: levelFilter || undefined
        }
      });
      setAlerts(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [search, statusFilter, levelFilter]);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingAlert(null);
    setFormData({
      disease_id: diseases[0]?.disease_id || '',
      region_id: regions[0]?.region_id || '',
      alert_title: '',
      alert_level: 'High',
      detection_date: today,
      status: 'Open',
      description: '',
      cases_threshold_exceeded: 15
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAlert(a);
    setFormData({
      disease_id: a.disease_id,
      region_id: a.region_id,
      alert_title: a.alert_title,
      alert_level: a.alert_level,
      detection_date: a.detection_date,
      status: a.status,
      description: a.description,
      cases_threshold_exceeded: a.cases_threshold_exceeded || 0
    });
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = async (alertId, newStatus) => {
    try {
      await api.put(`/api/outbreak-alerts/${alertId}`, { status: newStatus });
      showSuccess(`Alert status updated to '${newStatus}'. Recorded in audit logs.`);
      fetchAlerts();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAlert) {
        await api.put(`/api/outbreak-alerts/${editingAlert.alert_id}`, formData);
        showSuccess(`Outbreak alert '${editingAlert.alert_reference}' updated.`);
      } else {
        const res = await api.post('/api/outbreak-alerts', formData);
        showSuccess(`Alert registered with code '${res.data.alert_reference}'.`);
      }
      setIsModalOpen(false);
      fetchAlerts();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/outbreak-alerts/${deleteTarget.alert_id}`);
      showSuccess(`Alert ${deleteTarget.alert_reference} deleted.`);
      fetchAlerts();
    } catch (err) {
      showError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Outbreak Signals & Early Warning Alerts</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Cluster monitoring, pathogen threshold alarms, and state-level intervention triggers
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Create Outbreak Alert
        </button>
      </div>

      {/* Severity Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { level: 'Critical', color: 'var(--color-critical)', label: 'Critical Alarms' },
          { level: 'High', color: '#D97706', label: 'High Priority' },
          { level: 'Moderate', color: '#3182CE', label: 'Moderate Signals' },
          { level: 'Low', color: '#718096', label: 'Low Advisory' }
        ].map((item) => (
          <div
            key={item.level}
            className="kpi-card"
            style={{ borderLeft: `4px solid ${item.color}`, cursor: 'pointer' }}
            onClick={() => setLevelFilter(item.level)}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{item.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: item.color }}>
              {severitySummary[item.level] || 0}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, alert reference, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Severity Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setStatusFilter(''); setLevelFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Alert Ref</th>
                <th>Alert Title</th>
                <th>Pathogen</th>
                <th>Region</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Flagged Date</th>
                <th>Threshold Excess</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading outbreak alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="empty-state-title">No outbreak alerts match filters</div>
                      <div className="empty-state-text">Clear filters or declare an outbreak alert.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.alert_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.alert_reference}</td>
                    <td style={{ fontWeight: 500, maxWidth: '280px' }}>{a.alert_title}</td>
                    <td>{a.disease_name}</td>
                    <td>{a.region_name}</td>
                    <td>
                      <span className={`badge badge-${a.alert_level === 'Critical' ? 'critical' : a.alert_level === 'High' ? 'high' : 'medium'}`}>
                        <span className="badge-dot" />
                        {a.alert_level}
                      </span>
                    </td>
                    <td>
                      <select
                        style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', background: '#fff' }}
                        value={a.status}
                        onChange={(e) => handleQuickStatusChange(a.alert_id, e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="Monitoring">Monitoring</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{a.detection_date}</td>
                    <td>
                      <strong>+{a.cases_threshold_exceeded}</strong> cases
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(a)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAlert ? `Edit Alert: ${editingAlert.alert_reference}` : 'Create Outbreak Early Warning Signal'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingAlert ? 'Save Changes' : 'Publish Alert'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Alert Title / Headline</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Acute Water-borne Gastroenteritis / Cholera Signal"
              value={formData.alert_title}
              onChange={(e) => setFormData({ ...formData, alert_title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Monitored Disease</label>
              <select
                className="form-select"
                required
                value={formData.disease_id}
                onChange={(e) => setFormData({ ...formData, disease_id: e.target.value })}
              >
                <option value="">Select Disease</option>
                {diseases.map((d) => (
                  <option key={d.disease_id} value={d.disease_id}>{d.disease_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Bound Region</label>
              <select
                className="form-select"
                required
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              >
                <option value="">Select Region</option>
                {regions.map((r) => (
                  <option key={r.region_id} value={r.region_id}>{r.region_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Severity Level</label>
              <select
                className="form-select"
                value={formData.alert_level}
                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value })}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
                <option value="Informational">Informational</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Signal Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Open">Open</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Detection Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.detection_date}
                onChange={(e) => setFormData({ ...formData, detection_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cases Above Threshold</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.cases_threshold_exceeded}
                onChange={(e) => setFormData({ ...formData, cases_threshold_exceeded: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Epidemiological Investigation Summary</label>
            <textarea
              required
              className="form-control"
              rows="3"
              placeholder="Describe localized clustering, vector index, water source inspection findings..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Outbreak Alert"
        message={`Are you sure you want to delete alert ${deleteTarget?.alert_reference}?`}
      />
    </div>
  );
}
