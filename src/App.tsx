import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SitesPage } from './pages/SitesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IngestionPage } from './pages/IngestionPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { CopilotPage } from './pages/CopilotPage';
import { ReportsPage } from './pages/ReportsPage';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { TowerDetailDrawer } from './components/sites/TowerDetailDrawer';

function MainApplication() {
  const { isAuthenticated } = useAuth();
  const {
    selectedIncidentId,
    setSelectedIncidentId,
    selectedTowerId,
    setSelectedTowerId,
  } = useNetwork();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  const handleOpenIncident = (incidentId) => {
    setSelectedIncidentId(incidentId);
  };

  const handleSelectTower = (towerId) => {
    setSelectedTowerId(towerId);
  };

  return (
    <AppLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateTab={setCurrentTab}
          onSelectTower={handleSelectTower}
          onOpenIncident={handleOpenIncident}
        />
      )}

      {currentTab === 'sites' && (
        <SitesPage onOpenIncident={handleOpenIncident} />
      )}

      {currentTab === 'analytics' && (
        <AnalyticsPage />
      )}

      {currentTab === 'ingestion' && (
        <IngestionPage />
      )}

      {currentTab === 'incidents' && (
        <IncidentsPage onOpenIncident={handleOpenIncident} />
      )}

      {currentTab === 'copilot' && (
        <CopilotPage onOpenIncident={handleOpenIncident} />
      )}

      {currentTab === 'reports' && (
        <ReportsPage />
      )}

      {/* Global Incident Investigation Modal */}
      {selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}

      {/* Global Tower Detail Drawer */}
      {selectedTowerId && (
        <TowerDetailDrawer
          towerId={selectedTowerId}
          onClose={() => setSelectedTowerId(null)}
          onOpenIncident={handleOpenIncident}
        />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <MainApplication />
      </NetworkProvider>
    </AuthProvider>
  );
}
