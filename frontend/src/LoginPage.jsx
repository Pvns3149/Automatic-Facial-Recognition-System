import { useState } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function LoginPage({setIsAuthenticated, API_BASE_URL}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email : email, passwd : password }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
    if (response.ok) {
        setIsAuthenticated(true);
        window.location.href = '/dashboard2';
      return;
    }
    alert( 'Login failed. Please check your credentials and try again.');

  };

  return (
    <main className="login-main">
      <section className="login-panel">
        <div className="login-brand">
          <img src="/assets/profile-picture.png" alt="" className="login-brand-logo" />
          <h1 className="login-brand-title">Automatic Student Attendance</h1>
          <p className="login-brand-subtitle">
            Sign in to manage classes, attendance, analytics, and support.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-heading">Welcome back</h2>
          <p className="login-helper">Use your tutor account credentials to continue.</p>


          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mathew.ryan@uow.edu.au"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="login-show-button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {errorMessage && <p className="login-error">{errorMessage}</p>}
          <div className="login-actions-row">
            <button type="submit" className="btn btn-primary login-submit">
              Sign in
            </button>
            <button
              type="button"
              className="btn btn-secondary login-submit"
              onClick={() => window.location.href = '/register'}
            >
              Sign up
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;