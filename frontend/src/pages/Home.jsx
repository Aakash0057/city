import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Calendar,
  AlertTriangle,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  PhoneCall,
  Activity,
  Users,
  Building2,
} from 'lucide-react'
import { api } from '../services/api'

export default function Home() {
  const [services, setServices] = useState([])
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    api.services.list().then(setServices).catch(() => {})
    api.doctors.list({ limit: 4 }).then((data) => setDoctors(data.items || data)).catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-teal-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                24/7 Emergency & Critical Care Hospital
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Modern Healthcare, <br />
                <span className="text-teal-300">Compassionate</span> Touch.
              </h1>
              <p className="text-lg text-primary-100 max-w-xl leading-relaxed">
                CityCare Hospital delivers world-class medical expertise, advanced diagnostic
                laboratories, and rapid emergency triage — all connected seamlessly for your well-being.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/appointments/book"
                  className="btn-primary bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book an Appointment
                </Link>
                <Link
                  to="/emergency"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-lg shadow-red-600/25"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Intake
                </Link>
                <Link
                  to="/services"
                  className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/30 px-6 py-3 rounded-xl"
                >
                  Explore Services
                </Link>
              </div>
            </div>

            {/* Quick Stat / Banner Box */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-300" />
                  Hospital Highlights
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-3xl font-bold text-teal-300">50+</p>
                    <p className="text-xs text-primary-200 mt-1">Specialist Doctors</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-3xl font-bold text-teal-300">24/7</p>
                    <p className="text-xs text-primary-200 mt-1">Emergency Triage</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-3xl font-bold text-teal-300">99.2%</p>
                    <p className="text-xs text-primary-200 mt-1">Patient Satisfaction</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-3xl font-bold text-teal-300">&lt; 15 min</p>
                    <p className="text-xs text-primary-200 mt-1">Avg Emergency Wait</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center gap-3">
                  <PhoneCall className="w-6 h-6 text-red-300 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-200 uppercase tracking-wide">Emergency Hotline</p>
                    <p className="text-lg font-bold text-white">1-800-CITY-CARE</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Features */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="p-3 bg-primary-100 text-primary-600 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Certified Clinical Excellence</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Accredited physicians and state-of-the-art diagnostic equipment adhering to international standards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="p-3 bg-teal-100 text-teal-600 rounded-xl shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Real-Time Queue Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Live priority triage for emergency care and instant slot booking with zero double-booking.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Integrated Pharmacy & Lab</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Seamless prescriptions, automated stock tracking, digital test orders, and rapid results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clinical Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">Departments</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">Our Medical Services</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-xl">
                Comprehensive care spanning advanced cardiology, pediatric specialties, orthopedic surgery, and urgent care.
              </p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 mt-4 md:mt-0">
              View all services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((srv) => (
              <div key={srv.id} className="card hover:shadow-md transition-shadow group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    {srv.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{srv.name}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">CI Code: {srv.code}</span>
                  <Link
                    to="/appointments/book"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Book Specialist &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Medical Staff</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">Meet Our Specialists</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-xl">
                Board-certified physicians committed to evidence-based medical treatment.
              </p>
            </div>
            <Link to="/doctors" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 mt-4 md:mt-0">
              Browse doctor directory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((doc) => (
              <div key={doc.id} className="card text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary-600 to-teal-400 flex items-center justify-center text-white text-2xl font-bold shadow-md mb-4">
                  {doc.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'MD'}
                </div>
                <h3 className="font-semibold text-gray-900 text-base">{doc.full_name}</h3>
                <p className="text-xs font-medium text-primary-600 mt-0.5">{doc.specialty}</p>
                <p className="text-xs text-gray-400 mt-2">{doc.years_experience} years experience</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/appointments/book?doctor_id=${doc.id}`}
                    className="btn-primary w-full justify-center text-xs py-2"
                  >
                    Book Visit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Experience Modern Care?</h2>
          <p className="text-primary-100 max-w-xl mx-auto text-sm">
            Create an account in seconds to schedule appointments, review laboratory results,
            and manage active prescription refills directly online.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link to="/register" className="btn-secondary text-primary-700 font-semibold px-6 py-2.5">
              Register as Patient
            </Link>
            <Link to="/contact" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10 px-6 py-2.5">
              Contact Hospital
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
