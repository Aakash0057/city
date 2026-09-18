import { useState, useEffect, useCallback } from 'react'
import { Pill, AlertTriangle, Plus, RefreshCw, Search, Edit3 } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

export default function MedicineInventory({ isAdmin = false }) {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useToast()

  // Stock Adjust Modal
  const [adjustModal, setAdjustModal] = useState({ open: false, med: null, delta: 0, reason: '' })
  const [submittingAdjust, setSubmittingAdjust] = useState(false)

  // Add Med Modal
  const [addModal, setAddModal] = useState(false)
  const [newMed, setNewMed] = useState({
    name: '',
    generic_name: '',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 100,
    reorder_level: 20,
    unit_price: 10.0,
    requires_prescription: true,
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = showLowStockOnly
        ? await api.pharmacy.lowStock()
        : await api.pharmacy.medicines()
      setMedicines(data.items || data)
    } catch (err) {
      toast.error(err.message || 'Failed to load medicine inventory')
    } finally {
      setLoading(false)
    }
  }, [showLowStockOnly])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (!adjustModal.med) return
    setSubmittingAdjust(true)
    try {
      await api.pharmacy.adjustStock(adjustModal.med.id, {
        quantity_delta: Number(adjustModal.delta),
        reason: adjustModal.reason || 'Manual inventory adjustment',
      })
      toast.success(`Inventory updated for ${adjustModal.med.name}`)
      setAdjustModal({ open: false, med: null, delta: 0, reason: '' })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock')
    } finally {
      setSubmittingAdjust(false)
    }
  }

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    setSubmittingAdd(true)
    try {
      await api.pharmacy.createMedicine({
        ...newMed,
        stock_quantity: Number(newMed.stock_quantity),
        reorder_level: Number(newMed.reorder_level),
        unit_price: Number(newMed.unit_price),
      })
      toast.success(`Medicine ${newMed.name} registered in pharmacy`)
      setAddModal(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to register medicine')
    } finally {
      setSubmittingAdd(false)
    }
  }

  const filteredMedicines = medicines.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) || (m.generic_name && m.generic_name.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            Pharmaceutical Inventory
          </h2>
          <p className="text-xs text-gray-500">
            Stock control, reorder threshold alerts, and formulary management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`btn-secondary text-xs ${
              showLowStockOnly ? 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-400' : ''
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {showLowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </button>
          {isAdmin && (
            <button onClick={() => setAddModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add New Medicine
            </button>
          )}
          <button onClick={loadData} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter formulary by brand or generic name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-xs"
        />
      </div>

      <DataTable
        data={filteredMedicines}
        loading={loading}
        emptyMessage="No medicines found in this view."
        columns={[
          {
            header: 'Medicine Name',
            key: 'name',
            render: (_, row) => (
              <div>
                <p className="font-semibold text-gray-900">{row.name}</p>
                <p className="text-xs text-gray-500">{row.generic_name || 'Generic'}</p>
              </div>
            ),
          },
          {
            header: 'Form & Strength',
            key: 'dosage_form',
            render: (_, row) => (
              <span className="text-xs text-gray-700">
                {row.dosage_form} ({row.strength})
              </span>
            ),
          },
          {
            header: 'Current Stock',
            key: 'stock_quantity',
            render: (qty, row) => {
              const isLow = qty <= row.reorder_level
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                    {qty}
                  </span>
                  {isLow && (
                    <span className="badge-red text-[10px] py-0 px-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> REORDER
                    </span>
                  )}
                </div>
              )
            },
          },
          {
            header: 'Reorder Level',
            key: 'reorder_level',
            render: (rl) => <span className="font-mono text-xs text-gray-500">{rl}</span>,
          },
          {
            header: 'Unit Price',
            key: 'unit_price',
            render: (p) => <span className="text-xs font-medium text-gray-800">${Number(p).toFixed(2)}</span>,
          },
          {
            header: 'Rx Required',
            key: 'requires_prescription',
            render: (req) =>
              req ? <span className="badge-purple text-xs">Rx Only</span> : <span className="badge-gray text-xs">OTC</span>,
          },
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) => (
              <button
                onClick={() => setAdjustModal({ open: true, med: row, delta: 0, reason: '' })}
                className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Adjust Stock
              </button>
            ),
          },
        ]}
      />

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, med: null, delta: 0, reason: '' })}
        title={`Adjust Stock — ${adjustModal.med?.name}`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
            <p><strong>Current Units in Stock:</strong> {adjustModal.med?.stock_quantity}</p>
            <p><strong>Reorder Threshold:</strong> {adjustModal.med?.reorder_level}</p>
          </div>

          <div>
            <label className="label">Quantity Adjustment Delta (+ to add, - to deduct) *</label>
            <input
              type="number"
              required
              value={adjustModal.delta}
              onChange={(e) => setAdjustModal({ ...adjustModal, delta: e.target.value })}
              className="input font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Example: enter <code>50</code> to add 50 units, or <code>-10</code> to deduct 10 units.
            </p>
          </div>

          <div>
            <label className="label">Reason for Stock Adjustment</label>
            <input
              type="text"
              value={adjustModal.reason}
              onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
              placeholder="e.g. Supplier delivery invoice #9928, damaged packaging discard"
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAdjustModal({ open: false, med: null, delta: 0, reason: '' })}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdjust}
              className="btn-primary text-xs"
            >
              {submittingAdjust ? 'Updating...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Medicine Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Register New Medication in Formulary"
      >
        <form onSubmit={handleAddMedicine} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Brand / Trade Name *</label>
              <input
                type="text"
                required
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="e.g. Lipitor"
                className="input"
              />
            </div>
            <div>
              <label className="label">Generic Name</label>
              <input
                type="text"
                value={newMed.generic_name}
                onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                placeholder="e.g. Atorvastatin"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosage Form *</label>
              <input
                type="text"
                required
                value={newMed.dosage_form}
                onChange={(e) => setNewMed({ ...newMed, dosage_form: e.target.value })}
                placeholder="Tablet, Syrup, Injection..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Strength *</label>
              <input
                type="text"
                required
                value={newMed.strength}
                onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                placeholder="20mg, 500mg, 10ml..."
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Initial Stock *</label>
              <input
                type="number"
                required
                value={newMed.stock_quantity}
                onChange={(e) => setNewMed({ ...newMed, stock_quantity: e.target.value })}
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Reorder Level *</label>
              <input
                type="number"
                required
                value={newMed.reorder_level}
                onChange={(e) => setNewMed({ ...newMed, reorder_level: e.target.value })}
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newMed.unit_price}
                onChange={(e) => setNewMed({ ...newMed, unit_price: e.target.value })}
                className="input font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="reqRxCheck"
              checked={newMed.requires_prescription}
              onChange={(e) => setNewMed({ ...newMed, requires_prescription: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="reqRxCheck" className="text-xs text-gray-700 cursor-pointer">
              Requires Physician Prescription (Rx)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="btn-primary text-xs"
            >
              {submittingAdd ? 'Saving...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
