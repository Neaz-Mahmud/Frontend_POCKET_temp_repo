import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonalStorage from '../pages/student/PersonalStorage';
import ClassMaterial from '../pages/student/ClassMaterial';
import Notices from '../pages/student/Notices';
import Profile from '../pages/account/Profile';
import MySections from '../pages/account/MySections';
import SectionAdmin from '../pages/account/SectionAdmin';
import CrTools from '../pages/account/CrTools';

import Notifications from '../pages/account/Notifications';
import CentralHub from '../pages/public/CentralHub';
import BooksBrowse from '../pages/public/BooksBrowse';
import JobsBrowse from '../pages/public/JobsBrowse';
import JobDetail from '../pages/public/JobDetail';

const StudentLayout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <Sidebar role="student" />
      <main className="main-content">
        <div className="content-area">
          {/* Keyed by pathname so the wrapper remounts on each navigation,
              replaying the entrance animation. Sub-navigation that lives in
              component state (folder drill-downs) keeps the same pathname, so
              it doesn't remount and lose its place. */}
          <div className="route-fade" key={location.pathname}>
            <Routes location={location}>
              <Route path="/personal/*" element={<PersonalStorage />} />
              <Route path="/materials/*" element={<ClassMaterial />} />
              <Route path="/notices/*" element={<Notices />} />
              <Route path="/sections" element={<MySections />} />
              <Route path="/sections/:sectionId" element={<SectionAdmin />} />
              <Route path="/cr-tools" element={<CrTools />} />
              <Route path="/profile/*" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              {/* Central Segment — rendered inside the student shell so the
                  sidebar and context never disappear */}
              <Route path="/central" element={<CentralHub />} />
              <Route path="/books/*" element={<BooksBrowse />} />
              <Route path="/jobs" element={<JobsBrowse />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="*" element={<Navigate to="/student/personal" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
