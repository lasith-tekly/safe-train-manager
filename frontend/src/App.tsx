import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import CapacityView from './pages/Dashboard/CapacityView';
import { TrainCapacityDashboard } from './pages/Dashboard/TrainCapacity';
import { TeamCapacityDashboardPage } from './pages/Dashboard/TeamCapacity';
import { ProductsPage } from './pages/Products';
import { FeaturesPage } from './pages/Features';
import { PICalendarPage } from './pages/PICalendar';
import { TeamsPage } from './pages/Teams';
import { SettingsPage } from './pages/Settings';

// Import Amadeus theme
import './styles/amadeus-theme.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/capacity" element={<CapacityView />} />
          <Route path="/train-capacity" element={<TrainCapacityDashboard />} />
          <Route path="/team-capacity" element={<TeamCapacityDashboardPage />} />
          
          {/* Products Section */}
          <Route path="/products" element={<Navigate to="/products/list" replace />} />
          <Route path="/products/list" element={<ProductsPage />} />
          <Route path="/products/features" element={<FeaturesPage />} />
          
          {/* PI Calendar (top-level) */}
          <Route path="/pi-calendar" element={<PICalendarPage />} />
          
          {/* Teams Section */}
          <Route path="/teams" element={<TeamsPage />} />
          
          {/* Reports - placeholder */}
          <Route path="/reports" element={<DashboardPage />} />
          
          {/* Settings Section */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/working-days" element={<SettingsPage />} />
          <Route path="/settings/capacity" element={<SettingsPage />} />
          <Route path="/settings/components" element={<SettingsPage />} />
          <Route path="/settings/budgets" element={<SettingsPage />} />
          <Route path="/settings/train-config" element={<SettingsPage />} />
          <Route path="/settings/train-teams" element={<SettingsPage />} />
          <Route path="/settings/sites" element={<Navigate to="/settings/sites/locations" replace />} />
          <Route path="/settings/sites/locations" element={<SettingsPage />} />
          <Route path="/settings/sites/holidays" element={<SettingsPage />} />
          
          {/* Legacy Routes - Redirects (maintain for 6 months) */}
          <Route path="/features" element={<Navigate to="/products/features" replace />} />
          <Route path="/setup" element={<Navigate to="/settings" replace />} />
          <Route path="/setup/pi-calendar" element={<Navigate to="/pi-calendar" replace />} />
          <Route path="/setup/teams" element={<Navigate to="/teams/list" replace />} />
          <Route path="/setup/teams/list" element={<Navigate to="/teams/list" replace />} />
          <Route path="/setup/teams/holidays" element={<Navigate to="/settings/sites/holidays" replace />} />
          <Route path="/setup/organization" element={<Navigate to="/settings/sites/locations" replace />} />
          <Route path="/setup/budgets" element={<Navigate to="/settings/budgets" replace />} />
          <Route path="/setup/settings" element={<Navigate to="/settings" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
