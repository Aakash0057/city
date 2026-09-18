import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Heart, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await api.auth.resetPassword(token.trim(), newPassword)
      setSuccess(true)
      toast.success('Password successfully reset! You can now sign in.')
    } catch (err) {
      setError(err.message || 'Invalid or expired reset token.')
      toast.error(err.message || 'Password reset failed.')
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
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Set New Password</h2>
          <p className="mt-1 text-xs text-gray-500">
            Enter your reset token and your new chosen password
          </p>
        </div>

        <div className="card shadow-lg p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Password Updated</h3>
              <p className="text-xs text-gray-600">
                Your password has been changed securely.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center text-xs py-2"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Reset Token *</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from console / email"
                  className="input font-mono text-xs"
                />
              </div>

              <div>
                <label className="label">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
