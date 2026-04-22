import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
//import DashboardPage from './DashboardPage';
import SupportPage from './SupportPage';
//import MyClassesPage from './MyClassesPage';
import StudentsPage from './StudentsPage';
import TestPage from './test';
import DashboardPage from './DashboardPage';
import AnalyticsPage from './AnalyticsPage';
import ProfilePage from './ProfilePage';
import LoginPage from './LoginPage';
import Logout from './logout';
import RegisterPage from './RegisterPage';
import { computeTeachingWeek } from './ClassUtils';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const breakWeek = 8; //SET BREAK WEEK HERE
  const week = computeTeachingWeek(new Date('2026-03-02T00:00:00'), breakWeek); //CHANGE SESSION DATE HERE
  const session = "Autumn"; //CHANGE SESSION HERE

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/authCheck`, {method: 'GET',credentials: 'include'});

        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }

        const data = await response.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, []);



  
  const ProtectedRoute = ({ children }) => {
    if (!isAuthChecked) {
      return null;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const PublicRoute = ({ children }) => {
    if (!isAuthChecked) {
      return null;
    }

    return isAuthenticated ? <Navigate to="/dashboard2" replace /> : children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage setIsAuthenticated={setIsAuthenticated} API_BASE_URL={API_BASE_URL} /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage API_BASE_URL={API_BASE_URL} /></PublicRoute>} />
        
        <Route
          path="/*"
          element={<ProtectedRoute>
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
                      <img src="/assets/icon-dashboard.svg" alt="" className="nav-thumbnail" />
                      <span className="nav-label">Dashboard</span>
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
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="students" element={<StudentsPage API_BASE_URL={API_BASE_URL} />} />
                  <Route path="profile" element={<ProfilePage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="analytics" element={<AnalyticsPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="dashboard" element={<DashboardPage API_BASE_URL={API_BASE_URL} week={week} session={session} />} />
                  <Route path="support" element={<SupportPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="test" element={<TestPage API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="logout" element={<Logout setIsAuthenticated={setIsAuthenticated} API_BASE_URL={API_BASE_URL}/>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;
