import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  AlertTriangle,
  FlaskConical,
  Pill,
  Clock,
  User,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Stethoscope,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import EmergencyQueue from '../features/emergency/EmergencyQueue'
import LabOrderList from '../features/laboratory/LabOrderList'
import PrescriptionList from '../features/pharmacy/PrescriptionList'
import ReportingDashboard from '../features/reporting/ReportingDashboard'
import { PageLoader } from '../components/LoadingSpinner'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'emergency' | 'laboratory' | 'pharmacy' | 'reporting'

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.dashboard.get()
      setData(res)
    } catch (err) {
      toast.error(err.message || 'Failed to load doctor dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleUpdateApptStatus = async (apptId, status) => {
    try {
      await api.appointments.updateStatus(apptId, { status })
      toast.success(`Appointment marked as ${status}`)
      loadDashboard()
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment status')
    }
  }

  if (loading) return <PageLoader />

  const todayAppts = data?.today_appointments || []
  const emergencyQueue = data?.emergency_queue || []
  const pendingLabs = data?.pending_lab_orders || []
  const recentRxs = data?.recent_prescriptions || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Banner */}
      <div className="card bg-gradient-to-r from-teal-900 via-primary-900 to-primary-800 text-white p-6 border-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-teal-300">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue bg-teal-400/20 text-teal-200 border-0 text-xs font-semibold">
                {data?.doctor_profile?.specialty || 'Specialist'} Physician
              </span>
              {data?.doctor_profile?.room_number && (
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-teal-100 font-mono">
                  {data.doctor_profile.room_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{data?.doctor_profile?.name || user?.full_name || 'Dr. Physician'}</h1>
            <p className="text-xs text-primary-200 mt-0.5">
              Department of {data?.doctor_profile?.specialty || 'Specialty Medicine'} • CityCare Hospital • Fee: ${data?.doctor_profile?.consultation_fee ?? 100}
            </p>
          </div>
        </div>
        <button
          onClick={loadDashboard}
          className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Workspace
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Consultations"
          value={todayAppts.length}
          subtitle="Scheduled clinical appointments"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Live Emergency Queue"
          value={emergencyQueue.length}
          subtitle="Awaiting physician triage"
          icon={AlertTriangle}
          color={emergencyQueue.length > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Pending Lab Orders"
          value={pendingLabs.length}
          subtitle="In processing or ready"
          icon={FlaskConical}
          color="teal"
        />
        <StatCard
          title="Active Prescriptions"
          value={recentRxs.length}
          subtitle="Prescribed courses"
          icon={Pill}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Today’s Schedule', icon: Calendar },
          { id: 'emergency', label: `Emergency Queue (${emergencyQueue.length})`, icon: AlertTriangle },
          { id: 'laboratory', label: 'Laboratory Diagnostics', icon: FlaskConical },
          { id: 'pharmacy', label: 'Pharmacy & Prescriptions', icon: Pill },
          { id: 'reporting', label: 'Clinical Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT: Overview (Today's Schedule) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Today's Scheduled Consultations
            </h2>
            <DataTable
              data={todayAppts}
              emptyMessage="No consultations scheduled for today."
              columns={[
                {
                  header: 'Slot',
                  key: 'time_slot',
                  render: (slot) => (
                    <span className="font-mono font-semibold text-xs text-primary-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {slot}
                    </span>
                  ),
                },
                {
                  header: 'Patient Name',
                  key: 'patient',
                  render: (_, row) => (
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">
                        {row.patient?.full_name || `Patient #${row.patient_id}`}
                      </p>
                      <p className="text-[11px] text-gray-400">{row.patient?.phone || 'No phone'}</p>
                    </div>
                  ),
                },
                {
                  header: 'Reason for Visit',
                  key: 'reason',
                  render: (r) => <span className="text-xs text-gray-600">{r}</span>,
                },
                {
                  header: 'Status',
                  key: 'status',
                  render: (s) => <Badge status={s} />,
                },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (_, row) => (
                    <div className="flex items-center gap-2">
                      {row.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleUpdateApptStatus(row.id, 'COMPLETED')}
                            className="btn-success text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Done
                          </button>
                          <button
                            onClick={() => handleUpdateApptStatus(row.id, 'NO_SHOW')}
                            className="btn-secondary text-xs py-1 px-2 text-gray-500"
                          >
                            No Show
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Emergency */}
      {activeTab === 'emergency' && <EmergencyQueue isClinical />}

      {/* TAB CONTENT: Laboratory */}
      {activeTab === 'laboratory' && <LabOrderList isDoctor />}

      {/* TAB CONTENT: Pharmacy */}
      {activeTab === 'pharmacy' && <PrescriptionList isDoctor />}

      {/* TAB CONTENT: Reporting */}
      {activeTab === 'reporting' && <ReportingDashboard />}
    </div>
  )
}
