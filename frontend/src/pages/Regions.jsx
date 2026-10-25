import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    region_name: '',
    district_code: '',
    state: 'Maharashtra',
    region_type: 'Urban',
    population: 500000
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/regions', {
        params: {
          search: search || undefined,
          region_type: typeFilter || undefined
        }
      });
      setRegions(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [search, typeFilter]);

  const handleOpenCreate = () => {
    setEditingRegion(null);
    setFormData({
      region_name: '',
      district_code: '',
      state: 'Maharashtra',
      region_type: 'Urban',
      population: 500000
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingRegion(r);
    setFormData({
      region_name: r.region_name,
      district_code: r.district_code,
      state: r.state,
      region_type: r.region_type,
      population: r.population
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRegion) {
        await api.put(`/api/regions/${editingRegion.region_id}`, formData);
        showSuccess(`Region '${formData.region_name}' updated.`);
      } else {
        await api.post('/api/regions', formData);
        showSuccess(`Region '${formData.region_name}' created.`);
      }
      setIsModalOpen(false);
      fetchRegions();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/regions/${deleteTarget.region_id}`);
      showSuccess(`Region '${deleteTarget.region_name}' deleted.`);
      fetchRegions();
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
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Geographical & Administrative Regions</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Demographic districts, census populations, and geographic regional types
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Region
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by district name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Region Types</option>
            <option value="Urban">Urban</option>
            <option value="Rural">Rural</option>
            <option value="Semi-Urban">Semi-Urban</option>
            <option value="Coastal">Coastal</option>
            <option value="Tribal">Tribal</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setTypeFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>District Code</th>
                <th>Region Name</th>
                <th>State</th>
                <th>Region Type</th>
                <th>Census Population</th>
                <th>Active Surveillance Cases</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading regions from database...
                  </td>
                </tr>
              ) : regions.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-title">No regions found</div>
                      <div className="empty-state-text">Add a new district or modify filter.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                regions.map((r) => (
                  <tr key={r.region_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.district_code}</td>
                    <td style={{ fontWeight: 500 }}>{r.region_name}</td>
                    <td>{r.state}</td>
                    <td>
                      <span className="badge badge-medium">
                        <span className="badge-dot" />
                        {r.region_type}
                      </span>
                    </td>
                    <td>{r.population.toLocaleString()} residents</td>
                    <td>
                      <strong>{r.case_count}</strong> cases
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(r)}
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
        title={editingRegion ? `Edit Region: ${editingRegion.region_name}` : 'Register Geographical Region'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingRegion ? 'Save Changes' : 'Register Region'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Region / District Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Pune Metro"
                value={formData.region_name}
                onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">District Code (Unique)</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. MH-PUN"
                value={formData.district_code}
                onChange={(e) => setFormData({ ...formData, district_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">State</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Region Type</label>
              <select
                className="form-select"
                value={formData.region_type}
                onChange={(e) => setFormData({ ...formData, region_type: e.target.value })}
              >
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
                <option value="Semi-Urban">Semi-Urban</option>
                <option value="Coastal">Coastal</option>
                <option value="Tribal">Tribal</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Census Population Figure</label>
            <input
              type="number"
              min="1000"
              required
              className="form-control"
              value={formData.population}
              onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value, 10) })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Geographical Region"
        message={`Are you sure you want to delete '${deleteTarget?.region_name}'? If cases, healthcare facilities, or alerts reference this district, MySQL referential integrity rules will block the deletion.`}
      />
    </div>
  );
}
