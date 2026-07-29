import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './pages/public/PublicLayout';
import CentralHub from './pages/public/CentralHub';
import BooksBrowse from './pages/public/BooksBrowse';
import JobsBrowse from './pages/public/JobsBrowse';
import JobDetail from './pages/public/JobDetail';

const homeFor = (role) =>
  role === 'admin' ? '/admin/dashboard'
  : role === 'teacher' ? '/teacher/personal'
  : '/student/personal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Central Segment pages at their public URLs: logged-in students/teachers are
// bounced to the same page inside their own dashboard shell; admins and
// logged-out visitors see the bare PublicLayout version.
const CentralShell = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (user?.role === 'student' || user?.role === 'teacher') {
    return <Navigate to={`/${user.role}${location.pathname}${location.search}`} replace />;
  }
  return <PublicLayout>{children}</PublicLayout>;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

        {/* Central segment — logged-out visitors browse in the bare public
            shell; logged-in students/teachers are redirected to the same pages
            inside their own dashboard layout so the sidebar never disappears. */}
        <Route path="/central" element={<CentralShell><CentralHub /></CentralShell>} />
        <Route path="/books/*" element={<CentralShell><BooksBrowse /></CentralShell>} />
        <Route path="/jobs" element={<CentralShell><JobsBrowse /></CentralShell>} />
        <Route path="/jobs/:id" element={<CentralShell><JobDetail /></CentralShell>} />

        {/* Redirect root based on role */}
        <Route
          path="/"
          element={user ? <Navigate to={homeFor(user.role)} replace /> : <Navigate to="/login" replace />}
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
