import { useState, useEffect } from 'react'
import './App.css'
import api from './services/api'

function App() {
  const [users, setUsers] = useState([])
  const [apiStatus, setApiStatus] = useState('checking...')
  //const [newUser, setNewUser] = useState({ name: '', email: '' })
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

  return (
    <div className="container">
      <h1>Facial Recognition System</h1>
      
      <div className="status-card">
        <h2>API Status</h2>
        <p className={`status ${apiStatus === 'healthy' ? 'healthy' : 'error'}`}>
          {apiStatus}
        </p>
      </div>

      {
      <div className="card">
        <h2>Users ({users.length})</h2>
        {users.length === 0 ? (
          <p>No users found. Add one above!</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div>
                  <strong>{user.col1}</strong>
                  <br />
                  <small>{user.col2}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div> }
    </div>
  )
}

export default App
