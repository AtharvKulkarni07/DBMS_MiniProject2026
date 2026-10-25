import React from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/': 'Surveillance Overview',
  '/diseases': 'Disease Registry',
  '/cases': 'Case Surveillance',
  '/patients': 'Patient Profiles',
  '/facilities': 'Healthcare Facilities',
  '/regions': 'Geographical Regions',
  '/lab-reports': 'Laboratory Reports',
  '/alerts': 'Outbreak Alerts',
  '/reports': 'Reports & Analytics',
  '/database-insights': 'Database Insights & Viva Demo',
  '/settings': 'System Configuration'
};

export default function Navbar() {
  const location = useLocation();
  const currentTitle = titles[location.pathname] || 'Surveillance Dashboard';

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h1 className="page-title">{currentTitle}</h1>
        <span className="page-breadcrumb">Epidemiology Portal &gt; {currentTitle}</span>
      </div>

      <div className="navbar-right">
        {/* Demonstration Mode Warning */}
        <div className="demo-tag" title="Synthetic educational data for DBMS academic evaluation">
          <span className="demo-pulse-dot" />
          <span>Demonstration Data</span>
        </div>

        {/* Database Status Indicator */}
        <div className="db-status-badge">
          <span className="db-online-dot" />
          <span>MySQL (Port 3306)</span>
        </div>

        {/* Direct Link to phpMyAdmin */}
        <a 
          href="http://localhost/phpmyadmin/index.php?route=/database/structure&db=disease_surveillance_db" 
          target="_blank" 
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          title="Open phpMyAdmin in new tab"
        >
          phpMyAdmin
        </a>
      </div>
    </header>
  );
}
