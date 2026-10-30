const API_BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('trustx_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('trustx_token', token);
  } else {
    localStorage.removeItem('trustx_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  // If not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail 
      ? (typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail) 
      : `HTTP Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (payload) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => apiRequest('/auth/me'),
  getUsers: (role) => apiRequest(`/auth/users${role ? `?role=${role}` : ''}`),
  switchDemoUser: (email) => apiRequest('/auth/switch-demo-user', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  // TrustPass
  getMyPassport: () => apiRequest('/trustpass/my-passport'),
  getUserPassport: (userId) => apiRequest(`/trustpass/profile/${userId}`),
  submitCredential: (payload) => apiRequest('/trustpass/credentials', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getPendingCredentials: () => apiRequest('/trustpass/credentials/pending'),
  approveCredential: (id, notes) => apiRequest(`/trustpass/credentials/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ status: 'APPROVED', notes })
  }),
  rejectCredential: (id, notes) => apiRequest(`/trustpass/credentials/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REJECTED', notes })
  }),
  verifyEligibility: (equipmentId) => apiRequest(`/trustpass/verify-eligibility/${equipmentId}`),

  // Equipment (Campus Resource Radar)
  getEquipment: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.qualification_required !== undefined) query.append('qualification_required', params.qualification_required);
    const qs = query.toString();
    return apiRequest(`/equipment${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => apiRequest('/equipment/categories'),
  getDepartments: () => apiRequest('/equipment/departments'),
  getEquipmentDetail: (id) => apiRequest(`/equipment/${id}`),
  getEquipmentAlternatives: (id) => apiRequest(`/equipment/${id}/alternatives`),
  getEquipmentSlots: (id, date) => apiRequest(`/equipment/${id}/slots${date ? `?date=${date}` : ''}`),
  createEquipment: (payload) => apiRequest('/equipment', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateEquipment: (id, payload) => apiRequest(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Bookings (FairShare AI)
  createBooking: (payload) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getBookings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.equipment_id) query.append('equipment_id', params.equipment_id);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return apiRequest(`/bookings${qs ? `?${qs}` : ''}`);
  },
  checkInBooking: (id, notes = '') => apiRequest(`/bookings/${id}/check-in`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  }),
  cancelBooking: (id, reason = '') => apiRequest(`/bookings/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, {
    method: 'POST'
  }),
  triggerGhostRecovery: () => apiRequest('/bookings/auto-release-ghosts', {
    method: 'POST'
  }),
  joinWaitlist: (equipmentId, payload) => apiRequest(`/bookings/${equipmentId}/waitlist`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getWaitlist: (equipmentId) => apiRequest(`/bookings/${equipmentId}/waitlist`),

  // ProofHandover
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/handover/upload-photo', {
      method: 'POST',
      body: formData
    });
  },
  submitInspection: (payload) => apiRequest('/handover/inspect', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getBookingInspections: (bookingId) => apiRequest(`/handover/booking/${bookingId}`),
  reportDispute: (payload) => apiRequest('/handover/dispute', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDisputes: (status) => apiRequest(`/handover/disputes${status ? `?status=${status}` : ''}`),
  resolveDispute: (id, payload) => apiRequest(`/handover/disputes/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // TrustLedger
  getAuditEvents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    if (params.event_type) query.append('event_type', params.event_type);
    if (params.order) query.append('order', params.order);
    const qs = query.toString();
    return apiRequest(`/ledger/events${qs ? `?${qs}` : ''}`);
  },
  verifyChain: () => apiRequest('/ledger/verify'),
  simulateTamper: (sequenceNumber) => apiRequest(`/ledger/simulate-tamper?sequence_number=${sequenceNumber}`, {
    method: 'POST'
  }),
  repairChain: () => apiRequest('/ledger/repair', {
    method: 'POST'
  }),

  // Smart Intelligence
  getAnalytics: () => apiRequest('/analytics/dashboard'),
};
