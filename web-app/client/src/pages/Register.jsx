import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { register } from '../api'
import { useAuth } from '../context/AuthContext'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await register(email, password)
      const token = res.data.token
      const user = res.data.user || { email }
      loginUser(token, user)
      navigate('/upload')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0f0f13] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6c63ff]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6c63ff]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#43d9ad]/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="logo-container">
          <Shield className="lucide-shield" />
          <span className="logo-text">FaceShield</span>
        </Link>

        {/* Card */}
        <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-3xl px-12 py-10 sm:px-14 sm:py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3 text-white">Create your account</h1>
            <p className="text-[#a1a1aa] text-base">Start protecting your photos today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-2xl text-[#ff6b6b] text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-3 ai-style-change-1">
              <label htmlFor="email" className="block text-base font-semibold text-white ai-style-change-2" style={{ paddingLeft: '1.5rem' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-14 pr-6 py-4 bg-[#27272a] border border-[#2a2a38] rounded-xl text-white placeholder-[#71717a] text-lg focus:outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 transition-all h-14"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3 password-container">
              <label htmlFor="password" className="block text-base font-semibold text-white" style={{ paddingLeft: '1.5rem' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-14 pr-6 py-4 bg-[#27272a] border border-[#2a2a38] rounded-xl text-white placeholder-[#71717a] text-lg focus:outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 transition-all h-14"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base mt-8 create-account"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center text-sm text-[#71717a]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6c63ff] hover:text-[#7b72ff] font-semibold transition-colors">
              Sign in
            </Link>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-[#71717a] mt-8 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Register