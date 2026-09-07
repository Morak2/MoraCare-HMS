// src/services/api.js
// Central API service — all backend calls go through here

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

const headers = (extra = {}) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...extra,
});

const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
    hospitalLogin: (body) => fetch(`${BASE_URL}/api/auth/hospital/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
    hospitalRegister: (body) => fetch(`${BASE_URL}/api/auth/hospital/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
    staffLogin: (body) => fetch(`${BASE_URL}/api/auth/staff/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
    patientLogin: (body) => fetch(`${BASE_URL}/api/auth/patient/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
    changePassword: (body) => fetch(`${BASE_URL}/api/auth/change-password`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    me: () => fetch(`${BASE_URL}/api/auth/me`, { headers: headers() }).then(handle),
};

// ─── PATIENTS ────────────────────────────────────────────────────────────────
export const patientsAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/patients/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    create: (body) => fetch(`${BASE_URL}/api/patients`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    delete: (id) => fetch(`${BASE_URL}/api/patients/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── QUEUE ───────────────────────────────────────────────────────────────────
export const queueAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/queue/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    add: (hospitalId, body) => fetch(`${BASE_URL}/api/queue/${hospitalId}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    updateStatus: (id, status) => fetch(`${BASE_URL}/api/queue/${id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
    remove: (id) => fetch(`${BASE_URL}/api/queue/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── STAFF ───────────────────────────────────────────────────────────────────
export const staffAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/staff/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    create: (body) => fetch(`${BASE_URL}/api/staff`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    updateStatus: (id, status) => fetch(`${BASE_URL}/api/staff/${id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
    delete: (id) => fetch(`${BASE_URL}/api/staff/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────
export const appointmentsAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/appointments/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    create: (body) => fetch(`${BASE_URL}/api/appointments`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    updateStatus: (id, status) => fetch(`${BASE_URL}/api/appointments/${id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
    delete: (id) => fetch(`${BASE_URL}/api/appointments/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── PRESCRIPTIONS ───────────────────────────────────────────────────────────
export const prescriptionsAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/prescriptions/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    create: (body) => fetch(`${BASE_URL}/api/prescriptions`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    updateStatus: (id, status) => fetch(`${BASE_URL}/api/prescriptions/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
    delete: (id) => fetch(`${BASE_URL}/api/prescriptions/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── RECORDS ─────────────────────────────────────────────────────────────────
export const recordsAPI = {
    list: (hospitalId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/api/medical-records/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
    },
    create: (body) => fetch(`${BASE_URL}/api/medical-records`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    delete: (id) => fetch(`${BASE_URL}/api/medical-records/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// ─── HOSPITALS ───────────────────────────────────────────────────────────────
export const hospitalsAPI = {
    stats: () => fetch(`${BASE_URL}/api/hospitals/stats`, { headers: headers() }).then(handle),
    updateProfile: (body) => fetch(`${BASE_URL}/api/hospitals/profile`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handle),
    search: (q) => fetch(`${BASE_URL}/api/hospitals/search?q=${encodeURIComponent(q)}`).then(handle),
};