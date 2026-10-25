import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

// Pages
import Overview from './pages/Overview';
import DiseaseRegistry from './pages/DiseaseRegistry';
import CaseSurveillance from './pages/CaseSurveillance';
import Patients from './pages/Patients';
import HealthcareFacilities from './pages/HealthcareFacilities';
import Regions from './pages/Regions';
import LaboratoryReports from './pages/LaboratoryReports';
import OutbreakAlerts from './pages/OutbreakAlerts';
import ReportsAnalytics from './pages/ReportsAnalytics';
import DatabaseInsights from './pages/DatabaseInsights';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar />
          <div className="main-wrapper">
            <Navbar />
            <main className="content-area">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/diseases" element={<DiseaseRegistry />} />
                <Route path="/cases" element={<CaseSurveillance />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/facilities" element={<HealthcareFacilities />} />
                <Route path="/regions" element={<Regions />} />
                <Route path="/lab-reports" element={<LaboratoryReports />} />
                <Route path="/alerts" element={<OutbreakAlerts />} />
                <Route path="/reports" element={<ReportsAnalytics />} />
                <Route path="/database-insights" element={<DatabaseInsights />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
