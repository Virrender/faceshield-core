import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar      from './components/Navbar'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Upload      from './pages/Upload'
import JobProgress from './pages/JobProgress'
import History     from './pages/History'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/upload"          element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/progress/:jobId" element={<PrivateRoute><JobProgress /></PrivateRoute>} />
        <Route path="/history"         element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="*"                element={<Navigate to="/upload" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}