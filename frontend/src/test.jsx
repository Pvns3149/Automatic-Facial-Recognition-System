import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function HealthCheck() {
  const [users, setUsers] = useState([])
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    checkApiHealth()
    fetchUsers()
  }, [])

  // const checkApiHealth = async () => {
  //   try {
  //     const data = await api.healthCheck()
  //     setApiStatus(data.status)
  //   } catch {
  //     setApiStatus('disconnected')
  //   }
  // }
  //   async healthCheck() {
  //   const response = await fetch(`${API_BASE_URL}/health`);
  //   if (!response.ok) {
  //     throw new Error('Health check failed');
  //   }
  //   return response.json();
  // }

  const checkApiHealth = async () => {
    try{
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('API connection error');
      }
      const data = await response.json();
      setApiStatus(data.status)
    }
    catch (err) {
      console.error('API health check failed:', err)
      setApiStatus('disconnected')
    }
  }

  // const fetchUsers = async () => {
  //   try {
  //     const data = await api.getUsers()
  //     setUsers(data.users)
  //   } catch (err) {
  //     console.error('Failed to fetch users:', err)
  //   }
  // }

  //   async getUsers() {
  //   const response = await fetch(`${API_BASE_URL}/users`);
  //   if (!response.ok) {
  //     throw new Error('Failed to fetch users');
  //   }
  //   return response.json();
  // },

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users)
    }
    catch (err) {
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
          <p>No users found. Check DB connection</p>
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

export default HealthCheck
