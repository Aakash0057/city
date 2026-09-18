import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  FlaskConical,
  Pill,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  FileText,
  XCircle,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { PageLoader } from '../components/LoadingSpinner'

export default function PatientPortal() {
  const { user } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('appointments') // 'appointments' | 'labs' | 'pharmacy'
  const [appointments, setAppointments] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [cancelModal, setCancelModal] = useState({ open: false, apptId: null })
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appt: null, newDate: '', newSlot: '' })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [labDetailModal, setLabDetailModal] = useState({ open: false, order: null })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [apptsRes, labsRes, rxsRes] = await Promise.all([
        api.appointments.mine().catch(() => []),
        api.lab.myOrders().catch(() => []),
        api.pharmacy.myPrescriptions().catch(() => []),
      ])
      setAppointments(apptsRes.items || apptsRes)
      setLabOrders(labsRes.items || labsRes)
      setPrescriptions(rxsRes.items || rxsRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Cancel handler
  const handleCancelAppointment = async () => {
    if (!cancelModal.apptId) return
    try {
      await api.appointments.cancel(cancelModal.apptId)
      toast.success('Appointment cancelled.')
      setCancelModal({ open: false, apptId: null })
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment.')
    }
  }

  // Reschedule handler
  const handleOpenReschedule = async (appt) => {
    setRescheduleModal({
      open: true,
      appt,
      newDate: appt.appointment_date,
      newSlot: '',
    })
    fetchSlotsForReschedule(appt.doctor_id, appt.appointment_date)
  }

  const fetchSlotsForReschedule = async (doctorId, date) => {
    if (!doctorId || !date) return
    setLoadingSlots(true)
    try {
      const res = await api.appointments.slots(doctorId, date)
      setAvailableSlots(res.available_slots || res.slots || [])
    } catch {
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleConfirmReschedule = async (e) => {
    e.preventDefault()
    if (!rescheduleModal.newSlot) {
      toast.error('Please choose a time slot.')
      return
    }
    try {
      await api.appointments.reschedule(rescheduleModal.appt.id, {
        new_date: rescheduleModal.newDate,
        new_time_slot: rescheduleModal.newSlot,
      })
      toast.success('Appointment rescheduled.')
      setRescheduleModal({ open: false, appt: null, newDate: '', newSlot: '' })
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Could not reschedule.')
    }
  }

  // Refill request handler
  const handleRequestRefill = async (prescriptionId) => {
    try {
      await api.pharmacy.requestRefill(prescriptionId)
      toast.success('Refill request submitted to pharmacy team.')
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Failed to submit refill request.')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile */}
      <div className="card bg-gradient-to-r from-primary-900 to-teal-900 text-white p-6 border-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="badge-blue text-xs uppercase tracking-wider bg-white/20 text-white border-0">
            Patient Medical Portal
          </span>
          <h1 className="text-2xl font-bold">{user?.full_name || 'Patient'}</h1>
          <p className="text-xs text-primary-200">
            {user?.email} {user?.phone && `• ${user?.phone}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/appointments/book" className="btn-primary bg-teal-500 hover:bg-teal-600 text-xs">
            <Plus className="w-4 h-4" /> Book Appointment
          </Link>
          <button onClick={loadAll} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'appointments'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'labs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Laboratory Diagnostic Orders ({labOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('pharmacy')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'pharmacy'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescriptions & Refills ({prescriptions.length})
        </button>
      </div>

      {/* TAB 1: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <DataTable
            data={appointments}
            emptyMessage="You have no scheduled appointments. Click 'Book Appointment' to schedule one."
            columns={[
              {
                header: 'ID',
                key: 'id',
                render: (id) => <span className="font-mono text-xs text-gray-500">#{id}</span>,
              },
              {
                header: 'Date & Time',
                key: 'appointment_date',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-gray-900">{row.appointment_date}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {row.time_slot}
                    </p>
                  </div>
                ),
              },
              {
                header: 'Doctor',
                key: 'doctor_id',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-gray-900">
                      {row.doctor?.full_name || `Doctor #${row.doctor_id}`}
                    </p>
                    <p className="text-xs text-primary-600">{row.doctor?.specialty || 'General'}</p>
                  </div>
                ),
              },
              {
                header: 'Reason',
                key: 'reason',
                render: (r) => <span className="text-sm text-gray-600">{r || 'Consultation'}</span>,
              },
              {
                header: 'Status',
                key: 'status',
                render: (status) => <Badge status={status} />,
              },
              {
                header: 'Actions',
                key: 'actions',
                render: (_, row) => {
                  if (row.status !== 'SCHEDULED') return <span className="text-xs text-gray-400">—</span>
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReschedule(row)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancelModal({ open: true, apptId: row.id })}
                        className="btn-danger text-xs py-1 px-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                },
              },
            ]}
          />
        </div>
      )}

      {/* TAB 2: Labs */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <DataTable
            data={labOrders}
            emptyMessage="No laboratory diagnostic orders found for your profile."
            columns={[
              {
                header: 'Order #',
                key: 'id',
                render: (id) => <span className="font-mono text-xs font-semibold">#{id}</span>,
              },
              {
                header: 'Test Name',
                key: 'test',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-gray-900">{row.test?.name || `Test #${row.test_id}`}</p>
                    <p className="text-xs text-gray-500 font-mono">Code: {row.test?.code}</p>
                  </div>
                ),
              },
              {
                header: 'Ordered Date',
                key: 'ordered_at',
                render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleDateString()}</span>,
              },
              {
                header: 'Status',
                key: 'status',
                render: (status) => <Badge status={status} />,
              },
              {
                header: 'Result Flag',
                key: 'is_abnormal',
                render: (abnormal, row) => {
                  if (row.status !== 'RESULT_READY') return <span className="text-xs text-gray-400">Pending</span>
                  return abnormal ? (
                    <span className="badge-red text-xs">ABNORMAL</span>
                  ) : (
                    <span className="badge-green text-xs">NORMAL</span>
                  )
                },
              },
              {
                header: 'Details',
                key: 'view',
                render: (_, row) => (
                  <button
                    onClick={() => setLabDetailModal({ open: true, order: row })}
                    className="btn-secondary text-xs py-1 px-2.5"
                  >
                    View Report
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 3: Pharmacy */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-4">
          <DataTable
            data={prescriptions}
            emptyMessage="No prescription records found."
            columns={[
              {
                header: 'Rx #',
                key: 'id',
                render: (id) => <span className="font-mono text-xs font-semibold">#{id}</span>,
              },
              {
                header: 'Prescribing Doctor',
                key: 'doctor',
                render: (_, row) => (
                  <span className="font-medium text-gray-900">
                    {row.doctor?.full_name || `Doctor #${row.doctor_id}`}
                  </span>
                ),
              },
              {
                header: 'Date Issued',
                key: 'prescribed_at',
                render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleDateString()}</span>,
              },
              {
                header: 'Medications',
                key: 'items',
                render: (items) => (
                  <div className="text-xs space-y-1">
                    {items?.map((it, idx) => (
                      <div key={idx} className="text-gray-700">
                        <strong className="text-gray-900">{it.medicine?.name || `Med #${it.medicine_id}`}</strong>
                        <span className="text-gray-500"> ({it.dosage}, {it.frequency} - Qty: {it.quantity})</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                header: 'Status',
                key: 'status',
                render: (status) => <Badge status={status} />,
              },
              {
                header: 'Refills',
                key: 'refill',
                render: (_, row) => {
                  const hasPending = row.refill_requests?.some((r) => r.status === 'PENDING')
                  if (hasPending) {
                    return <span className="badge-yellow text-xs">Refill Pending</span>
                  }
                  return (
                    <button
                      onClick={() => handleRequestRefill(row.id)}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      Request Refill
                    </button>
                  )
                },
              },
            ]}
          />
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, apptId: null })}
        onConfirm={handleCancelAppointment}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? The doctor's time slot will be released for other patients."
        confirmText="Yes, Cancel Visit"
        danger
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, appt: null, newDate: '', newSlot: '' })}
        title="Reschedule Appointment"
      >
        <form onSubmit={handleConfirmReschedule} className="space-y-4">
          <div>
            <label className="label">New Appointment Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={rescheduleModal.newDate}
              onChange={(e) => {
                const d = e.target.value
                setRescheduleModal((prev) => ({ ...prev, newDate: d, newSlot: '' }))
                if (rescheduleModal.appt) {
                  fetchSlotsForReschedule(rescheduleModal.appt.doctor_id, d)
                }
              }}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Choose Time Slot</label>
            {loadingSlots ? (
              <p className="text-xs text-primary-600">Loading available slots...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-gray-500">No open slots on this date.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {availableSlots.map((s) => (
                  <button
                    type="button"
                    key={s.time_slot}
                    disabled={!s.is_available}
                    onClick={() => setRescheduleModal((prev) => ({ ...prev, newSlot: s.time_slot }))}
                    className={`p-2 rounded text-xs font-semibold border ${
                      rescheduleModal.newSlot === s.time_slot
                        ? 'bg-primary-600 text-white border-primary-600'
                        : s.is_available
                        ? 'bg-white text-gray-700 border-gray-200 hover:bg-primary-50'
                        : 'bg-gray-100 text-gray-300 border-gray-100 line-through cursor-not-allowed'
                    }`}
                  >
                    {s.time_slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setRescheduleModal({ open: false, appt: null, newDate: '', newSlot: '' })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rescheduleModal.newSlot}
              className="btn-primary text-xs"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Lab Order Detail Modal */}
      <Modal
        isOpen={labDetailModal.open}
        onClose={() => setLabDetailModal({ open: false, order: null })}
        title="Diagnostic Laboratory Report"
      >
        {labDetailModal.order && (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Test:</span>
                <span className="font-semibold text-gray-900">{labDetailModal.order.test?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge status={labDetailModal.order.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ordered:</span>
                <span className="text-gray-700">{new Date(labDetailModal.order.ordered_at).toLocaleString()}</span>
              </div>
              {labDetailModal.order.sample_collected_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sample Collected:</span>
                  <span className="text-gray-700">{new Date(labDetailModal.order.sample_collected_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {labDetailModal.order.status === 'RESULT_READY' ? (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900">Official Clinical Result</h4>
                  {labDetailModal.order.is_abnormal ? (
                    <span className="badge-red text-xs">FLAGGED ABNORMAL</span>
                  ) : (
                    <span className="badge-green text-xs">NORMAL RANGE</span>
                  )}
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-lg text-gray-800 whitespace-pre-wrap font-mono text-xs">
                  {labDetailModal.order.result_data || 'No result data recorded.'}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                This test is currently undergoing sample analysis in the hospital laboratory. Results will appear here once finalized by the clinical lab technician.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
