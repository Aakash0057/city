export default function Badge({ status }) {
  const map = {
    // Appointment
    SCHEDULED:    'badge-blue',
    COMPLETED:    'badge-green',
    CANCELLED:    'badge-gray',
    NO_SHOW:      'badge-red',
    // Emergency
    WAITING:      'badge-yellow',
    IN_TREATMENT: 'badge-purple',
    RESOLVED:     'badge-green',
    DISCHARGED:   'badge-gray',
    // Lab
    ORDERED:      'badge-blue',
    SAMPLE_COLLECTED: 'badge-purple',
    RESULT_READY: 'badge-green',
    // Prescription
    ACTIVE:       'badge-green',
    DISPENSED:    'badge-blue',
    EXPIRED:      'badge-gray',
    // Refill
    PENDING:      'badge-yellow',
    APPROVED:     'badge-green',
    REJECTED:     'badge-red',
    // Contact
    NEW:          'badge-yellow',
    IN_PROGRESS:  'badge-purple',
    CLOSED:       'badge-gray',
    // Severity
    CRITICAL:     'badge-red',
    HIGH:         'badge-yellow',
    MEDIUM:       'badge-blue',
    LOW:          'badge-green',
    // Role
    ADMIN:        'badge-purple',
    DOCTOR:       'badge-blue',
    PATIENT:      'badge-green',
  }
  const cls = map[status] || 'badge-gray'
  return <span className={cls}>{status?.replace(/_/g, ' ')}</span>
}
