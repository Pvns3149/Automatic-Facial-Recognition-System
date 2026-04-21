import { useState } from 'react';

function RegisterPage({ API_BASE_URL }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffId: '',
    faculty: '',
    officeBuilding: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        id: form.staffId.trim(),
        faculty: form.faculty.trim(),
        officeBuilding: form.officeBuilding.trim(),
        password: form.password,
      }),
    });

    if (!response.ok) {
      alert(response.message || 'Registration failed.');
      return;
    }

    window.location.href = '/login';
  };

  return (
    <main className="login-main">
      <section className="login-panel">
        <div className="login-brand">
          <img src="/assets/profile-picture.png" alt="" className="login-brand-logo" />
          <h1 className="login-brand-title">Create Tutor Account</h1>
          <p className="login-brand-subtitle">
            Register your tutor profile details to continue using the system.
          </p>
        </div>

        <form className="login-form register-form" onSubmit={handleSubmit}>
          <h2 className="login-heading">Registration</h2>
          <p className="login-helper">All fields are required.</p>

          <label className="login-field">
            <span>Full name</span>
            <input
              type="text"
              value={form.fullName}
              onChange={handleChange('fullName')}
              placeholder="Enter full name"
              required
            />
          </label>

          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="Enter email"
              required
            />
          </label>

          <label className="login-field">
            <span>Phone number</span>
            <input
              type="text"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="Enter phone number"
              required
            />
          </label>

          <label className="login-field">
            <span>Staff Id</span>
            <input
              type="text"
              value={form.staffId}
              onChange={handleChange('staffId')}
              placeholder="Enter staff id"
              required
            />
          </label>

          <label className="login-field">
            <span>Faculty</span>
            <input
              type="text"
              value={form.faculty}
              onChange={handleChange('faculty')}
              placeholder="Enter faculty"
              required
            />
          </label>

          <label className="login-field">
            <span>Office Building</span>
            <input
              type="text"
              value={form.officeBuilding}
              onChange={handleChange('officeBuilding')}
              placeholder="Enter office building"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Create password"
              required
            />
          </label>

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <div className="login-actions-row">
            <button type="submit" className="btn btn-primary login-submit">
              Register
            </button>
            <button
              type="button"
              className="btn btn-secondary login-submit"
              onClick={href => window.location.href = '/login'}
            >
              Back to Sign in
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default RegisterPage;