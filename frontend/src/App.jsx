import { useState, useEffect } from 'react'
import './App.css'
import api from './services/api'

function App() {
  const [users, setUsers] = useState([])
  const [apiStatus, setApiStatus] = useState('checking...')
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkApiHealth()
    fetchUsers()
  }, [])

  const checkApiHealth = async () => {
    try {
      const data = await api.healthCheck()
      setApiStatus(data.status)
    } catch {
      setApiStatus('disconnected')
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data.users)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.createUser(newUser)
      setNewUser({ name: '', email: '' })
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      await api.deleteUser(id)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Facial Recognition System</h1>
      
      <div className="status-card">
        <h2>API Status</h2>
        <p className={`status ${apiStatus === 'healthy' ? 'healthy' : 'error'}`}>
          {apiStatus}
        </p>
      </div>

      <div className="card">
        <h2>Add New User</h2>
        <form onSubmit={handleCreateUser}>
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Users ({users.length})</h2>
        {users.length === 0 ? (
          <p>No users found. Add one above!</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div>
                  <strong>{user.name}</strong>
                  <br />
                  <small>{user.email}</small>
                </div>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
