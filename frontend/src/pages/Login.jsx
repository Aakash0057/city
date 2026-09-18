import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Heart, Key, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.full_name || user.email}!`)
      if (from) {
        navigate(from, { replace: true })
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'DOCTOR') {
        navigate('/doctor', { replace: true })
      } else {
        navigate('/portal', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
      toast.error(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to fill demo account
  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('Password123!')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CityCare</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-1 text-xs text-gray-500">
            Access your medical records, appointment schedule, or clinical dashboard
          </p>
        </div>

        <div className="card shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@citycare.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@citycare.com')}
                className="p-2 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('doctor@citycare.com')}
                className="p-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => fillDemo('patient@citycare.com')}
                className="p-2 border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
              >
                Patient
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Password: <code className="bg-gray-100 px-1 py-0.5 rounded">Password123!</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Register as a patient
          </Link>
        </p>
      </div>
    </div>
  )
}
