import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function CaseSurveillance() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  // Dropdown master lists
  const [diseases, setDiseases] = useState([]);
  const [regions, setRegions] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [patients, setPatients] = useState([]);

  // Detail Modal / Drawer State
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    disease_id: '',
    facility_id: '',
    region_id: '',
    date_of_onset: '',
    date_reported: '',
    case_classification: 'Suspected',
    case_status: 'Active',
    outcome: 'Unknown',
    risk_category: 'Low',
    notes: ''
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  // Load Dropdowns
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [dRes, rRes, fRes, pRes] = await Promise.all([
          api.get('/api/diseases'),
          api.get('/api/regions'),
          api.get('/api/facilities'),
          api.get('/api/patients?limit=100')
        ]);
        setDiseases(dRes.data);
        setRegions(rRes.data);
        setFacilities(fRes.data);
        setPatients(pRes.data);
      } catch (err) {
        console.error('Failed to load master lookup data:', err);
      }
    };
    loadMasterData();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cases', {
        params: {
          page: pagination.page,
          page_size: pagination.page_size,
          search: search || undefined,
          disease_id: diseaseFilter || undefined,
          region_id: regionFilter || undefined,
          status: statusFilter || undefined,
          classification: classificationFilter || undefined,
          outcome: outcomeFilter || undefined
        }
      });
      setCases(res.data.items);
      setPagination({
        page: res.data.page,
        page_size: res.data.page_size,
        total: res.data.total,
        pages: res.data.pages
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [pagination.page, pagination.page_size, search, diseaseFilter, regionFilter, statusFilter, classificationFilter, outcomeFilter]);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingCase(null);
    setFormData({
      patient_id: patients[0]?.patient_id || '',
      disease_id: diseases[0]?.disease_id || '',
      facility_id: facilities[0]?.facility_id || '',
      region_id: regions[0]?.region_id || '',
      date_of_onset: today,
      date_reported: today,
      case_classification: 'Suspected',
      case_status: 'Active',
      outcome: 'Unknown',
      risk_category: 'Low',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCase(c);
    setFormData({
      patient_id: c.patient_id,
      disease_id: c.disease_id,
      facility_id: c.facility_id,
      region_id: c.region_id,
      date_of_onset: c.date_of_onset,
      date_reported: c.date_reported,
      case_classification: c.case_classification,
      case_status: c.case_status,
      outcome: c.outcome,
      risk_category: c.risk_category,
      notes: c.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleViewDetail = async (caseId) => {
    try {
      const res = await api.get(`/api/cases/${caseId}`);
      setSelectedCaseDetail(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.date_reported < formData.date_of_onset) {
      showError('Data Integrity Error: Reporting date cannot precede symptom onset date.');
      return;
    }

    try {
      if (editingCase) {
        await api.put(`/api/cases/${editingCase.case_id}`, formData);
        showSuccess(`Case ${editingCase.case_reference} updated successfully.`);
      } else {
        const res = await api.post('/api/cases', formData);
        showSuccess(`Case registered successfully with reference ${res.data.case_reference}.`);
      }
      setIsFormOpen(false);
      fetchCases();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/cases/${deleteTarget.case_id}`);
      showSuccess(`Case ${deleteTarget.case_reference} deleted.`);
      fetchCases();
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
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Case Surveillance Management (Primary Module)</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Register, triage, classify, and track clinical epidemiological incident reports
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Case
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search reference, patient, or notes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={diseaseFilter}
            onChange={(e) => { setDiseaseFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          >
            <option value="">All Diseases</option>
            {diseases.map((d) => (
              <option key={d.disease_id} value={d.disease_id}>{d.disease_name}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '140px' }}
            value={regionFilter}
            onChange={(e) => { setRegionFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>{r.region_name}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '130px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            className="form-select"
            style={{ width: '140px' }}
            value={classificationFilter}
            onChange={(e) => { setClassificationFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          >
            <option value="">All Classifications</option>
            <option value="Suspected">Suspected</option>
            <option value="Probable">Probable</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Discarded">Discarded</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setDiseaseFilter('');
              setRegionFilter('');
              setStatusFilter('');
              setClassificationFilter('');
              setOutcomeFilter('');
              setPagination({ ...pagination, page: 1 });
            }}
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Case Ref</th>
                <th>Patient Ref</th>
                <th>Disease</th>
                <th>Region</th>
                <th>Reported Date</th>
                <th>Classification</th>
                <th>Status</th>
                <th>Outcome</th>
                <th>Risk</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading surveillance cases from MySQL...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <div className="empty-state">
                      <div className="empty-state-title">No surveillance cases match filters</div>
                      <div className="empty-state-text">Modify your filters or register a new epidemiological incident.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.case_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.case_reference}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{c.patient_reference}</td>
                    <td style={{ fontWeight: 500 }}>{c.disease_name}</td>
                    <td>{c.region_name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{c.date_reported}</td>
                    <td>
                      <span className={`badge badge-${c.case_classification === 'Confirmed' ? 'active' : 'medium'}`}>
                        <span className="badge-dot" />
                        {c.case_classification}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.case_status === 'Active' ? 'active' : c.case_status === 'Under Investigation' ? 'investigation' : 'closed'}`}>
                        <span className="badge-dot" />
                        {c.case_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: c.outcome === 'Deceased' ? 'var(--color-critical)' : c.outcome === 'Recovered' ? 'var(--color-success)' : 'inherit' }}>
                        {c.outcome}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.risk_category === 'Critical' ? 'critical' : c.risk_category === 'High' ? 'high' : 'low'}`}>
                        <span className="badge-dot" />
                        {c.risk_category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleViewDetail(c.case_id)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(c)}
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

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {cases.length > 0 ? (pagination.page - 1) * pagination.page_size + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} records
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Case Details Drawer / Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Case Details: ${selectedCaseDetail?.case_reference}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
            Close
          </button>
        }
      >
        {selectedCaseDetail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Patient Cohort</div>
                <div style={{ fontWeight: 600 }}>{selectedCaseDetail.patient?.patient_reference}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Age: {selectedCaseDetail.patient?.age} ({selectedCaseDetail.patient?.age_group}), {selectedCaseDetail.patient?.gender}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Diagnosed Disease</div>
                <div style={{ fontWeight: 600 }}>{selectedCaseDetail.disease?.disease_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {selectedCaseDetail.disease?.disease_code} &bull; {selectedCaseDetail.disease?.category}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Reporting Facility</div>
                <div style={{ fontWeight: 500 }}>{selectedCaseDetail.facility?.facility_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{selectedCaseDetail.region?.region_name} ({selectedCaseDetail.region?.district_code})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Temporal Progression</div>
                <div style={{ fontSize: '13px' }}>Onset: {selectedCaseDetail.date_of_onset}</div>
                <div style={{ fontSize: '13px' }}>Reported: {selectedCaseDetail.date_reported}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Investigation Notes</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>{selectedCaseDetail.notes || 'No field notes attached.'}</div>
            </div>

            {/* Linked Laboratory Reports */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Linked Laboratory Reports ({selectedCaseDetail.laboratory_reports?.length || 0})
              </h4>
              {selectedCaseDetail.laboratory_reports?.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No laboratory assays submitted for this case yet.</div>
              ) : (
                <table className="table-custom" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Lab Ref</th>
                      <th>Test Type</th>
                      <th>Result</th>
                      <th>Laboratory Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCaseDetail.laboratory_reports.map((lr) => (
                      <tr key={lr.report_id}>
                        <td style={{ fontFamily: 'monospace' }}>{lr.report_reference}</td>
                        <td>{lr.test_type}</td>
                        <td>
                          <span className={`badge badge-${lr.test_result === 'Positive' ? 'critical' : lr.test_result === 'Negative' ? 'active' : 'medium'}`}>
                            <span className="badge-dot" />
                            {lr.test_result}
                          </span>
                        </td>
                        <td>{lr.laboratory_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Audit History from Trigger */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Trigger-Generated Audit Trail
              </h4>
              {selectedCaseDetail.audit_history?.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No state transitions logged.</div>
              ) : (
                <div style={{ fontSize: '11px', maxHeight: '140px', overflowY: 'auto' }}>
                  {selectedCaseDetail.audit_history.map((al) => (
                    <div key={al.log_id} style={{ borderBottom: '1px solid #EEF2F6', padding: '6px 0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{al.action_type} on {al.logged_at}</div>
                      <div>{al.details}</div>
                      {al.old_values && <div style={{ color: 'var(--color-text-muted)' }}>Old: {al.old_values}</div>}
                      {al.new_values && <div style={{ color: 'var(--color-text-main)' }}>New: {al.new_values}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Register / Edit Case Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCase ? `Edit Case: ${editingCase.case_reference}` : 'Register New Surveillance Incident'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {editingCase ? 'Save Changes' : 'Register Case'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">De-identified Patient</label>
              <select
                className="form-select"
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              >
                <option value="">Select Patient Cohort</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_reference} (Age: {p.age}, {p.gender})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Pathogen / Disease</label>
              <select
                className="form-select"
                required
                value={formData.disease_id}
                onChange={(e) => setFormData({ ...formData, disease_id: e.target.value })}
              >
                <option value="">Select Disease</option>
                {diseases.map((d) => (
                  <option key={d.disease_id} value={d.disease_id}>
                    {d.disease_name} ({d.disease_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Reporting Healthcare Facility</label>
              <select
                className="form-select"
                required
                value={formData.facility_id}
                onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
              >
                <option value="">Select Reporting Facility</option>
                {facilities.map((f) => (
                  <option key={f.facility_id} value={f.facility_id}>
                    {f.facility_name} ({f.facility_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Jurisdiction / Region</label>
              <select
                className="form-select"
                required
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              >
                <option value="">Select Administrative District</option>
                {regions.map((r) => (
                  <option key={r.region_id} value={r.region_id}>
                    {r.region_name} ({r.district_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Date of Symptom Onset</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.date_of_onset}
                onChange={(e) => setFormData({ ...formData, date_of_onset: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Date Reported</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.date_reported}
                onChange={(e) => setFormData({ ...formData, date_reported: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Case Classification</label>
              <select
                className="form-select"
                value={formData.case_classification}
                onChange={(e) => setFormData({ ...formData, case_classification: e.target.value })}
              >
                <option value="Suspected">Suspected</option>
                <option value="Probable">Probable</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Discarded">Discarded</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Surveillance Status</label>
              <select
                className="form-select"
                value={formData.case_status}
                onChange={(e) => setFormData({ ...formData, case_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Clinical Outcome</label>
              <select
                className="form-select"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              >
                <option value="Unknown">Unknown</option>
                <option value="Recovering">Recovering</option>
                <option value="Recovered">Recovered</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Risk Category</label>
              <select
                className="form-select"
                value={formData.risk_category}
                onChange={(e) => setFormData({ ...formData, risk_category: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Epidemiological Notes</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Symptoms, exposure history, community triage observations..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Surveillance Case"
        message={`Are you sure you want to delete case ${deleteTarget?.case_reference}? If confirmatory laboratory reports are linked to this case, MySQL referential integrity rules will block deletion.`}
      />
    </div>
  );
}
