import { useState } from 'react'
import { AlertTriangle, PhoneCall, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function Emergency() {
  const toast = useToast()
  const [formData, setFormData] = useState({
    patient_name: '',
    contact_phone: '',
    chief_complaint: '',
    severity: 'MEDIUM',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.emergency.submit(formData)
      setTicket(res)
      toast.success('Emergency intake registered! Report to ED reception immediately.')
    } catch (err) {
      toast.error(err.message || 'Failed to register emergency ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Alert Banner */}
      <div className="bg-red-600 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Experiencing a Life-Threatening Medical Emergency?</h2>
            <p className="text-sm text-red-100">
              Call <strong>911</strong> immediately or dial our Emergency Hotline at <strong>1-800-CITY-CARE</strong>.
            </p>
          </div>
        </div>
        <a
          href="tel:18002489227"
          className="btn-secondary bg-white text-red-700 font-bold hover:bg-red-50 shrink-0 px-5 py-2.5"
        >
          <PhoneCall className="w-4 h-4" />
          Call 1-800-CITY-CARE
        </a>
      </div>

      {ticket ? (
        <div className="card text-center p-8 space-y-6 border-2 border-teal-500">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="badge-yellow text-sm font-semibold">STATUS: WAITING FOR TRIAGE</span>
            <h2 className="text-2xl font-bold text-gray-900">Emergency Intake Ticket #{ticket.id}</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Please present this ticket ID to the triage nurse at CityCare Hospital Emergency Department desk.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Patient:</span>
              <span className="font-semibold text-gray-800">{ticket.patient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reported Severity:</span>
              <span className="font-semibold text-red-600">{ticket.severity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Complaint:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[200px]">{ticket.chief_complaint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registered:</span>
              <span className="font-semibold text-gray-800">{new Date(ticket.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          <button
            onClick={() => setTicket(null)}
            className="btn-secondary text-xs"
          >
            Submit Another Intake
          </button>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Emergency Department Online Intake Registration
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Expedite your triage intake by registering your arrival. Clinicians continuously monitor this queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Smith"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Contact Telephone *</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 012-3456"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Primary Symptom / Chief Complaint *</label>
              <input
                type="text"
                required
                placeholder="e.g. Severe chest pain radiating to left arm, acute abdominal pain, etc."
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Self-Assessed Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="input"
                >
                  <option value="CRITICAL">CRITICAL (Unconscious, severe trauma, chest pain)</option>
                  <option value="HIGH">HIGH (Severe pain, breathing difficulty, acute fracture)</option>
                  <option value="MEDIUM">MEDIUM (Moderate laceration, high fever, dizziness)</option>
                  <option value="LOW">LOW (Minor sprain, rash, mild symptoms)</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Arrival Time / Location</label>
                <input
                  type="text"
                  placeholder="Arriving in 10 mins / At reception"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
              <span>
                Triage nurses prioritize patients by clinical acuity (CRITICAL &gt; HIGH &gt; MEDIUM &gt; LOW).
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-danger w-full justify-center py-3 text-base font-semibold shadow-lg shadow-red-500/20"
            >
              {submitting ? 'Registering Intake...' : 'Submit Emergency Intake Ticket'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
