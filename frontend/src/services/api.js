const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(method, path, body = null, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config = {
    method,
    headers,
    ...opts,
  }
  if (body !== null) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)

  if (res.status === 204) return null

  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const msg =
      data?.detail ||
      (Array.isArray(data) ? data.map((e) => e.msg).join(', ') : null) ||
      `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email, password) =>
      request('POST', '/auth/login', { email, password }),
    register: (payload) => request('POST', '/auth/register', payload),
    me: () => request('GET', '/auth/me'),
    logout: () => request('POST', '/auth/logout'),
    forgotPassword: (email) =>
      request('POST', '/auth/forgot-password', { email }),
    resetPassword: (token, new_password) =>
      request('POST', '/auth/reset-password', { token, new_password }),
  },

  // ── Doctors ──────────────────────────────────────────────────────────
  doctors: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/doctors${qs ? '?' + qs : ''}`)
    },
    get: (id) => request('GET', `/doctors/${id}`),
    specialties: () => request('GET', '/doctors/specialties'),
  },

  // ── Services ─────────────────────────────────────────────────────────
  services: {
    list: () => request('GET', '/services'),
    get: (code) => request('GET', `/services/${code}`),
  },

  // ── Appointments ─────────────────────────────────────────────────────
  appointments: {
    slots: (doctorId, date) =>
      request('GET', `/appointments/slots/${doctorId}?date=${date}`),
    book: (payload) => request('POST', '/appointments', payload),
    mine: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/appointments/my${qs ? '?' + qs : ''}`)
    },
    all: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/appointments${qs ? '?' + qs : ''}`)
    },
    cancel: (id) => request('DELETE', `/appointments/${id}`),
    reschedule: (id, payload) =>
      request('PUT', `/appointments/${id}/reschedule`, payload),
    updateStatus: (id, payload) =>
      request('PUT', `/appointments/${id}/status`, payload),
  },

  // ── Contact ──────────────────────────────────────────────────────────
  contact: {
    submit: (payload) => request('POST', '/contact', payload),
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/contact${qs ? '?' + qs : ''}`)
    },
    updateStatus: (id, payload) =>
      request('PUT', `/contact/${id}/status`, payload),
  },

  // ── Emergency ────────────────────────────────────────────────────────
  emergency: {
    submit: (payload) => request('POST', '/emergency', payload),
    queue: () => request('GET', '/emergency/queue'),
    triage: (id, payload) => request('PUT', `/emergency/${id}/triage`, payload),
  },

  // ── Laboratory ───────────────────────────────────────────────────────
  lab: {
    tests: () => request('GET', '/laboratory/tests'),
    myOrders: () => request('GET', '/laboratory/orders/my'),
    allOrders: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/laboratory/orders${qs ? '?' + qs : ''}`)
    },
    order: (payload) => request('POST', '/laboratory/orders', payload),
    collectSample: (id) =>
      request('PUT', `/laboratory/orders/${id}/collect-sample`),
    enterResult: (id, payload) =>
      request('PUT', `/laboratory/orders/${id}/result`, payload),
  },

  // ── Pharmacy ─────────────────────────────────────────────────────────
  pharmacy: {
    medicines: () => request('GET', '/pharmacy/medicines'),
    lowStock: () => request('GET', '/pharmacy/medicines/low-stock'),
    createMedicine: (payload) =>
      request('POST', '/pharmacy/medicines', payload),
    adjustStock: (id, payload) =>
      request('PUT', `/pharmacy/medicines/${id}/stock`, payload),
    myPrescriptions: () => request('GET', '/pharmacy/prescriptions/my'),
    allPrescriptions: () => request('GET', '/pharmacy/prescriptions'),
    prescribe: (payload) => request('POST', '/pharmacy/prescriptions', payload),
    requestRefill: (id) =>
      request('POST', `/pharmacy/prescriptions/${id}/refill`),
    allRefills: () => request('GET', '/pharmacy/refills'),
    updateRefill: (id, payload) =>
      request('PUT', `/pharmacy/refills/${id}`, payload),
  },

  // ── Reporting ────────────────────────────────────────────────────────
  reporting: {
    summary: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/reporting${qs ? '?' + qs : ''}`)
    },
    exportCsv: (type) =>
      fetch(`${BASE_URL}/reporting/export-csv?type=${type}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
  },

  // ── Doctor Dashboard ─────────────────────────────────────────────────
  dashboard: {
    get: () => request('GET', '/doctor/dashboard'),
  },

  // ── Activity Log ────────────────────────────────────────────────────
  activity: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request('GET', `/activity${qs ? '?' + qs : ''}`)
    },
  },
}
