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
  '/database-insights': 'Database Insights',
  '/settings': 'System Settings'
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
    </header>
  );
}
