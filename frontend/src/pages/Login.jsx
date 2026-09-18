import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Heart, Stethoscope, ShieldCheck, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const DOCTORS = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'doctor@citycare.com',
    specialty: 'Cardiology',
    suite: 'Suite 302',
    color: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Dr. Marcus Chen',
    email: 'doctor.marcus@citycare.com',
    specialty: 'Neurology',
    suite: 'Suite 405',
    color: 'border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900',
    badge: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Dr. Priya Patel',
    email: 'doctor.priya@citycare.com',
    specialty: 'Pediatrics',
    suite: 'Suite 201',
    color: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Dr. James Wilson',
    email: 'doctor.james@citycare.com',
    specialty: 'Orthopedics',
    suite: 'Suite 110',
    color: 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900',
    badge: 'bg-amber-100 text-amber-700',
  },
]

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

  const performLogin = async (loginEmail, loginPassword) => {
    setError('')
    setLoading(true)
    try {
      const user = await login(loginEmail, loginPassword)
      toast.success(`Welcome, ${user.full_name || user.email}!`)
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

  const handleSubmit = (e) => {
    e.preventDefault()
    performLogin(email, password)
  }

  // Quick Select & auto-fill
  const selectDoctor = (docEmail) => {
    setEmail(docEmail)
    setPassword('Password123!')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CityCare</span>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-1 text-xs text-gray-500">
            Select a physician or enter your hospital credentials
          </p>
        </div>

        {/* Doctor Quick Login Selector Cards */}
        <div className="card p-5 bg-gradient-to-b from-blue-50/50 to-white border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-primary-600" />
              Doctor Logins (Select Physician)
            </span>
            <span className="text-[11px] text-gray-400">Click to fill credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DOCTORS.map((doc) => {
              const isSelected = email === doc.email
              return (
                <button
                  type="button"
                  key={doc.email}
                  onClick={() => selectDoctor(doc.email)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${doc.color} ${
                    isSelected ? 'ring-2 ring-primary-500 shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{doc.name}</p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${doc.badge}`}>
                        {doc.specialty}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{doc.suite}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 font-mono truncate">{doc.email}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Login Form */}
        <div className="card shadow-lg p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
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
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Admin & Patient Quick Buttons */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
              Other Hospital Accounts
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@citycare.com')
                  setPassword('Password123!')
                }}
                className={`p-2 border rounded-lg font-medium transition-colors text-center ${
                  email === 'admin@citycare.com'
                    ? 'border-purple-500 bg-purple-100 text-purple-800'
                    : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-purple-600" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('patient@citycare.com')
                  setPassword('Password123!')
                }}
                className={`p-2 border rounded-lg font-medium transition-colors text-center ${
                  email === 'patient@citycare.com'
                    ? 'border-green-500 bg-green-100 text-green-800'
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-green-600" />
                John Doe
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('jane.smith@citycare.com')
                  setPassword('Password123!')
                }}
                className={`p-2 border rounded-lg font-medium transition-colors text-center ${
                  email === 'jane.smith@citycare.com'
                    ? 'border-teal-500 bg-teal-100 text-teal-800'
                    : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-teal-600" />
                Jane Smith
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center pt-1">
              Standard demo password: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">Password123!</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Need a patient account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Register as a new patient
          </Link>
        </p>
      </div>
    </div>
  )
}
