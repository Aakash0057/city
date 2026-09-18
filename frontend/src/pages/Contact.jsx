import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function Contact() {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.contact.submit(formData)
      toast.success('Your message has been received. Our team will contact you shortly.')
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">Get in Touch</span>
        <h1 className="text-3xl font-bold text-gray-900">Contact CityCare Hospital</h1>
        <p className="text-gray-500 text-sm">
          Have questions about our medical services, insurance coverage, or patient billing? Send us an inquiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card space-y-6 bg-gradient-to-br from-primary-900 to-primary-800 text-white border-0">
            <h3 className="text-xl font-bold">Contact Information</h3>
            <p className="text-sm text-primary-100 leading-relaxed">
              Our clinical and administrative support desks are here to assist patients, families, and referring physicians.
            </p>

            <div className="space-y-4 text-sm text-primary-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Main Hospital Campus</p>
                  <p>123 Health Avenue, Metropolis, CA 90210</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Direct Telephone</p>
                  <p>General: (555) 019-2831</p>
                  <p>Emergency: 1-800-CITY-CARE (24/7)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Email Address</p>
                  <p>support@citycare.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Operating Hours</p>
                  <p>Emergency & Inpatient: 24/7 / 365</p>
                  <p>Outpatient Clinics: Mon – Fri 8:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="card">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Inquiry Sent Successfully</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Thank you for reaching out. A patient care representative will review your message
                  and respond within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn-secondary text-xs"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Send an Online Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="Appointment question, Billing, etc."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Message / Details *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can our clinical or administrative team assist you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center text-sm py-2.5"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Submit Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
