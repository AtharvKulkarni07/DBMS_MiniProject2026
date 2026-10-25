import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_reference: '',
    age: 30,
    age_group: '25-44 Adult',
    gender: 'Male',
    region_id: ''
  });

  // History modal
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    api.get('/api/regions').then((res) => setRegions(res.data)).catch(console.error);
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/patients', {
        params: {
          search: search || undefined,
          age_group: ageGroupFilter || undefined,
          region_id: regionFilter || undefined
        }
      });
      setPatients(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, ageGroupFilter, regionFilter]);

  const handleOpenCreate = () => {
    setEditingPatient(null);
    const count = patients.length + 1;
    setFormData({
      patient_reference: `SYN-PAT-2026-${count.toString().padStart(4, '0')}`,
      age: 28,
      age_group: '25-44 Adult',
      gender: 'Female',
      region_id: regions[0]?.region_id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPatient(p);
    setFormData({
      patient_reference: p.patient_reference,
      age: p.age,
      age_group: p.age_group,
      gender: p.gender,
      region_id: p.region_id
    });
    setIsModalOpen(true);
  };

  const handleViewHistory = async (patientId) => {
    try {
      const res = await api.get(`/api/patients/${patientId}`);
      setSelectedPatientDetail(res.data);
      setIsHistoryOpen(true);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await api.put(`/api/patients/${editingPatient.patient_id}`, formData);
        showSuccess(`Patient record '${formData.patient_reference}' updated.`);
      } else {
        await api.post('/api/patients', formData);
        showSuccess(`Synthetic patient '${formData.patient_reference}' registered.`);
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/patients/${deleteTarget.patient_id}`);
      showSuccess(`Patient '${deleteTarget.patient_reference}' deleted.`);
      fetchPatients();
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
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Synthetic Patient Demographic Registry</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            De-identified patient cohorts and clinical case presentation histories
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register Patient Cohort
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by synthetic reference or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={ageGroupFilter}
            onChange={(e) => setAgeGroupFilter(e.target.value)}
          >
            <option value="">All Age Groups</option>
            <option value="0-14 Pediatric">0-14 Pediatric</option>
            <option value="15-24 Youth">15-24 Youth</option>
            <option value="25-44 Adult">25-44 Adult</option>
            <option value="45-64 Middle Age">45-64 Middle Age</option>
            <option value="65+ Senior">65+ Senior</option>
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
            onClick={() => { setSearch(''); setAgeGroupFilter(''); setRegionFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Patient Reference</th>
                <th>Age</th>
                <th>Age Group</th>
                <th>Gender</th>
                <th>Resident Region</th>
                <th>Linked Incidents</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading patient profiles...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-title">No patient records found</div>
                      <div className="empty-state-text">Try adjusting filters or register a synthetic patient.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.patient_reference}</td>
                    <td>{p.age} yrs</td>
                    <td>
                      <span className="badge badge-medium">
                        <span className="badge-dot" />
                        {p.age_group}
                      </span>
                    </td>
                    <td>{p.gender}</td>
                    <td>{p.region_name}</td>
                    <td>
                      <strong>{p.case_count}</strong> cases reported
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleViewHistory(p.patient_id)}
                      >
                        History
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(p)}
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

      {/* Case History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Surveillance History: ${selectedPatientDetail?.patient_reference}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsHistoryOpen(false)}>
            Close
          </button>
        }
      >
        {selectedPatientDetail && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Age: {selectedPatientDetail.age} &bull; Gender: {selectedPatientDetail.gender} &bull; Region: {selectedPatientDetail.region_name}
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Associated Surveillance Incidents ({selectedPatientDetail.case_history?.length || 0})
            </h4>

            {selectedPatientDetail.case_history?.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '16px 0' }}>
                No active disease incidents recorded for this patient cohort.
              </div>
            ) : (
              <table className="table-custom" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Case Ref</th>
                    <th>Pathogen</th>
                    <th>Reported Date</th>
                    <th>Classification</th>
                    <th>Status</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPatientDetail.case_history.map((c) => (
                    <tr key={c.case_id}>
                      <td style={{ fontFamily: 'monospace' }}>{c.case_reference}</td>
                      <td>{c.disease_name}</td>
                      <td>{c.date_reported}</td>
                      <td>{c.case_classification}</td>
                      <td>{c.case_status}</td>
                      <td>{c.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? `Edit Patient: ${editingPatient.patient_reference}` : 'Register Synthetic Patient Cohort'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingPatient ? 'Save Changes' : 'Register Patient'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Synthetic Patient Reference (Unique)</label>
            <input
              type="text"
              required
              className="form-control"
              value={formData.patient_reference}
              onChange={(e) => setFormData({ ...formData, patient_reference: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Age (0 - 125)</label>
              <input
                type="number"
                min="0"
                max="125"
                required
                className="form-control"
                value={formData.age}
                onChange={(e) => {
                  const ageNum = parseInt(e.target.value, 10);
                  let grp = '25-44 Adult';
                  if (ageNum <= 14) grp = '0-14 Pediatric';
                  else if (ageNum <= 24) grp = '15-24 Youth';
                  else if (ageNum <= 44) grp = '25-44 Adult';
                  else if (ageNum <= 64) grp = '45-64 Middle Age';
                  else grp = '65+ Senior';
                  setFormData({ ...formData, age: ageNum, age_group: grp });
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Age Group</label>
              <select
                className="form-select"
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              >
                <option value="0-14 Pediatric">0-14 Pediatric</option>
                <option value="15-24 Youth">15-24 Youth</option>
                <option value="25-44 Adult">25-44 Adult</option>
                <option value="45-64 Middle Age">45-64 Middle Age</option>
                <option value="65+ Senior">65+ Senior</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
                <option value="Prefer Not to Disclose">Prefer Not to Disclose</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Residential District</label>
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
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient Record"
        message={`Are you sure you want to delete patient '${deleteTarget?.patient_reference}'? If surveillance incidents are linked to this record, MySQL referential integrity rules will block deletion.`}
      />
    </div>
  );
}
