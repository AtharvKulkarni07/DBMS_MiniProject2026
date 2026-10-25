import React from 'react';

export default function KpiCard({ label, value, subtext, highlightColor }) {
  return (
    <div className="kpi-card" style={highlightColor ? { borderTop: `3px solid ${highlightColor}` } : {}}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value ?? '—'}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
    </div>
  );
}
