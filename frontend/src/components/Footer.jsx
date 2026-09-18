import { Link } from 'react-router-dom'
import { Heart, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">CityCare Hospital</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Providing compassionate, world-class healthcare to our community since 1985.
              Open 24/7 for emergencies.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>Emergency: 1-800-CITY-CARE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>info@citycare.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>123 Health Avenue, Metropolis, CA 90210</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/services', label: 'Our Services' },
                { to: '/doctors', label: 'Find a Doctor' },
                { to: '/appointments/book', label: 'Book Appointment' },
                { to: '/emergency', label: 'Emergency' },
                { to: '/contact', label: 'Contact Us' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              {[
                'Cardiology',
                'Neurology',
                'Pediatrics',
                'Orthopedics',
                'Laboratory',
                'Pharmacy',
              ].map((s) => (
                <li key={s}>
                  <span className="hover:text-white transition-colors cursor-default">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CityCare Hospital. All rights reserved.</p>
          <p>A demo project — tracked as a CI in MedRelease SCM</p>
        </div>
      </div>
    </footer>
  )
}
