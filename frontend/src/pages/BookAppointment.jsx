import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar as CalendarIcon, Clock, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageLoader } from '../components/LoadingSpinner'

export default function BookAppointment() {
  const [searchParams] = useSearchParams()
  const preDoctorId = searchParams.get('doctor_id')
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState(preDoctorId ? Number(preDoctorId) : '')
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // tomorrow
  )
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(null)

  useEffect(() => {
    api.doctors.list()
      .then((res) => {
        const items = res.items || res
        setDoctors(items)
        if (!selectedDoctorId && items.length > 0) {
          setSelectedDoctorId(items[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }, [])

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([])
      setSelectedSlot('')
      return
    }
    setLoadingSlots(true)
    setSelectedSlot('')
    api.appointments.slots(selectedDoctorId, selectedDate)
      .then((res) => {
        const slotList = res.available_slots || res.slots || []
        setSlots(slotList)
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to fetch slots')
        setSlots([])
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDoctorId, selectedDate])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.info('Please sign in or register to complete your appointment booking.')
      navigate('/login', { state: { from: { pathname: '/appointments/book' } } })
      return
    }
    if (!selectedSlot) {
      toast.error('Please select an available appointment time slot.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        doctor_id: Number(selectedDoctorId),
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        reason: reason || 'General medical consultation',
        notes: notes || undefined,
      }
      const res = await api.appointments.book(payload)
      setBookingSuccess(res)
      toast.success('Appointment scheduled successfully!')
    } catch (err) {
      toast.error(err.message || 'Could not schedule appointment. Slot may be taken.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDocs) return <PageLoader />

  const selectedDoctor = doctors.find((d) => d.id === Number(selectedDoctorId))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">Scheduling</span>
        <h1 className="text-3xl font-bold text-gray-900">Book a Doctor's Appointment</h1>
        <p className="text-gray-500 text-sm">
          Select your specialist, choose a convenient date and time, and confirm your visit.
        </p>
      </div>

      {bookingSuccess ? (
        <div className="card text-center p-8 space-y-6 max-w-md mx-auto border-2 border-primary-500">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="badge-blue text-xs">CONFIRMED</span>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Booked!</h2>
            <p className="text-sm text-gray-600">
              Confirmation reference ID: #{bookingSuccess.id}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Physician:</span>
              <span className="font-semibold text-gray-800">
                {selectedDoctor?.full_name || `Doctor #${bookingSuccess.doctor_id}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-semibold text-gray-800">{bookingSuccess.appointment_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time Slot:</span>
              <span className="font-semibold text-primary-700">{bookingSuccess.time_slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reason:</span>
              <span className="font-semibold text-gray-800">{bookingSuccess.reason}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/portal')}
              className="btn-primary text-xs"
            >
              Go to Patient Portal
            </button>
            <button
              onClick={() => {
                setBookingSuccess(null)
                setSelectedSlot('')
                setReason('')
              }}
              className="btn-secondary text-xs"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBook} className="card space-y-6">
          {/* Step 1: Doctor & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary-600" />
                Select Specialist *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="input"
                required
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} — {d.specialty}
                  </option>
                ))}
              </select>
              {selectedDoctor && (
                <p className="text-xs text-gray-500 mt-1">
                  Department: <span className="font-medium text-gray-700">{selectedDoctor.specialty}</span> ({selectedDoctor.years_experience} yrs exp)
                </p>
              )}
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-primary-600" />
                Appointment Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Clinical appointments run Monday–Friday, 09:00 to 17:00
              </p>
            </div>
          </div>

          {/* Step 2: Available Slots */}
          <div className="space-y-3 pt-2">
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-600" />
                Available 30-Minute Time Slots *
              </span>
              {loadingSlots && <span className="text-xs text-primary-600">Updating slots...</span>}
            </label>

            {slots.length === 0 && !loadingSlots ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                No slots available on this date. Please pick another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((s) => {
                  const isAvailable = s.is_available
                  const isSelected = selectedSlot === s.time_slot
                  return (
                    <button
                      type="button"
                      key={s.time_slot}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(s.time_slot)}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-300'
                          : isAvailable
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                          : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                      }`}
                    >
                      {s.time_slot}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 3: Consultation Reason */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="label flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-600" />
                Reason for Visit *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual cardiology checkup, recurring headache, follow-up"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Additional Notes for Clinician (Optional)</label>
              <textarea
                rows={2}
                placeholder="List current symptoms, existing medications, or prior surgical history..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {selectedSlot ? (
                <span>
                  Selected: <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>
                </span>
              ) : (
                <span className="text-amber-600">Please select a time slot above</span>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
