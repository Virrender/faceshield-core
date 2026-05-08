import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Upload from './pages/Upload'
import Progress from './pages/Progress'
import History from './pages/History'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0f0f13]">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Navbar />
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress/:jobId"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Navbar />
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
