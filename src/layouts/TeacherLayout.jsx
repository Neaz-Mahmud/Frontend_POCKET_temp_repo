import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonalStorage from '../pages/student/PersonalStorage';
import ShareMaterial from '../pages/teacher/ShareMaterial';
import TeacherNotices from '../pages/teacher/Notices';
import Profile from '../pages/account/Profile';
import MySections from '../pages/account/MySections';
import SectionAdmin from '../pages/account/SectionAdmin';

import Notifications from '../pages/account/Notifications';
import CentralHub from '../pages/public/CentralHub';
import BooksBrowse from '../pages/public/BooksBrowse';
import JobsBrowse from '../pages/public/JobsBrowse';
import JobDetail from '../pages/public/JobDetail';

const TeacherLayout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <Sidebar role="teacher" />
      <main className="main-content">
        <div className="content-area">
          {/* See StudentLayout: keyed by pathname to replay the page
              entrance on navigation without disturbing in-page state. */}
          <div className="route-fade" key={location.pathname}>
            <Routes location={location}>
              <Route path="/personal/*" element={<PersonalStorage />} />
              <Route path="/share-material/*" element={<ShareMaterial />} />
              <Route path="/notices/*" element={<TeacherNotices />} />
              <Route path="/sections" element={<MySections />} />
              <Route path="/sections/:sectionId" element={<SectionAdmin />} />
              <Route path="/profile/*" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              {/* Central Segment — rendered inside the teacher shell */}
              <Route path="/central" element={<CentralHub />} />
              <Route path="/books/*" element={<BooksBrowse />} />
              <Route path="/jobs" element={<JobsBrowse />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="*" element={<Navigate to="/teacher/personal" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
