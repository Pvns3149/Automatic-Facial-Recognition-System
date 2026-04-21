import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardPage from './DashboardPage';
import SupportPage from './SupportPage';
import MyClassesPage from './MyClassesPage';
import StudentsPage from './StudentsPage';
import TestPage from './test';
import DashboardPage2 from './dashboard2';
import AnalyticsPage from './AnalyticsPage';
import ProfilePage from './ProfilePage';
import LoginPage from './LoginPage';
import Logout from './logout';
import RegisterPage from './RegisterPage';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state

  // const handleLogout = async () => {
  //   await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
  //   setIsAuthenticated(false);
  //   window.location.href = '/login';
  // };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} API_BASE_URL={API_BASE_URL} />} />
        <Route path="/register" element={<RegisterPage API_BASE_URL={API_BASE_URL} />} />
        
        <Route
          path="/*"
          element={
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
                    <Link to="/dashboard" className="nav-item nav-item-dashboard">
                      <img src="/assets/icon-dashboard.svg" alt="" className="nav-icon" />
                      <span className="nav-label">Dashboard</span>
                    </Link>

                    <Link to="/classes" className="nav-item nav-item-my-classes">
                      <img src="/assets/tuition.png" alt="" className="nav-thumbnail" />
                      <span className="nav-label">My classes</span>
                    </Link>

                    <Link to="/dashboard2" className="nav-item nav-item-dashboard2">
                      <img src="/assets/icon-dashboard.svg" alt="" className="nav-thumbnail" />
                      <span className="nav-label">Dashboard2</span>
                    </Link>

                    <Link to="/students" className="nav-item nav-item-students">
                      <img src="/assets/student-male.png" alt="" className="nav-thumbnail" />
                      <span className="nav-label">Students</span>
                    </Link>

                    <Link to="/analytics" className="nav-item nav-item-analytics">
                      <img src="/assets/analytics.png" alt="Analytics" className="nav-thumbnail" />
                      <span className="nav-label">Analytics</span>
                    </Link>

                    <Link to="/profile" className="nav-item nav-item-profile">
                      <img src="/assets/icon-profile.svg" alt="" className="nav-icon" />
                      <span className="nav-label">Profile</span>
                    </Link>

                    <Link to="/support" className="nav-item nav-item-support">
                      <img src="/assets/online-support.png" alt="" className="nav-thumbnail" />
                      <span className="nav-label">Support</span>
                    </Link>

                    <Link to="/test" className="nav-item nav-item-test">
                      <span className="nav-label">Test</span>
                    </Link>

                    <div className="nav-spacer" />

                    <button className="nav-item nav-item-logout" onClick={() => window.location.href = '/logout'}>
                      <img src="/assets/icon-logout.svg" alt="" className="nav-icon" />
                      <span className="nav-label">Log out</span>
                    </button>
                  </nav>
                </aside>

                <Routes>
                  <Route path="dashboard" element={<DashboardPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="classes" element={<MyClassesPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="students" element={<StudentsPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="profile" element={<ProfilePage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="analytics" element={<AnalyticsPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="dashboard2" element={<DashboardPage2 API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="support" element={<SupportPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="test" element={<TestPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="logout" element={<Logout setIsAuthenticated={setIsAuthenticated} API_BASE_URL={API_BASE_URL}/>} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
