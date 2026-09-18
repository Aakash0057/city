import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Award, Phone, Mail } from 'lucide-react'
import { api } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.doctors.list(),
      api.doctors.specialties(),
    ])
      .then(([docRes, specRes]) => {
        setDoctors(docRes.items || docRes)
        setSpecialties(specRes)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec = !selectedSpecialty || doc.specialty === selectedSpecialty
    const matchesSearch =
      !search ||
      doc.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.bio?.toLowerCase().includes(search.toLowerCase())
    return matchesSpec && matchesSearch
  })

  if (loading) return <PageLoader />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Medical Directory</span>
        <h1 className="text-3xl font-bold text-gray-900">Find a Specialist Physician</h1>
        <p className="text-gray-500 text-sm">
          Browse our team of board-certified clinicians and schedule your in-person or telehealth visit.
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by physician name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="input w-full sm:w-56"
          >
            <option value="">All Specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
                  {doc.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'MD'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doc.full_name}</h3>
                  <p className="text-xs font-semibold text-primary-600">{doc.specialty}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-yellow-500" />
                    {doc.years_experience} Years Experience
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4 line-clamp-3 leading-relaxed">
                {doc.bio || 'Dedicated medical professional committed to excellence in patient treatment and care.'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5 text-xs text-gray-500">
                {doc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{doc.phone}</span>
                  </div>
                )}
                {doc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{doc.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                to={`/appointments/book?doctor_id=${doc.id}`}
                className="btn-primary w-full justify-center text-xs"
              >
                <Calendar className="w-4 h-4" />
                Book with Dr. {doc.full_name?.split(' ').pop()}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No physicians match your filter criteria.
        </div>
      )}
    </div>
  )
}
