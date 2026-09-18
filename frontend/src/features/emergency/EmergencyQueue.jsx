import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, RefreshCw, CheckCircle, ShieldAlert, ArrowUpDown } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

export default function EmergencyQueue({ isClinical = false }) {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [triageModal, setTriageModal] = useState({ open: false, item: null })
  const [triageStatus, setTriageStatus] = useState('IN_TREATMENT')
  const [triageSeverity, setTriageSeverity] = useState('')
  const [triageNotes, setTriageNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.emergency.queue()
      setQueue(data.items || data)
    } catch (err) {
      toast.error(err.message || 'Failed to load emergency queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
    const timer = setInterval(loadQueue, 30000) // auto-refresh every 30s
    return () => clearInterval(timer)
  }, [loadQueue])

  const handleOpenTriage = (item) => {
    setTriageModal({ open: true, item })
    setTriageStatus(item.status === 'WAITING' ? 'IN_TREATMENT' : 'RESOLVED')
    setTriageSeverity(item.severity)
    setTriageNotes(item.notes || '')
  }

  const handleSaveTriage = async (e) => {
    e.preventDefault()
    if (!triageModal.item) return
    setSubmitting(true)
    try {
      await api.emergency.triage(triageModal.item.id, {
        status: triageStatus,
        severity: triageSeverity || undefined,
        notes: triageNotes || undefined,
      })
      toast.success(`Emergency ticket #${triageModal.item.id} triaged to ${triageStatus}`)
      setTriageModal({ open: false, item: null })
      loadQueue()
    } catch (err) {
      toast.error(err.message || 'Triage update failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Live Emergency Department Queue
          </h2>
          <p className="text-xs text-gray-500">
            Sorted automatically by clinical urgency (CRITICAL &gt; HIGH &gt; MEDIUM &gt; LOW)
          </p>
        </div>
        <button onClick={loadQueue} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      <DataTable
        data={queue}
        loading={loading}
        emptyMessage="No emergency cases currently in queue. Emergency department queue is clear."
        columns={[
          {
            header: 'Ticket #',
            key: 'id',
            render: (id) => <span className="font-mono text-xs font-bold text-red-700">#{id}</span>,
          },
          {
            header: 'Severity',
            key: 'severity',
            render: (sev) => <Badge status={sev} />,
          },
          {
            header: 'Patient Name',
            key: 'patient_name',
            render: (name) => <span className="font-semibold text-gray-900">{name}</span>,
          },
          {
            header: 'Chief Complaint',
            key: 'chief_complaint',
            render: (cc) => <span className="text-xs text-gray-700 max-w-xs truncate block">{cc}</span>,
          },
          {
            header: 'Contact',
            key: 'contact_phone',
            render: (p) => <span className="text-xs text-gray-500">{p}</span>,
          },
          {
            header: 'Status',
            key: 'status',
            render: (s) => <Badge status={s} />,
          },
          {
            header: 'Arrival Time',
            key: 'created_at',
            render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleTimeString()}</span>,
          },
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) => {
              if (!isClinical) return null
              if (row.status === 'RESOLVED' || row.status === 'DISCHARGED') {
                return <span className="text-xs text-gray-400">Complete</span>
              }
              return (
                <button
                  onClick={() => handleOpenTriage(row)}
                  className="btn-primary text-xs py-1 px-2.5 bg-red-600 hover:bg-red-700"
                >
                  Triage / Update
                </button>
              )
            },
          },
        ]}
      />

      {/* Triage Update Modal */}
      <Modal
        isOpen={triageModal.open}
        onClose={() => setTriageModal({ open: false, item: null })}
        title={`Triage Emergency Ticket #${triageModal.item?.id}`}
      >
        <form onSubmit={handleSaveTriage} className="space-y-4 text-sm">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-900">
            <p><strong>Patient:</strong> {triageModal.item?.patient_name}</p>
            <p><strong>Complaint:</strong> {triageModal.item?.chief_complaint}</p>
          </div>

          <div>
            <label className="label">Update Acuity Severity</label>
            <select
              value={triageSeverity}
              onChange={(e) => setTriageSeverity(e.target.value)}
              className="input"
            >
              <option value="CRITICAL">CRITICAL (Immediate Resuscitation)</option>
              <option value="HIGH">HIGH (Emergent - Within 15 min)</option>
              <option value="MEDIUM">MEDIUM (Urgent - Within 60 min)</option>
              <option value="LOW">LOW (Less Urgent)</option>
            </select>
          </div>

          <div>
            <label className="label">Status Transition *</label>
            <select
              value={triageStatus}
              onChange={(e) => setTriageStatus(e.target.value)}
              className="input"
              required
            >
              <option value="WAITING">WAITING (In Waiting Area)</option>
              <option value="IN_TREATMENT">IN_TREATMENT (Attending Physician Active)</option>
              <option value="RESOLVED">RESOLVED (Treated & Stabilized)</option>
              <option value="DISCHARGED">DISCHARGED (Discharged from ED)</option>
            </select>
          </div>

          <div>
            <label className="label">Clinical Triage Notes</label>
            <textarea
              rows={3}
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              placeholder="Vitals: BP, HR, O2 sat, physician observations..."
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setTriageModal({ open: false, item: null })}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Saving...' : 'Confirm Triage Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
