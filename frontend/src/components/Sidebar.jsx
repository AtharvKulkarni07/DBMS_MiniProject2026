import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { section: 'SURVEILLANCE' },
  { path: '/', label: 'Overview' },
  { path: '/cases', label: 'Case Surveillance' },
  { path: '/alerts', label: 'Outbreak Alerts' },
  { section: 'MASTER REGISTRIES' },
  { path: '/diseases', label: 'Disease Registry' },
  { path: '/patients', label: 'Patients' },
  { path: '/facilities', label: 'Healthcare Facilities' },
  { path: '/regions', label: 'Regions' },
  { path: '/lab-reports', label: 'Laboratory Reports' },
  { section: 'DBMS & ANALYTICS' },
  { path: '/reports', label: 'Reports & Analytics' },
  { path: '/database-insights', label: 'Database Insights' },
  { path: '/settings', label: 'Settings' }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-symbol">DS</div>
        <div>
          <div className="sidebar-brand-title">EpiSurv DB</div>
          <div className="sidebar-brand-subtitle">DBMS Mini-Project 2026</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-indicator-dot" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
