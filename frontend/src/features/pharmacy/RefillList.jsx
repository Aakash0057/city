import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'

export default function RefillList({ isAdmin = false }) {
  const [refills, setRefills] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.pharmacy.allRefills()
      setRefills(data.items || data)
    } catch (err) {
      toast.error(err.message || 'Failed to load refill requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateStatus = async (refillId, status) => {
    try {
      await api.pharmacy.updateRefill(refillId, { status })
      toast.success(`Refill request #${refillId} marked as ${status}`)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update refill status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-600" />
            Prescription Refill Requests
          </h2>
          <p className="text-xs text-gray-500">
            Review patient renewal submissions and approve dispensations
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <DataTable
        data={refills}
        loading={loading}
        emptyMessage="No refill requests currently pending."
        columns={[
          {
            header: 'Refill #',
            key: 'id',
            render: (id) => <span className="font-mono text-xs font-semibold">#{id}</span>,
          },
          {
            header: 'Prescription #',
            key: 'prescription_id',
            render: (pid) => <span className="font-mono text-xs text-teal-700">Rx #{pid}</span>,
          },
          {
            header: 'Patient',
            key: 'patient',
            render: (_, row) => (
              <span className="font-semibold text-gray-900 text-xs">
                {row.prescription?.patient?.full_name || `Patient #${row.prescription?.patient_id || '—'}`}
              </span>
            ),
          },
          {
            header: 'Requested At',
            key: 'requested_at',
            render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleString()}</span>,
          },
          {
            header: 'Status',
            key: 'status',
            render: (s) => <Badge status={s} />,
          },
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) => {
              if (row.status !== 'PENDING') {
                return <span className="text-xs text-gray-400">Processed</span>
              }
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
                    className="btn-success text-xs py-1 px-2.5 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
                    className="btn-danger text-xs py-1 px-2.5 flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )
            },
          },
        ]}
      />
    </div>
  )
}
