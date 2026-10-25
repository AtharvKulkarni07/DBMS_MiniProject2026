import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState('diseases');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'diseases'
        ? '/api/reports/disease-wise'
        : activeTab === 'regions'
        ? '/api/reports/region-wise'
        : '/api/reports/facility-wise';

      const res = await api.get(endpoint, {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      });
      setReportData(res.data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      const type = activeTab === 'diseases' ? 'diseases' : activeTab === 'regions' ? 'regions' : activeTab === 'facilities' ? 'facilities' : 'cases';
      const url = `${api.defaults.baseURL}/api/reports/export-csv?report_type=${type}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`;
      
      // Trigger download
      window.open(url, '_blank');
      showSuccess(`Generating and downloading ${type} CSV report from database.`);
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Surveillance Reports & Aggregated Analytics</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            SQL aggregation queries computing case fatality rates (CFR%), incidence rates, and facility metrics
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          Export Tabular CSV
        </button>
      </div>

      <div className="card">
        {/* Navigation Tabs and Date Filter */}
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${activeTab === 'diseases' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('diseases')}
            >
              Disease-wise Burden Report
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'regions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('regions')}
            >
              Regional Incidence Report
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'facilities' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('facilities')}
            >
              Facility Reporting Metrics
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Date Window:</div>
            <input
              type="date"
              className="form-control"
              style={{ width: '140px', padding: '4px 8px', fontSize: '12px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '140px', padding: '4px 8px', fontSize: '12px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Disease-wise Report */}
        {activeTab === 'diseases' && (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Disease Code</th>
                  <th>Pathogen Name</th>
                  <th>Category</th>
                  <th>Total Reports</th>
                  <th>Confirmed Cases</th>
                  <th>Active Cases</th>
                  <th>Recovered</th>
                  <th>Fatalities</th>
                  <th>Case Fatality Rate (CFR%)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>Executing SQL disease aggregation...</td></tr>
                ) : (
                  reportData.map((d) => (
                    <tr key={d.disease_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.disease_code}</td>
                      <td style={{ fontWeight: 500 }}>{d.disease_name}</td>
                      <td>{d.category}</td>
                      <td><strong>{d.total_cases}</strong></td>
                      <td>{d.confirmed_cases}</td>
                      <td>{d.active_cases}</td>
                      <td style={{ color: 'var(--color-success)' }}>{d.recovered_cases}</td>
                      <td style={{ color: d.deceased_cases > 0 ? 'var(--color-critical)' : 'inherit', fontWeight: d.deceased_cases > 0 ? 600 : 400 }}>
                        {d.deceased_cases}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: d.case_fatality_rate_pct > 15 ? 'var(--color-critical)' : 'inherit' }}>
                          {d.case_fatality_rate_pct}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Regional Incidence Report */}
        {activeTab === 'regions' && (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>District Code</th>
                  <th>Region Name</th>
                  <th>Regional Classification</th>
                  <th>Census Population</th>
                  <th>Total Reported Cases</th>
                  <th>Confirmed Cases</th>
                  <th>Active Cases</th>
                  <th>Fatalities</th>
                  <th>Incidence Rate / 100k</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>Executing regional aggregation queries...</td></tr>
                ) : (
                  reportData.map((r) => (
                    <tr key={r.region_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.district_code}</td>
                      <td style={{ fontWeight: 500 }}>{r.region_name}</td>
                      <td>
                        <span className="badge badge-medium">
                          <span className="badge-dot" />
                          {r.region_type}
                        </span>
                      </td>
                      <td>{r.population?.toLocaleString()}</td>
                      <td><strong>{r.total_cases}</strong></td>
                      <td>{r.confirmed_cases}</td>
                      <td>{r.active_cases}</td>
                      <td style={{ color: r.deceased_cases > 0 ? 'var(--color-critical)' : 'inherit' }}>{r.deceased_cases}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {r.incidence_rate_per_100k}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Facility Reporting Metrics */}
        {activeTab === 'facilities' && (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Facility Code</th>
                  <th>Facility Name</th>
                  <th>Tier / Level</th>
                  <th>Geographical District</th>
                  <th>Submissions Volume</th>
                  <th>Latest Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Calculating facility reporting metrics...</td></tr>
                ) : (
                  reportData.map((f) => (
                    <tr key={f.facility_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.facility_code}</td>
                      <td style={{ fontWeight: 500 }}>{f.facility_name}</td>
                      <td>{f.facility_type}</td>
                      <td>{f.region_name}</td>
                      <td><strong>{f.total_reports}</strong> cases</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{f.last_reported_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
