import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function LaboratoryReports() {
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    case_id: '',
    test_type: 'RT-PCR',
    sample_collection_date: '',
    test_date: '',
    test_result: 'Positive',
    laboratory_name: 'Maharashtra State Public Health Laboratory',
    technician_notes: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    api.get('/api/cases?page=1&page_size=100').then((res) => setCases(res.data.items)).catch(console.error);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/laboratory-reports', {
        params: {
          search: search || undefined,
          test_result: resultFilter || undefined,
          test_type: typeFilter || undefined
        }
      });
      setReports(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, resultFilter, typeFilter]);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingReport(null);
    setFormData({
      case_id: cases[0]?.case_id || '',
      test_type: 'RT-PCR',
      sample_collection_date: today,
      test_date: today,
      test_result: 'Positive',
      laboratory_name: 'National Institute of Virology Satellite Lab',
      technician_notes: 'Diagnostic assay validated adherence to ICMR protocol.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingReport(r);
    setFormData({
      case_id: r.case_id,
      test_type: r.test_type,
      sample_collection_date: r.sample_collection_date,
      test_date: r.test_date,
      test_result: r.test_result,
      laboratory_name: r.laboratory_name,
      technician_notes: r.technician_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.test_date < formData.sample_collection_date) {
      showError('Date Integrity Error: Test completion date cannot precede sample collection date.');
      return;
    }

    try {
      if (editingReport) {
        await api.put(`/api/laboratory-reports/${editingReport.report_id}`, formData);
        showSuccess(`Laboratory report '${editingReport.report_reference}' updated.`);
      } else {
        const res = await api.post('/api/laboratory-reports', formData);
        showSuccess(`Report generated with reference '${res.data.report_reference}'.`);
      }
      setIsModalOpen(false);
      fetchReports();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/laboratory-reports/${deleteTarget.report_id}`);
      showSuccess(`Report ${deleteTarget.report_reference} deleted.`);
      fetchReports();
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
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Diagnostic Laboratory Reports</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Confirmatory assays, RT-PCR tests, ELISA serology, and blood cultures
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Submit Laboratory Report
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="Search by lab reference, case reference, or laboratory name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="">All Test Results</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Inconclusive">Inconclusive</option>
            <option value="Pending">Pending</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Test Types</option>
            <option value="RT-PCR">RT-PCR</option>
            <option value="Rapid Antigen Test">Rapid Antigen Test</option>
            <option value="ELISA Serology">ELISA Serology</option>
            <option value="Blood Culture">Blood Culture</option>
            <option value="Microscopy Smear">Microscopy Smear</option>
            <option value="Antibody Titre">Antibody Titre</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setResultFilter(''); setTypeFilter(''); }}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Report Ref</th>
                <th>Linked Case Ref</th>
                <th>Disease</th>
                <th>Test Type</th>
                <th>Result</th>
                <th>Sample Date</th>
                <th>Test Date</th>
                <th>Laboratory Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading laboratory reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="empty-state-title">No laboratory reports found</div>
                      <div className="empty-state-text">Adjust filters or submit a new assay report.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((lr) => (
                  <tr key={lr.report_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{lr.report_reference}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{lr.case_reference}</td>
                    <td style={{ fontWeight: 500 }}>{lr.disease_name}</td>
                    <td>{lr.test_type}</td>
                    <td>
                      <span className={`badge badge-${lr.test_result === 'Positive' ? 'critical' : lr.test_result === 'Negative' ? 'active' : 'medium'}`}>
                        <span className="badge-dot" />
                        {lr.test_result}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{lr.sample_collection_date}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{lr.test_date}</td>
                    <td style={{ fontSize: '12px' }}>{lr.laboratory_name}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleOpenEdit(lr)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(lr)}
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
        title={editingReport ? `Edit Lab Report: ${editingReport.report_reference}` : 'Submit Laboratory Diagnostic Assay'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingReport ? 'Save Changes' : 'Submit Report'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Associated Surveillance Case</label>
            <select
              className="form-select"
              required
              value={formData.case_id}
              onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
            >
              <option value="">Select Case Reference</option>
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_reference} — {c.disease_name} ({c.region_name})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Diagnostic Assay Type</label>
              <select
                className="form-select"
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
              >
                <option value="RT-PCR">RT-PCR</option>
                <option value="Rapid Antigen Test">Rapid Antigen Test</option>
                <option value="ELISA Serology">ELISA Serology</option>
                <option value="Blood Culture">Blood Culture</option>
                <option value="Microscopy Smear">Microscopy Smear</option>
                <option value="Antibody Titre">Antibody Titre</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Diagnostic Result</label>
              <select
                className="form-select"
                value={formData.test_result}
                onChange={(e) => setFormData({ ...formData, test_result: e.target.value })}
              >
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
                <option value="Inconclusive">Inconclusive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Sample Collection Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.sample_collection_date}
                onChange={(e) => setFormData({ ...formData, sample_collection_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Test Completion Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.test_date}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Accredited Laboratory Name</label>
            <input
              type="text"
              required
              className="form-control"
              value={formData.laboratory_name}
              onChange={(e) => setFormData({ ...formData, laboratory_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Technician & Assay Remarks</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Assay cycle threshold, specimen condition, remarks..."
              value={formData.technician_notes}
              onChange={(e) => setFormData({ ...formData, technician_notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Laboratory Report"
        message={`Are you sure you want to delete report ${deleteTarget?.report_reference}?`}
      />
    </div>
  );
}
