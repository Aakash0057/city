import { LoadingSpinner } from './LoadingSpinner'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick = null,
}) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center p-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-sm text-gray-500">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="table-wrapper bg-white shadow-sm">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={col.headerClassName || ''}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-sm text-gray-500 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-primary-50/50 transition-colors' : ''}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} className={col.className || ''}>
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
