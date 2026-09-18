import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.services.list()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">Hospital Departments</span>
        <h1 className="text-3xl font-bold text-gray-900">Clinical Services & Specialties</h1>
        <p className="text-gray-500 text-sm">
          CityCare Hospital offers inpatient and outpatient clinical departments equipped with
          state-of-the-art diagnostic and surgical technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div key={srv.id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                  {srv.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="badge-blue text-xs font-mono">CI: {srv.code}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{srv.name}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{srv.description}</p>
              
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Outpatient & Inpatient Consultations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Integrated Diagnostics & Lab Work</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Direct Pharmacy Dispensation</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                to={`/appointments/book`}
                className="btn-primary w-full justify-center text-xs"
              >
                <Calendar className="w-4 h-4" />
                Schedule Consultation
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
