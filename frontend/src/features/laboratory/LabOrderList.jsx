import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, Plus, RefreshCw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

export default function LabOrderList({ isDoctor = false }) {
  const [orders, setOrders] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  // New order modal
  const [orderModal, setOrderModal] = useState(false)
  const [newOrder, setNewOrder] = useState({ patient_id: 6, test_id: '', notes: '' })
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Enter result modal
  const [resultModal, setResultModal] = useState({ open: false, order: null })
  const [resultData, setResultData] = useState('')
  const [isAbnormal, setIsAbnormal] = useState(false)
  const [submittingResult, setSubmittingResult] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [orderRes, testRes] = await Promise.all([
        api.lab.allOrders(),
        api.lab.tests(),
      ])
      setOrders(orderRes.items || orderRes)
      setTests(testRes.items || testRes)
      if (testRes.length > 0 && !newOrder.test_id) {
        setNewOrder((prev) => ({ ...prev, test_id: testRes[0].id }))
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load lab data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Collect sample
  const handleCollectSample = async (orderId) => {
    try {
      await api.lab.collectSample(orderId)
      toast.success(`Specimen sample collected for Order #${orderId}`)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to collect sample')
    }
  }

  // Create order
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setSubmittingOrder(true)
    try {
      await api.lab.order({
        patient_id: Number(newOrder.patient_id),
        test_id: Number(newOrder.test_id),
        notes: newOrder.notes || undefined,
      })
      toast.success('Laboratory diagnostic test ordered.')
      setOrderModal(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to place lab order.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Submit result
  const handleSubmitResult = async (e) => {
    e.preventDefault()
    if (!resultModal.order) return
    setSubmittingResult(true)
    try {
      await api.lab.enterResult(resultModal.order.id, {
        result_data: resultData,
        is_abnormal: isAbnormal,
      })
      toast.success(`Lab result recorded for Order #${resultModal.order.id}`)
      setResultModal({ open: false, order: null })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to record result.')
    } finally {
      setSubmittingResult(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Diagnostic Laboratory Orders
          </h2>
          <p className="text-xs text-gray-500">
            Track specimen collection, pathology analysis, and abnormal diagnostic markers
          </p>
        </div>
        <div className="flex gap-2">
          {isDoctor && (
            <button onClick={() => setOrderModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Order New Lab Test
            </button>
          )}
          <button onClick={loadData} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <DataTable
        data={orders}
        loading={loading}
        emptyMessage="No laboratory diagnostic orders registered."
        columns={[
          {
            header: 'Order #',
            key: 'id',
            render: (id) => <span className="font-mono text-xs font-bold text-teal-700">#{id}</span>,
          },
          {
            header: 'Test Code & Name',
            key: 'test',
            render: (_, row) => (
              <div>
                <p className="font-medium text-gray-900">{row.test?.name || `Test #${row.test_id}`}</p>
                <span className="text-[11px] font-mono text-gray-500">{row.test?.code}</span>
              </div>
            ),
          },
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
            header: 'Status',
            key: 'status',
            render: (s) => <Badge status={s} />,
          },
          {
            header: 'Result Flag',
            key: 'is_abnormal',
            render: (ab, row) => {
              if (row.status !== 'RESULT_READY') return <span className="text-xs text-gray-400">—</span>
              return ab ? (
                <span className="badge-red text-xs">ABNORMAL</span>
              ) : (
                <span className="badge-green text-xs">NORMAL</span>
              )
            },
          },
          {
            header: 'Ordered At',
            key: 'ordered_at',
            render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleString()}</span>,
          },
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) => (
              <div className="flex items-center gap-2">
                {row.status === 'ORDERED' && (
                  <button
                    onClick={() => handleCollectSample(row.id)}
                    className="btn-secondary text-xs py-1 px-2 text-teal-700 hover:bg-teal-50"
                  >
                    Collect Sample
                  </button>
                )}
                {row.status === 'SAMPLE_COLLECTED' && (
                  <button
                    onClick={() => {
                      setResultModal({ open: true, order: row })
                      setResultData('')
                      setIsAbnormal(false)
                    }}
                    className="btn-primary text-xs py-1 px-2"
                  >
                    Enter Result
                  </button>
                )}
                {row.status === 'RESULT_READY' && (
                  <button
                    onClick={() => {
                      setResultModal({ open: true, order: row })
                      setResultData(row.result_data || '')
                      setIsAbnormal(row.is_abnormal || false)
                    }}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    View / Edit
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* New Order Modal */}
      <Modal
        isOpen={orderModal}
        onClose={() => setOrderModal(false)}
        title="Order Diagnostic Laboratory Test"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-sm">
          <div>
            <label className="label">Patient User ID *</label>
            <input
              type="number"
              required
              value={newOrder.patient_id}
              onChange={(e) => setNewOrder({ ...newOrder, patient_id: e.target.value })}
              placeholder="e.g. 6 (John Doe)"
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">Default demo patients: ID 6 (John Doe) or ID 7 (Jane Smith)</p>
          </div>

          <div>
            <label className="label">Diagnostic Test *</label>
            <select
              value={newOrder.test_id}
              onChange={(e) => setNewOrder({ ...newOrder, test_id: e.target.value })}
              className="input"
              required
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name} (${t.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Clinical Indications / Notes</label>
            <textarea
              rows={2}
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
              placeholder="Clinical reason for ordering this test..."
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setOrderModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingOrder}
              className="btn-primary text-xs"
            >
              {submittingOrder ? 'Placing Order...' : 'Confirm Lab Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Result Entry Modal */}
      <Modal
        isOpen={resultModal.open}
        onClose={() => setResultModal({ open: false, order: null })}
        title={`Diagnostic Result — Order #${resultModal.order?.id}`}
      >
        <form onSubmit={handleSubmitResult} className="space-y-4 text-sm">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-900">
            <p><strong>Test:</strong> {resultModal.order?.test?.name} ({resultModal.order?.test?.code})</p>
            <p><strong>Patient:</strong> {resultModal.order?.patient?.full_name || `Patient #${resultModal.order?.patient_id}`}</p>
          </div>

          <div>
            <label className="label">Pathology / Quantitative Result *</label>
            <textarea
              rows={4}
              required
              value={resultData}
              onChange={(e) => setResultData(e.target.value)}
              placeholder="e.g. Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)&#10;WBC: 6.8 x10^3/uL&#10;Platelets: 245 x10^3/uL"
              className="input font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="isAbnormalCheck"
              checked={isAbnormal}
              onChange={(e) => setIsAbnormal(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <label htmlFor="isAbnormalCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
              Flag as Clinically Abnormal (Alerts attending physician)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setResultModal({ open: false, order: null })}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingResult}
              className="btn-primary text-xs"
            >
              {submittingResult ? 'Saving...' : 'Finalize & Post Result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
