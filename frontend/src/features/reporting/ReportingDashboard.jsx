import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  FlaskConical,
  Pill,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import Badge from '../../components/Badge'
import { PageLoader } from '../../components/LoadingSpinner'

export default function ReportingDashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const toast = useToast()

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.reporting.summary()
      setReport(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load report analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const handleDownloadCsv = async (type) => {
    setExporting(type)
    try {
      const res = await api.reporting.exportCsv(type)
      if (!res.ok) throw new Error(`Export failed with status ${res.status}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citycare_${type}_report.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`${type.toUpperCase()} CSV exported successfully!`)
    } catch (err) {
      toast.error(err.message || 'Could not export CSV')
    } finally {
      setExporting(null)
    }
  }

  if (loading) return <PageLoader />
  if (!report) return null

  const totalAppts = report.appointments?.daily?.reduce((sum, d) => sum + d.count, 0) || 0
  const totalEmergency = report.emergency?.by_severity?.reduce((sum, s) => sum + s.count, 0) || 0
  const avgTurnaround = report.laboratory?.avg_turnaround_hours != null
    ? `${report.laboratory.avg_turnaround_hours.toFixed(1)} hrs`
    : 'N/A'
  const lowStockCount = report.pharmacy?.low_stock_medicines?.length || 0

  return (
    <div className="space-y-8">
      {/* Header and CSV Downloads */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Hospital Cross-Module Analytics & SCM Reporting
          </h2>
          <p className="text-xs text-gray-500">
            Real-time telemetry aggregated across Appointments, Emergency, Lab, and Pharmacy CIs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('appointments')}
            disabled={exporting === 'appointments'}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Appts CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('emergency')}
            disabled={exporting === 'emergency'}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> ED CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('laboratory')}
            disabled={exporting === 'laboratory'}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Lab CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('pharmacy')}
            disabled={exporting === 'pharmacy'}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Pharmacy CSV
          </button>
          <button onClick={loadReport} className="btn-secondary text-xs p-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Consultations"
          value={totalAppts}
          subtitle="Scheduled & completed visits"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Emergency Cases"
          value={totalEmergency}
          subtitle="Triage intakes registered"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Lab Turnaround"
          value={avgTurnaround}
          subtitle="From sample to final result"
          icon={FlaskConical}
          color="teal"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          subtitle="Items below reorder point"
          icon={Pill}
          color={lowStockCount > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Analytics Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Appointments */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            Appointments Breakdown by Date
          </h3>
          <DataTable
            data={report.appointments?.daily || []}
            emptyMessage="No appointment history found."
            columns={[
              { header: 'Date', key: 'date', render: (d) => <span className="font-mono text-xs">{d}</span> },
              {
                header: 'Scheduled Visits',
                key: 'count',
                render: (cnt) => (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${Math.min(cnt * 20, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-xs">{cnt}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Emergency Breakdown */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Emergency Triage by Acuity Severity
          </h3>
          <DataTable
            data={report.emergency?.by_severity || []}
            emptyMessage="No emergency cases."
            columns={[
              { header: 'Severity Level', key: 'severity', render: (s) => <Badge status={s} /> },
              {
                header: 'Case Count',
                key: 'count',
                render: (cnt) => (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min(cnt * 25, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-xs">{cnt}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Top Prescriptions */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Most Frequently Prescribed Medications
          </h3>
          <DataTable
            data={report.pharmacy?.top_medicines || []}
            emptyMessage="No prescription items."
            columns={[
              { header: 'Medication', key: 'medicine_name', render: (n) => <span className="font-semibold text-xs text-gray-900">{n}</span> },
              { header: 'Dispensation Units', key: 'total_quantity', render: (q) => <span className="font-mono text-xs font-bold text-teal-700">{q}</span> },
            ]}
          />
        </div>

        {/* Low Stock Pharmacy Alerts */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Pill className="w-4 h-4 text-amber-600" />
            Pharmaceutical Low-Stock Alerts
          </h3>
          <DataTable
            data={report.pharmacy?.low_stock_medicines || []}
            emptyMessage="All medications are currently above reorder thresholds."
            columns={[
              { header: 'Medicine', key: 'name', render: (n) => <span className="font-semibold text-xs text-gray-900">{n}</span> },
              { header: 'Current Stock', key: 'stock_quantity', render: (s) => <span className="font-mono text-xs text-red-600 font-bold">{s} units</span> },
              { header: 'Reorder Level', key: 'reorder_level', render: (r) => <span className="font-mono text-xs text-gray-500">{r} units</span> },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
