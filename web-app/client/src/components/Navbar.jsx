import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Upload, Clock, LogOut } from 'lucide-react'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a38] bg-[#0f0f13]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/upload" className="flex items-center gap-2 group">
          <Shield className="w-6 h-6 text-[#6c63ff] group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold tracking-tight">FaceShield</span>
        </Link>

        <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center sm:justify-start gap-4">
          <Link
            to="/upload"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-colors ${
              isActive('/upload')
                ? 'text-[#6c63ff]'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#1a1a24]'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-colors ${
              isActive('/history')
                ? 'text-[#6c63ff]'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#1a1a24]'
            }`}
          >
            <Clock className="w-5 h-5" />
            History
          </Link>
        </div>

        <div className="order-2 sm:order-3 ml-auto sm:ml-0 max-w-full flex items-center gap-2 sm:gap-4">
          <span className="hidden md:block max-w-[220px] truncate text-sm text-[#71717a]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1a24] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
