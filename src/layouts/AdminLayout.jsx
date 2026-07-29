import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminVerifications from '../pages/admin/AdminVerifications';
import AdminSections from '../pages/admin/AdminSections';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminBooks from '../pages/admin/AdminBooks';
import AdminJobs from '../pages/admin/AdminJobs';
import Profile from '../pages/account/Profile';

const AdminLayout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <Sidebar role="admin" />
      <main className="main-content">
        <div className="content-area">
          <div className="route-fade" key={location.pathname}>
            <Routes location={location}>
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/verifications/*" element={<AdminVerifications />} />
              <Route path="/sections/*" element={<AdminSections />} />
              <Route path="/users/*" element={<AdminUsers />} />
              <Route path="/books/*" element={<AdminBooks />} />
              <Route path="/jobs/*" element={<AdminJobs />} />
              <Route path="/profile/*" element={<Profile />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
