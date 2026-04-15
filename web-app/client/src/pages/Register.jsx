import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { loginUser }           = useAuth()
  const navigate                = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(email, password)
      loginUser(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>FaceShield</h1>
        <p style={styles.sub}>Create your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13' },
  card:  { background: '#1a1a24', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #2a2a38' },
  title: { color: '#fff', fontSize: '28px', marginBottom: '6px', textAlign: 'center' },
  sub:   { color: '#888', textAlign: 'center', marginBottom: '28px' },
  input: { width: '100%', padding: '12px', marginBottom: '14px', background: '#0f0f13', border: '1px solid #2a2a38', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  btn:   { width: '100%', padding: '12px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' },
  error: { background: '#2d1515', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' },
  link:  { color: '#888', textAlign: 'center', marginTop: '20px', fontSize: '14px' },
}