import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function DiseaseRegistry() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [formData, setFormData] = useState({
    disease_name: '',
    disease_code: '',
    category: 'Vector-borne',
    transmission_mode: '',
    severity_level: 'Moderate',
    reporting_requirement: 'Immediate (24h)',
    description: ''
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/diseases', {
        params: {
          search: search || undefined,
          category: categoryFilter || undefined
        }
      });
      setDiseases(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, [search, categoryFilter]);

  const handleOpenCreate = () => {
    setEditingDisease(null);
    setFormData({
      disease_name: '',
      disease_code: '',
      category: 'Vector-borne',
      transmission_mode: '',
      severity_level: 'Moderate',
      reporting_requirement: 'Immediate (24h)',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (disease) => {
    setEditingDisease(disease);
    setFormData({
      disease_name: disease.disease_name,
      disease_code: disease.disease_code,
      category: disease.category,
      transmission_mode: disease.transmission_mode,
      severity_level: disease.severity_level,
      reporting_requirement: disease.reporting_requirement,
      description: disease.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDisease) {
        await api.put(`/api/diseases/${editingDisease.disease_id}`, formData);
        showSuccess(`Disease '${formData.disease_name}' updated successfully.`);
      } else {
        await api.post('/api/diseases', formData);
        showSuccess(`Disease '${formData.disease_name}' registered successfully.`);
      }
      setIsModalOpen(false);
      fetchDiseases();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/diseases/${deleteTarget.disease_id}`);
      showSuccess(`Disease '${deleteTarget.disease_name}' deleted successfully.`);
      fetchDiseases();
    } catch (err) {
      showError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Disease Registry (Master Table)</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Pathogen definitions, transmission routes, and surveillance reporting protocols
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Disease
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by pathogen name, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Vector-borne">Vector-borne</option>
              <option value="Airborne">Airborne</option>
              <option value="Water-borne">Water-borne</option>
              <option value="Zoonotic">Zoonotic</option>
              <option value="Blood-borne">Blood-borne</option>
            </select>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setCategoryFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Code</th>
                <th>Disease Name</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Reporting Timeline</th>
                <th>Active Cases</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading disease registry...
                  </td>
                </tr>
              ) : diseases.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-title">No diseases found</div>
                      <div className="empty-state-text">Try adjusting your search query or add a new disease.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                diseases.map((d) => (
                  <tr key={d.disease_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.disease_code}</td>
                    <td style={{ fontWeight: 500 }}>{d.disease_name}</td>
                    <td>
                      <span className="badge badge-medium">
                        <span className="badge-dot" />
                        {d.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${d.severity_level === 'Critical' ? 'critical' : d.severity_level === 'Severe' ? 'high' : 'medium'}`}>
                        <span className="badge-dot" />
                        {d.severity_level}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{d.reporting_requirement}</td>
                    <td>
                      <strong>{d.case_count}</strong> cases
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(d)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDisease ? `Edit Disease: ${editingDisease.disease_name}` : 'Register New Pathogen'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingDisease ? 'Save Changes' : 'Register Disease'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Disease Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Dengue Fever"
                value={formData.disease_name}
                onChange={(e) => setFormData({ ...formData, disease_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Disease Code (Unique)</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. DIS-DEN-01"
                value={formData.disease_code}
                onChange={(e) => setFormData({ ...formData, disease_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Epidemiological Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Vector-borne">Vector-borne</option>
                <option value="Airborne">Airborne</option>
                <option value="Water-borne">Water-borne</option>
                <option value="Zoonotic">Zoonotic</option>
                <option value="Blood-borne">Blood-borne</option>
                <option value="Contact-transmitted">Contact-transmitted</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Severity Level</label>
              <select
                className="form-select"
                value={formData.severity_level}
                onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Transmission Mode / Vector</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Aedes aegypti mosquito bite"
              value={formData.transmission_mode}
              onChange={(e) => setFormData({ ...formData, transmission_mode: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Surveillance Reporting Timeline</label>
            <select
              className="form-select"
              value={formData.reporting_requirement}
              onChange={(e) => setFormData({ ...formData, reporting_requirement: e.target.value })}
            >
              <option value="Immediate (24h)">Immediate (24h)</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Routine">Routine</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Description & Case Definition</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Case definition criteria and diagnostic confirmation guidelines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Disease Record"
        message={`Are you sure you want to delete '${deleteTarget?.disease_name}' (${deleteTarget?.disease_code})? If existing surveillance cases or alerts reference this disease, MySQL will block the deletion to protect referential integrity.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
