import { Heart, Award, ShieldCheck, Users, Target, Building } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">About CityCare</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Dedicated to Healing, Serving, and Innovating
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Founded with a mission to make world-class healthcare accessible to every citizen,
          CityCare Hospital has grown into a regional center of clinical excellence, blending
          medical expertise with digital healthcare systems.
        </p>
      </div>

      {/* Grid of values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card text-center p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Our Mission</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            To provide compassionate, comprehensive, and patient-centered clinical care
            supported by cutting-edge technology and evidence-based medicine.
          </p>
        </div>

        <div className="card text-center p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Our Vision</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            To be recognized as the foremost healthcare institution for clinical innovation,
            operational agility, and patient satisfaction across the nation.
          </p>
        </div>

        <div className="card text-center p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Our Values</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Integrity, clinical precision, patient empathy, and technological transparency
            in every patient touchpoint and pharmaceutical dispensation.
          </p>
        </div>
      </div>

      {/* Architecture & SCM note */}
      <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-600" />
            Software Configuration Management Integration
          </h2>
          <p className="text-sm text-primary-700 max-w-2xl leading-relaxed">
            CityCare Hospital is architected as an interconnected set of Configuration Items (CIs):
            <strong> Emergency Triage</strong>, <strong>Laboratory Diagnostics</strong>, <strong>Pharmacy Inventory</strong>,
            <strong> Cross-Module Reporting</strong>, and the <strong>Doctor Dashboard</strong>.
            This modularity allows isolated testing, traceable deployments, and high operational resilience.
          </p>
        </div>
        <div className="shrink-0">
          <span className="badge-blue text-sm px-4 py-2 font-mono">MedRelease SCM Compliant</span>
        </div>
      </div>
    </div>
  )
}
