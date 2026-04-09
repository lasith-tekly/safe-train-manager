import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import LoginPage from './pages/Login';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import CapacityView from './pages/Dashboard/CapacityView';
import { TrainCapacityDashboard } from './pages/Dashboard/TrainCapacity';
import { BudgetConsumptionDashboard } from './pages/Dashboard/BudgetConsumption';
import { ProductsPage } from './pages/Products';
import { FeaturesPage } from './pages/Features';
import { PICalendarPage } from './pages/PICalendar';
import { TeamsPage } from './pages/Teams';
import { SettingsPage } from './pages/Settings';
import UserManagementPage from './pages/Settings/UserManagement';
import TrainManagementPage from './pages/Settings/TrainManagement';
import RoadmapV4Page from './pages/RoadmapV4';
import ProductsOverviewPage from './pages/RoadmapV4/ProductsOverviewPage';
import ProductRoadmapPage from './pages/RoadmapV4/ProductRoadmapPage';
import TeamPlanningPage from './pages/TeamPlanning/TeamPlanningPage';

// Import Amadeus theme
import './styles/amadeus-theme.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all existing routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Dashboard */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/capacity" element={<CapacityView />} />
                <Route path="/train-capacity" element={<TrainCapacityDashboard />} />
                <Route path="/budget-consumption" element={<BudgetConsumptionDashboard />} />

                {/* Products Section */}
                <Route path="/products" element={<Navigate to="/products/list" replace />} />
                <Route path="/products/list" element={<ProductsPage />} />
                <Route path="/products/features" element={<FeaturesPage />} />

                {/* PI Calendar (top-level) */}
                <Route path="/pi-calendar" element={<PICalendarPage />} />

                {/* Teams Section */}
                <Route path="/teams" element={<TeamsPage />} />

                {/* Team Planning - Phase 5+6 */}
                <Route path="/team-planning" element={<TeamPlanningPage />} />

                {/* Roadmap Planning */}
                <Route path="/roadmap" element={<ProductsOverviewPage />} />
                <Route path="/roadmap/products/:productId" element={<ProductRoadmapPage />} />
                <Route path="/roadmap/all" element={<RoadmapV4Page />} />

                {/* Reports - placeholder */}
                <Route path="/reports" element={<DashboardPage />} />

                {/* Settings Section */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/working-days" element={<SettingsPage />} />
                <Route path="/settings/capacity" element={<SettingsPage />} />
                <Route path="/settings/components" element={<SettingsPage />} />
                <Route path="/settings/budgets" element={<SettingsPage />} />
                <Route path="/settings/budget-configuration" element={<SettingsPage />} />
                <Route path="/settings/train-config" element={<SettingsPage />} />
                <Route path="/settings/train-teams" element={<SettingsPage />} />
                <Route path="/settings/users" element={<UserManagementPage />} />
                <Route path="/settings/trains" element={<TrainManagementPage />} />
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
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
