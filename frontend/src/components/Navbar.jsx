import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Heart, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const dashboardPath = isAdmin ? '/admin' : isDoctor ? '/doctor' : '/portal'

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-1.5 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-primary-700">CityCare</span>
            <span className="hidden sm:block text-gray-400 text-sm font-normal">Hospital</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.full_name || user.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    {isPatient && (
                      <Link
                        to="/appointments/book"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Book Appointment
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-xs py-1.5 px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs py-1.5 px-3">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `py-2 text-sm font-medium ${isActive ? 'text-primary-600' : 'text-gray-700'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <hr className="my-2 border-gray-100" />
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="py-2 text-sm text-gray-700">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="py-2 text-sm text-red-600 text-left">
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 justify-center text-xs">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 justify-center text-xs">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
