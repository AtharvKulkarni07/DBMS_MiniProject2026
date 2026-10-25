import React, { useState, useEffect } from 'react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const OUTCOME_COLORS = {
  Recovered: '#2F855A',
  Recovering: '#3182CE',
  Deceased: '#C53030',
  Unknown: '#A0AEC0'
};

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [outcomeData, setOutcomeData] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');

  const fetchDashboardData = async (filterKey) => {
    setLoading(true);
    try {
      let params = {};
      const today = new Date();
      if (filterKey === '7d') {
        const d = new Date();
        d.setDate(today.getDate() - 7);
        params.start_date = d.toISOString().split('T')[0];
      } else if (filterKey === '30d') {
        const d = new Date();
        d.setDate(today.getDate() - 30);
        params.start_date = d.toISOString().split('T')[0];
      } else if (filterKey === '90d') {
        const d = new Date();
        d.setDate(today.getDate() - 90);
        params.start_date = d.toISOString().split('T')[0];
      }

      const results = await Promise.allSettled([
        api.get('/api/dashboard/summary', { params }),
        api.get('/api/dashboard/cases-over-time', { params }),
        api.get('/api/dashboard/cases-by-disease'),
        api.get('/api/dashboard/cases-by-region'),
        api.get('/api/dashboard/case-outcomes'),
        api.get('/api/dashboard/recent-cases', { params: { limit: 5 } }),
        api.get('/api/dashboard/recent-alerts', { params: { limit: 4 } })
      ]);

      if (results[0].status === 'fulfilled') setSummary(results[0].value.data);
      if (results[1].status === 'fulfilled') setTrendData(results[1].value.data);
      if (results[2].status === 'fulfilled') setDiseaseData(results[2].value.data);
      if (results[3].status === 'fulfilled') setRegionData(results[3].value.data);
      if (results[4].status === 'fulfilled') setOutcomeData(results[4].value.data);
      if (results[5].status === 'fulfilled') setRecentCases(results[5].value.data);
      if (results[6].status === 'fulfilled') setRecentAlerts(results[6].value.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateFilter);
  }, [dateFilter]);

  return (
    <div>
      {/* Filter and Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Surveillance Analytics Dashboard</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Real-time public health indicators aggregated directly from MySQL InnoDB tables
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#FFFFFF', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 90 Days' },
            { id: 'all', label: 'All Records' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: dateFilter === tab.id ? 600 : 400,
                background: dateFilter === tab.id ? 'var(--color-primary-light)' : 'transparent',
                color: dateFilter === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Reported Cases"
          value={summary?.total_cases}
          subtext="Cumulative surveillance notifications"
          highlightColor="var(--color-primary)"
        />
        <KpiCard
          label="Active Cases"
          value={summary?.active_cases}
          subtext="Under current clinical monitoring"
          highlightColor="#D97706"
        />
        <KpiCard
          label="Recovered Cases"
          value={summary?.recovered_cases}
          subtext="Verified clinical clearance"
          highlightColor="var(--color-success)"
        />
        <KpiCard
          label="Reported Deaths"
          value={summary?.deceased_cases}
          subtext={`Case Fatality Rate: ${summary?.case_fatality_rate_pct ?? 0}%`}
          highlightColor="var(--color-critical)"
        />
        <KpiCard
          label="Active Outbreak Signals"
          value={summary?.active_outbreak_alerts}
          subtext="Open or monitoring clusters"
          highlightColor="#C53030"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Cases Over Time Line Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Case Reporting Trend Over Time</div>
              <div className="card-subtitle">Daily epidemiological notification volume</div>
            </div>
          </div>
          <div className="card-body" style={{ height: '280px' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#718096' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#718096' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E6EBF0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="total_cases" name="Total Reported" stroke="#167D8D" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="confirmed_cases" name="Confirmed" stroke="#2F855A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#C53030" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No time-series data available for this range</div>
            )}
          </div>
        </div>

        {/* Cases by Disease Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Surveillance Notifications by Disease</div>
              <div className="card-subtitle">Pathogen distribution across reported cases</div>
            </div>
          </div>
          <div className="card-body" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                <XAxis dataKey="disease_code" tick={{ fontSize: 10, fill: '#718096' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E6EBF0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="case_count" name="Reported Cases" fill="#167D8D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Regional Distribution & Outcomes Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Cases by Region Horizontal Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Geographic Case Burden by District</div>
              <div className="card-subtitle">Confirmed vs total incident reports across Maharashtra</div>
            </div>
          </div>
          <div className="card-body" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#718096' }} tickLine={false} />
                <YAxis dataKey="region_name" type="category" tick={{ fontSize: 10, fill: '#718096' }} width={120} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E6EBF0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="case_count" name="Total Cases" fill="#145A68" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Outcomes Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Clinical Outcomes Distribution</div>
              <div className="card-subtitle">Breakdown of recovered, active, and deceased statuses</div>
            </div>
          </div>
          <div className="card-body" style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="count"
                  nameKey="outcome"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[entry.outcome] || '#718096'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E6EBF0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Cases Table & Outbreak Alert Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {/* Recent Cases */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Case Notifications</div>
              <div className="card-subtitle">Latest records ingested into surveillance_cases table</div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Case Ref</th>
                  <th>Disease</th>
                  <th>Region</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => (
                  <tr key={c.case_id}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{c.case_reference}</td>
                    <td>{c.disease_name}</td>
                    <td>{c.region_name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{c.date_reported}</td>
                    <td>
                      <span className={`badge badge-${c.case_status === 'Active' ? 'active' : c.case_status === 'Under Investigation' ? 'investigation' : 'closed'}`}>
                        <span className="badge-dot" />
                        {c.case_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Outbreak Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Active Outbreak Signals</div>
              <div className="card-subtitle">Automated cluster detection and threshold monitors</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '0 20px' }}>
            {recentAlerts.map((a) => (
              <div
                key={a.alert_id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {a.alert_title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {a.disease_name} &bull; {a.region_name} &bull; Flagged on {a.detection_date}
                  </div>
                </div>
                <span className={`badge badge-${a.alert_level === 'Critical' ? 'critical' : a.alert_level === 'High' ? 'high' : 'medium'}`}>
                  <span className="badge-dot" />
                  {a.alert_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
