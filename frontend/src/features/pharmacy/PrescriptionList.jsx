import { useState, useEffect, useCallback } from 'react'
import { Pill, Plus, RefreshCw, FileText, Trash2 } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

export default function PrescriptionList({ isDoctor = false }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  // New Rx Modal
  const [newRxModal, setNewRxModal] = useState(false)
  const [patientId, setPatientId] = useState(6)
  const [diagnosis, setDiagnosis] = useState('')
  const [instructions, setInstructions] = useState('')
  const [items, setItems] = useState([
    { medicine_id: '', dosage: '500mg', frequency: 'Twice daily', duration_days: 7, quantity: 14 },
  ])
  const [submittingRx, setSubmittingRx] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rxRes, medRes] = await Promise.all([
        api.pharmacy.allPrescriptions(),
        api.pharmacy.medicines(),
      ])
      setPrescriptions(rxRes.items || rxRes)
      const meds = medRes.items || medRes
      setMedicines(meds)
      if (meds.length > 0 && !items[0].medicine_id) {
        setItems([
          { medicine_id: meds[0].id, dosage: '500mg', frequency: 'Twice daily', duration_days: 7, quantity: 14 },
        ])
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { medicine_id: medicines[0]?.id || '', dosage: '1 tablet', frequency: 'Daily', duration_days: 7, quantity: 7 },
    ])
  }

  const removeItemRow = (idx) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItemRow = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  const handleCreatePrescription = async (e) => {
    e.preventDefault()
    setSubmittingRx(true)
    try {
      await api.pharmacy.prescribe({
        patient_id: Number(patientId),
        diagnosis: diagnosis || 'Clinical consultation diagnosis',
        instructions: instructions || 'Take with water as directed',
        items: items.map((it) => ({
          medicine_id: Number(it.medicine_id),
          dosage: it.dosage,
          frequency: it.frequency,
          duration_days: Number(it.duration_days),
          quantity: Number(it.quantity),
        })),
      })
      toast.success('Prescription issued and stock automatically deducted!')
      setNewRxModal(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to issue prescription')
    } finally {
      setSubmittingRx(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Clinical Prescriptions
          </h2>
          <p className="text-xs text-gray-500">
            Digital prescription records, multi-drug regimens, and pharmacy dispensary status
          </p>
        </div>
        <div className="flex gap-2">
          {isDoctor && (
            <button onClick={() => setNewRxModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Write Prescription
            </button>
          )}
          <button onClick={loadData} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <DataTable
        data={prescriptions}
        loading={loading}
        emptyMessage="No clinical prescriptions recorded."
        columns={[
          {
            header: 'Rx #',
            key: 'id',
            render: (id) => <span className="font-mono text-xs font-bold text-teal-700">#{id}</span>,
          },
          {
            header: 'Patient',
            key: 'patient',
            render: (_, row) => (
              <span className="font-semibold text-gray-900 text-xs">
                {row.patient?.full_name || `Patient #${row.patient_id}`}
              </span>
            ),
          },
          {
            header: 'Doctor',
            key: 'doctor',
            render: (_, row) => (
              <span className="text-xs text-gray-700">
                {row.doctor?.full_name || `Doctor #${row.doctor_id}`}
              </span>
            ),
          },
          {
            header: 'Diagnosis',
            key: 'diagnosis',
            render: (d) => <span className="text-xs text-gray-600">{d}</span>,
          },
          {
            header: 'Medication Items',
            key: 'items',
            render: (items) => (
              <div className="text-xs space-y-1 max-w-xs">
                {items?.map((it, idx) => (
                  <div key={idx} className="bg-gray-50 p-1 rounded border border-gray-100">
                    <strong>{it.medicine?.name || `Med #${it.medicine_id}`}</strong>: {it.dosage} ({it.frequency}, {it.duration_days}d)
                  </div>
                ))}
              </div>
            ),
          },
          {
            header: 'Status',
            key: 'status',
            render: (s) => <Badge status={s} />,
          },
          {
            header: 'Prescribed On',
            key: 'prescribed_at',
            render: (dt) => <span className="text-xs text-gray-500">{new Date(dt).toLocaleDateString()}</span>,
          },
        ]}
      />

      {/* New Prescription Modal */}
      <Modal
        isOpen={newRxModal}
        onClose={() => setNewRxModal(false)}
        title="Write Digital Prescription"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePrescription} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Patient User ID *</label>
              <input
                type="number"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="6"
                className="input"
              />
              <p className="text-[11px] text-gray-400 mt-1">Default demo patients: ID 6 (John Doe) or 7 (Jane Smith)</p>
            </div>
            <div>
              <label className="label">Clinical Diagnosis *</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute bacterial pharyngitis"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">General Patient Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take after meals; avoid alcohol while on this course."
              className="input"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0 font-bold">Prescribed Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="btn-secondary text-xs py-1 px-2 flex items-center gap-1 text-teal-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Medication
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-gray-500 block">Medication</label>
                  <select
                    value={it.medicine_id}
                    onChange={(e) => updateItemRow(idx, 'medicine_id', e.target.value)}
                    className="input text-xs py-1"
                    required
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.stock_quantity} left)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-500 block">Dosage</label>
                  <input
                    type="text"
                    required
                    value={it.dosage}
                    onChange={(e) => updateItemRow(idx, 'dosage', e.target.value)}
                    placeholder="500mg"
                    className="input text-xs py-1"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-gray-500 block">Frequency</label>
                  <input
                    type="text"
                    required
                    value={it.frequency}
                    onChange={(e) => updateItemRow(idx, 'frequency', e.target.value)}
                    placeholder="Twice daily"
                    className="input text-xs py-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-500 block">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={it.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                    className="input text-xs py-1 font-mono"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pt-3">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setNewRxModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRx}
              className="btn-primary text-xs"
            >
              {submittingRx ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
