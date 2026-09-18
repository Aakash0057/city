import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Heart, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      setSubmitted(true)
      toast.success('Password reset instructions generated.')
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CityCare</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-1 text-xs text-gray-500">
            Enter your email and we'll send you a secure 15-minute reset token
          </p>
        </div>

        <div className="card shadow-lg p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Token Generated</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                If an account with <strong>{email}</strong> exists, a single-use reset token has been issued.
                (In this development environment, the token is printed directly to the backend server console).
              </p>
              <div className="pt-2">
                <Link to="/reset-password" className="btn-primary w-full justify-center text-xs py-2">
                  Proceed to Reset Page
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Registered Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@citycare.com"
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
