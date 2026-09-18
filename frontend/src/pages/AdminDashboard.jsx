import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Users,
  Calendar,
  AlertTriangle,
  FlaskConical,
  Pill,
  MessageSquare,
  History,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import EmergencyQueue from '../features/emergency/EmergencyQueue'
import LabOrderList from '../features/laboratory/LabOrderList'
import MedicineInventory from '../features/pharmacy/MedicineInventory'
import RefillList from '../features/pharmacy/RefillList'
import PrescriptionList from '../features/pharmacy/PrescriptionList'
import ReportingDashboard from '../features/reporting/ReportingDashboard'
import { PageLoader } from '../components/LoadingSpinner'

export default function AdminDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'appointments' | 'emergency' | 'laboratory' | 'pharmacy' | 'inquiries' | 'activity'

  // Data for admin sub-tabs
  const [appointments, setAppointments] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAppointments = useCallback(async () => {
    try {
      const res = await api.appointments.all()
      setAppointments(res.items || res)
    } catch {}
  }, [])

  const loadInquiries = useCallback(async () => {
    try {
      const res = await api.contact.list()
      setInquiries(res.items || res)
    } catch {}
  }, [])

  const loadActivityLogs = useCallback(async () => {
    try {
      const res = await api.activity.list({ limit: 50 })
      setActivityLogs(res.items || res)
    } catch {}
  }, [])

  useEffect(() => {
    if (activeTab === 'appointments') loadAppointments()
    if (activeTab === 'inquiries') loadInquiries()
    if (activeTab === 'activity') loadActivityLogs()
  }, [activeTab, loadAppointments, loadInquiries, loadActivityLogs])

  const handleUpdateInquiryStatus = async (id, status) => {
    try {
      await api.contact.updateStatus(id, { status })
      toast.success(`Inquiry #${id} marked as ${status}`)
      loadInquiries()
    } catch (err) {
      toast.error(err.message || 'Failed to update inquiry')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="card bg-gradient-to-r from-gray-900 via-primary-950 to-teal-950 text-white p-6 border-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-teal-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="badge-purple bg-purple-500/20 text-purple-200 border-0 text-xs">
              Hospital Executive Control Center
            </span>
            <h1 className="text-2xl font-bold mt-1">Admin Portal: {user?.full_name || 'Administrator'}</h1>
            <p className="text-xs text-gray-300">
              Cross-Service Governance • MedRelease SCM Configuration Items Manager
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 overflow-x-auto">
        {[
          { id: 'analytics', label: 'Cross-Module Analytics', icon: BarChart3 },
          { id: 'appointments', label: 'All Appointments', icon: Calendar },
          { id: 'emergency', label: 'Emergency Department', icon: AlertTriangle },
          { id: 'laboratory', label: 'Laboratory Orders', icon: FlaskConical },
          { id: 'pharmacy', label: 'Pharmacy Formulary & Refills', icon: Pill },
          { id: 'inquiries', label: 'Public Inquiries', icon: MessageSquare },
          { id: 'activity', label: 'Audit Activity Log', icon: History },
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

      {/* TAB 1: Analytics */}
      {activeTab === 'analytics' && <ReportingDashboard />}

      {/* TAB 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Hospital Appointment Schedule</h2>
            <button onClick={loadAppointments} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <DataTable
            data={appointments}
            emptyMessage="No appointments found."
            columns={[
              { header: 'Appt #', key: 'id', render: (id) => <span className="font-mono text-xs font-bold">#{id}</span> },
              { header: 'Date', key: 'appointment_date', render: (d) => <span className="font-mono text-xs">{d}</span> },
              { header: 'Slot', key: 'time_slot', render: (s) => <span className="text-xs font-semibold">{s}</span> },
              {
                header: 'Patient',
                key: 'patient',
                render: (_, row) => (
                  <span className="text-xs font-semibold text-gray-800">
                    {row.patient?.full_name || `Patient #${row.patient_id}`}
                  </span>
                ),
              },
              {
                header: 'Doctor',
                key: 'doctor',
                render: (_, row) => (
                  <span className="text-xs text-primary-700">
                    {row.doctor?.full_name || `Doctor #${row.doctor_id}`}
                  </span>
                ),
              },
              { header: 'Reason', key: 'reason', render: (r) => <span className="text-xs text-gray-600">{r}</span> },
              { header: 'Status', key: 'status', render: (s) => <Badge status={s} /> },
            ]}
          />
        </div>
      )}

      {/* TAB 3: Emergency */}
      {activeTab === 'emergency' && <EmergencyQueue isClinical />}

      {/* TAB 4: Laboratory */}
      {activeTab === 'laboratory' && <LabOrderList />}

      {/* TAB 5: Pharmacy */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-8">
          <MedicineInventory isAdmin />
          <RefillList isAdmin />
        </div>
      )}

      {/* TAB 6: Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Contact Form Messages</h2>
            <button onClick={loadInquiries} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <DataTable
            data={inquiries}
            emptyMessage="No public inquiries logged."
            columns={[
              { header: 'Inquiry #', key: 'id', render: (id) => <span className="font-mono text-xs font-bold">#{id}</span> },
              { header: 'Sender Name', key: 'name', render: (n) => <span className="font-semibold text-xs text-gray-900">{n}</span> },
              { header: 'Email', key: 'email', render: (e) => <span className="text-xs text-gray-500">{e}</span> },
              { header: 'Subject', key: 'subject', render: (s) => <span className="text-xs font-medium text-gray-800">{s}</span> },
              { header: 'Message', key: 'message', render: (m) => <span className="text-xs text-gray-600 max-w-xs truncate block">{m}</span> },
              { header: 'Status', key: 'status', render: (s) => <Badge status={s} /> },
              {
                header: 'Actions',
                key: 'actions',
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    {row.status === 'NEW' && (
                      <button
                        onClick={() => handleUpdateInquiryStatus(row.id, 'IN_PROGRESS')}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        In Progress
                      </button>
                    )}
                    {row.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleUpdateInquiryStatus(row.id, 'CLOSED')}
                        className="btn-success text-xs py-1 px-2"
                      >
                        Close
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 7: Activity Audit Log */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">System Activity Audit Log</h2>
              <p className="text-xs text-gray-500">Chronological security and clinical event trace</p>
            </div>
            <button onClick={loadActivityLogs} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <DataTable
            data={activityLogs}
            emptyMessage="No activity logs recorded."
            columns={[
              { header: 'ID', key: 'id', render: (id) => <span className="font-mono text-xs text-gray-400">#{id}</span> },
              { header: 'Action', key: 'action', render: (a) => <span className="font-semibold text-xs text-primary-700 font-mono">{a}</span> },
              { header: 'User ID', key: 'user_id', render: (uid) => <span className="text-xs text-gray-600">User #{uid || 'Anon'}</span> },
              { header: 'Resource', key: 'resource_type', render: (rt, row) => <span className="text-xs text-gray-700">{rt} #{row.resource_id || ''}</span> },
              { header: 'IP Address', key: 'ip_address', render: (ip) => <span className="font-mono text-[11px] text-gray-500">{ip || '—'}</span> },
              { header: 'Timestamp', key: 'created_at', render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleString()}</span> },
            ]}
          />
        </div>
      )}
    </div>
  )
}
