import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate             = useNavigate()

  function handleLogout() {
    logoutUser()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/upload" style={styles.brand}>FaceShield</Link>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/upload"  style={styles.link}>Upload</Link>
            <Link to="/history" style={styles.link}>History</Link>
            <span style={styles.email}>{user.email}</span>
            <button style={styles.logout} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"    style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav:    { background: '#1a1a24', borderBottom: '1px solid #2a2a38', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand:  { color: '#6c63ff', fontWeight: '700', fontSize: '18px', textDecoration: 'none' },
  links:  { display: 'flex', alignItems: 'center', gap: '20px' },
  link:   { color: '#888', textDecoration: 'none', fontSize: '14px' },
  email:  { color: '#666', fontSize: '13px' },
  logout: { background: 'none', border: '1px solid #2a2a38', color: '#888', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
}