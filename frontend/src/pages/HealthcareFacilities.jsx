import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function HealthcareFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [formData, setFormData] = useState({
    facility_name: '',
    facility_code: '',
    facility_type: 'District Hospital',
    region_id: '',
    operational_status: 'Active',
    contact_email: '',
    contact_phone: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    api.get('/api/regions').then((res) => setRegions(res.data)).catch(console.error);
  }, []);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/facilities', {
        params: {
          search: search || undefined,
          facility_type: typeFilter || undefined,
          region_id: regionFilter || undefined
        }
      });
      setFacilities(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [search, typeFilter, regionFilter]);

  const handleOpenCreate = () => {
    setEditingFacility(null);
    setFormData({
      facility_name: '',
      facility_code: '',
      facility_type: 'District Hospital',
      region_id: regions[0]?.region_id || '',
      operational_status: 'Active',
      contact_email: '',
      contact_phone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFacility(f);
    setFormData({
      facility_name: f.facility_name,
      facility_code: f.facility_code,
      facility_type: f.facility_type,
      region_id: f.region_id,
      operational_status: f.operational_status,
      contact_email: f.contact_email || '',
      contact_phone: f.contact_phone || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFacility) {
        await api.put(`/api/facilities/${editingFacility.facility_id}`, formData);
        showSuccess(`Facility '${formData.facility_name}' updated.`);
      } else {
        await api.post('/api/facilities', formData);
        showSuccess(`Facility '${formData.facility_name}' registered.`);
      }
      setIsModalOpen(false);
      fetchFacilities();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/facilities/${deleteTarget.facility_id}`);
      showSuccess(`Facility '${deleteTarget.facility_name}' deleted.`);
      fetchFacilities();
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
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Healthcare Facilities Directory</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Designated notification points, primary health centres, and civil hospitals
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register Health Facility
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by facility title, code, or district..."
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
            <option value="">All Facility Types</option>
            <option value="District Hospital">District Hospital</option>
            <option value="Primary Health Centre">Primary Health Centre</option>
            <option value="Community Health Centre">Community Health Centre</option>
            <option value="Sub-District Hospital">Sub-District Hospital</option>
            <option value="Tertiary Care Center">Tertiary Care Center</option>
          </select>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>{r.region_name}</option>
            ))}
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setTypeFilter(''); setRegionFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Code</th>
                <th>Facility Name</th>
                <th>Facility Type</th>
                <th>District / Region</th>
                <th>Status</th>
                <th>Total Reports</th>
                <th>Contact</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading healthcare facilities...
                  </td>
                </tr>
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-title">No healthcare facilities found</div>
                      <div className="empty-state-text">Adjust filters or register a new reporting centre.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                facilities.map((f) => (
                  <tr key={f.facility_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.facility_code}</td>
                    <td style={{ fontWeight: 500 }}>{f.facility_name}</td>
                    <td>
                      <span className="badge badge-medium">
                        <span className="badge-dot" />
                        {f.facility_type}
                      </span>
                    </td>
                    <td>{f.region_name}</td>
                    <td>
                      <span className={`badge badge-${f.operational_status === 'Active' ? 'active' : 'investigation'}`}>
                        <span className="badge-dot" />
                        {f.operational_status}
                      </span>
                    </td>
                    <td>
                      <strong>{f.report_count}</strong> cases submitted
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {f.contact_email || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(f)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(f)}
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
        title={editingFacility ? `Edit Facility: ${editingFacility.facility_name}` : 'Register Healthcare Facility'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingFacility ? 'Save Changes' : 'Register Facility'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Facility Title</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Sassoon General Hospital"
              value={formData.facility_name}
              onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Facility Code (Unique)</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. HCF-PUN-001"
                value={formData.facility_code}
                onChange={(e) => setFormData({ ...formData, facility_code: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Facility Tier / Type</label>
              <select
                className="form-select"
                value={formData.facility_type}
                onChange={(e) => setFormData({ ...formData, facility_type: e.target.value })}
              >
                <option value="District Hospital">District Hospital</option>
                <option value="Primary Health Centre">Primary Health Centre</option>
                <option value="Community Health Centre">Community Health Centre</option>
                <option value="Sub-District Hospital">Sub-District Hospital</option>
                <option value="Tertiary Care Center">Tertiary Care Center</option>
                <option value="Private Hospital">Private Hospital</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Jurisdiction / Region</label>
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

            <div className="form-group">
              <label className="form-label required">Operational Status</label>
              <select
                className="form-select"
                value={formData.operational_status}
                onChange={(e) => setFormData({ ...formData, operational_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Temporary Closed">Temporary Closed</option>
                <option value="Upgraded">Upgraded</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="epidemiology@facility.org"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Hotline</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91-20-XXXXXXXX"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Healthcare Facility"
        message={`Are you sure you want to delete '${deleteTarget?.facility_name}'? If surveillance reports are linked to this clinic, MySQL referential integrity rules will prevent deletion.`}
      />
    </div>
  );
}
