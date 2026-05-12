import { useState, useEffect } from 'react'
import './App.css'

function HealthCheck({ API_BASE_URL }) {
  const [apiStatus, setApiStatus] = useState('checking...')
  const [dbStatus, setDbStatus] = useState('checking...')

  useEffect(() => {
    checkApiHealth()
    checkDbHealth()
  }, [])

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


  const checkDbHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      if (data && Array.isArray(data.users)) {
        setDbStatus('healthy')
      }
    }
    catch (err) {
      console.error('DB error:', err)
      setDbStatus('disconnected')
    }
  }




  return (
    <div className="container">
      <h1>Facial Recognition System</h1>
      
      <div className="status-card">
        <h2 style={{ color: 'grey' }}>API Status</h2>
        <p className={`status ${apiStatus === 'healthy' ? 'healthy' : 'error'}`}>
          {apiStatus}
        </p>
      </div>

      <div className="status-card">
        <h2 style={{ color: 'grey' }}>DB Connection Status</h2>
        <p className={`status ${dbStatus === 'healthy' ? 'healthy' : 'error'}`}>
          {dbStatus}
        </p>
      </div>
    </div>
  )
}

export default HealthCheck
