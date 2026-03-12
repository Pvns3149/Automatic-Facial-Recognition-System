import { useState } from 'react';
import DashboardPage from './DashboardPage';
import SupportPage from './SupportPage';
import MyClassesPage from './MyClassesPage';
import StudentsPage from './StudentsPage';
import TestPage from './test';

const INITIAL_CLASSES = [
  {
    id: 'isit312',
    session: 'Spring 2025',
    subjectCode: 'ISIT312',
    subjectName: 'Big Data Management',
    timeSlot: 'MON 10.30 AM - 12.30 PM',
    classType: 'Laboratory',
    totalStudents: 35,
    presentPercent: 0.96,
    assigned: true,
  },
  {
    id: 'csci218',
    session: 'Spring 2025',
    subjectCode: 'CSCI218',
    subjectName: 'Foundations of Artificial Intelligence',
    timeSlot: 'THU 8.30 AM - 10.30 AM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.92,
    assigned: true,
  },
  {
    id: 'csit214',
    session: 'Spring 2025',
    subjectCode: 'CSIT214',
    subjectName: 'IT Project Management',
    timeSlot: 'WED 10.30 AM - 12.30 PM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.89,
    assigned: true,
  },
  {
    id: 'csit213',
    session: 'Spring 2025',
    subjectCode: 'CSIT213',
    subjectName: 'Java Programming',
    timeSlot: 'TUE 8.30 AM - 10.30 AM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.9,
    assigned: false,
  },
];

function App() {
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'classes' | 'support' | 'students'
  const [classes, setClasses] = useState(INITIAL_CLASSES);

  const handleNavClick = (target) => (e) => {
    e.preventDefault();
    setPage(target);
  };

  const handleAssignClass = (id) => {
    setClasses((prev) =>
      prev.map((cls) => (cls.id === id ? { ...cls, assigned: true } : cls)),
    );
  };

  const handleRemoveClass = (id) => {
    setClasses((prev) =>
      prev.map((cls) => (cls.id === id ? { ...cls, assigned: false } : cls)),
    );
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-bg">
          <h1 className="app-title">Automatic Student Attendance</h1>
          <div className="profile-picture-wrapper">
            <img
              src="/assets/profile-picture.png"
              alt="Profile"
              className="profile-picture"
            />
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="nav-bar">
          <nav className="nav-items">
            <a
              href="#dashboard"
              className={`nav-item nav-item-dashboard${
                page === 'dashboard' ? ' is-active' : ''
              }`}
              onClick={handleNavClick('dashboard')}
            >
              <img src="/assets/icon-dashboard.svg" alt="" className="nav-icon" />
              <span className="nav-label">Dashboard</span>
            </a>

            <a
              href="#classes"
              className={`nav-item nav-item-my-classes${
                page === 'classes' ? ' is-active' : ''
              }`}
              onClick={handleNavClick('classes')}
            >
              <img src="/assets/tuition.png" alt="" className="nav-thumbnail" />
              <span className="nav-label">My classes</span>
            </a>

            <a
              href="#students"
              className={`nav-item nav-item-students${
                page === 'students' ? ' is-active' : ''
              }`}
              onClick={handleNavClick('students')}
            >
              <img
                src="/assets/student-male.png"
                alt=""
                className="nav-thumbnail"
              />
              <span className="nav-label">Students</span>
            </a>

            <a className="nav-item nav-item-analytics" href="#">
              <img src="/assets/analytics.png" alt="" className="nav-thumbnail" />
              <span className="nav-label">Analytics</span>
            </a>

            <a className="nav-item nav-item-profile" href="#">
              <img src="/assets/icon-profile.svg" alt="" className="nav-icon" />
              <span className="nav-label">Profile</span>
            </a>

            <a
              href="#support"
              className={`nav-item nav-item-support${
                page === 'support' ? ' is-active' : ''
              }`}
              onClick={handleNavClick('support')}
            >
              <img
                src="/assets/online-support.png"
                alt=""
                className="nav-thumbnail"
              />
              <span className="nav-label">Support</span>
            </a>

              {/* Option  below to be removed after testing */}
            <a
              href="#test"
              className={`nav-item nav-item-test${
                page === 'test' ? ' is-active' : ''
              }`}
              onClick={handleNavClick('test')}
            >
              <span className="nav-label">Test</span>
            </a>

            <div className="nav-spacer" />

            <a className="nav-item nav-item-logout" href="#">
              <img src="/assets/icon-logout.svg" alt="" className="nav-icon" />
              <span className="nav-label">Log out</span>
            </a>
          </nav>
        </aside>

        {page === 'dashboard' && (
          <DashboardPage
            classes={classes}
            onAssignClass={handleAssignClass}
            onRemoveClass={handleRemoveClass}
          />
        )}
        {page === 'classes' && (
          <MyClassesPage classes={classes.filter((cls) => cls.assigned)} />
        )}
        {page === 'students' && <StudentsPage />}
        {page === 'support' && <SupportPage />}
         {page === 'test' && <TestPage />}  {/* REMOVE AFTER TESTING */}
      </div>
    </div>
  );
}

export default App;
