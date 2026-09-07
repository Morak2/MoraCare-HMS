// ─────────────────────────────────────────────────────────────────
// MockData.js  — replace each section with real API calls
// TODO markers show exactly where to plug in your backend
// ─────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS = [
    { id: 'P-004821', name: 'Amara Okafor', age: 34, gender: 'Female', phone: '0801-234-5678', email: 'amara@email.com', department: 'Cardiology', status: 'Admitted', blood: 'O+', avatar: 'AO', color: '#3b82f6', admitDate: '2026-01-20', address: '12 Aba Road, PH' },
    { id: 'P-004820', name: 'James Nwosu', age: 45, gender: 'Male', phone: '0802-345-6789', email: 'james@email.com', department: 'Neurology', status: 'Outpatient', blood: 'A+', avatar: 'JN', color: '#8b5cf6', admitDate: '2026-01-18', address: '5 Rumuola, PH' },
    { id: 'P-004819', name: 'Fatima Hassan', age: 28, gender: 'Female', phone: '0803-456-7890', email: 'fatima@email.com', department: 'Pediatrics', status: 'Discharged', blood: 'B-', avatar: 'FH', color: '#10b981', admitDate: '2026-01-15', address: '8 Okporo Rd, PH' },
    { id: 'P-004818', name: 'Emeka Chukwu', age: 52, gender: 'Male', phone: '0804-567-8901', email: 'emeka@email.com', department: 'Orthopedics', status: 'Admitted', blood: 'AB+', avatar: 'EC', color: '#f59e0b', admitDate: '2026-01-22', address: '3 Stadium Rd, PH' },
    { id: 'P-004817', name: 'Ngozi Eze', age: 39, gender: 'Female', phone: '0805-678-9012', email: 'ngozi@email.com', department: 'Oncology', status: 'Outpatient', blood: 'O-', avatar: 'NE', color: '#ec4899', admitDate: '2026-01-19', address: '21 Trans-Amadi, PH' },
    { id: 'P-004816', name: 'Chidi Obi', age: 60, gender: 'Male', phone: '0806-789-0123', email: 'chidi@email.com', department: 'Cardiology', status: 'Admitted', blood: 'A-', avatar: 'CO', color: '#06b6d4', admitDate: '2026-01-21', address: '7 Birabi St, PH' },
    { id: 'P-004815', name: 'Aisha Bello', age: 25, gender: 'Female', phone: '0807-890-1234', email: 'aisha@email.com', department: 'Gynecology', status: 'Discharged', blood: 'B+', avatar: 'AB', color: '#7c3aed', admitDate: '2026-01-14', address: '15 Woji Rd, PH' },
    { id: 'P-004814', name: 'Tunde Adeyemi', age: 47, gender: 'Male', phone: '0808-901-2345', email: 'tunde@email.com', department: 'Urology', status: 'Outpatient', blood: 'O+', avatar: 'TA', color: '#059669', admitDate: '2026-01-17', address: '9 Ada George Rd, PH' },
];

export const MOCK_STAFF = [
    { id: 'STF-001', name: 'Dr. Kelechi Amadi', role: 'Doctor', department: 'Cardiology', phone: '0801-111-2222', email: 'k.amadi@hospital.com', status: 'Active', avatar: 'KA', color: '#3b82f6', specialty: 'Cardiologist', joinDate: '2023-03-15' },
    { id: 'STF-002', name: 'Dr. Blessing Ogar', role: 'Doctor', department: 'Neurology', phone: '0802-222-3333', email: 'b.ogar@hospital.com', status: 'Active', avatar: 'BO', color: '#8b5cf6', specialty: 'Neurologist', joinDate: '2022-07-01' },
    { id: 'STF-003', name: 'Nurse Ada Eze', role: 'Nurse', department: 'Pediatrics', phone: '0803-333-4444', email: 'a.eze@hospital.com', status: 'Active', avatar: 'AE', color: '#10b981', specialty: 'Pediatric Nurse', joinDate: '2024-01-10' },
    { id: 'STF-004', name: 'Dr. Uche Nkem', role: 'Doctor', department: 'Orthopedics', phone: '0804-444-5555', email: 'u.nkem@hospital.com', status: 'On Leave', avatar: 'UN', color: '#f59e0b', specialty: 'Orthopedic Surgeon', joinDate: '2021-11-20' },
    { id: 'STF-005', name: 'Pharm. Sola Babs', role: 'Pharmacist', department: 'Pharmacy', phone: '0805-555-6666', email: 's.babs@hospital.com', status: 'Active', avatar: 'SB', color: '#ec4899', specialty: 'Clinical Pharmacist', joinDate: '2023-08-05' },
    { id: 'STF-006', name: 'Lab. Tech. Remi Ola', role: 'Lab Technician', department: 'Laboratory', phone: '0806-666-7777', email: 'r.ola@hospital.com', status: 'Active', avatar: 'RO', color: '#06b6d4', specialty: 'Hematology', joinDate: '2024-03-01' },
];

export const MOCK_APPOINTMENTS = [
    { id: 'APT-001', patientId: 'P-004821', patientName: 'Amara Okafor', doctor: 'Dr. Kelechi Amadi', department: 'Cardiology', date: '2026-02-25', time: '09:00 AM', status: 'Confirmed', type: 'Follow-up', avatar: 'AO', color: '#3b82f6' },
    { id: 'APT-002', patientId: 'P-004820', patientName: 'James Nwosu', doctor: 'Dr. Blessing Ogar', department: 'Neurology', date: '2026-02-25', time: '10:30 AM', status: 'Pending', type: 'Consultation', avatar: 'JN', color: '#8b5cf6' },
    { id: 'APT-003', patientId: 'P-004818', patientName: 'Emeka Chukwu', doctor: 'Dr. Uche Nkem', department: 'Orthopedics', date: '2026-02-26', time: '02:00 PM', status: 'Confirmed', type: 'Surgery Prep', avatar: 'EC', color: '#f59e0b' },
    { id: 'APT-004', patientId: 'P-004817', patientName: 'Ngozi Eze', doctor: 'Dr. Kelechi Amadi', department: 'Oncology', date: '2026-02-26', time: '11:00 AM', status: 'Cancelled', type: 'Checkup', avatar: 'NE', color: '#ec4899' },
    { id: 'APT-005', patientId: 'P-004816', patientName: 'Chidi Obi', doctor: 'Dr. Blessing Ogar', department: 'Cardiology', date: '2026-02-27', time: '03:30 PM', status: 'Confirmed', type: 'Follow-up', avatar: 'CO', color: '#06b6d4' },
    { id: 'APT-006', patientId: 'P-004815', patientName: 'Aisha Bello', doctor: 'Dr. Uche Nkem', department: 'Gynecology', date: '2026-02-28', time: '08:30 AM', status: 'Pending', type: 'Consultation', avatar: 'AB', color: '#7c3aed' },
];

export const MOCK_PRESCRIPTIONS = [
    { id: 'RX-001', patientId: 'P-004821', patientName: 'Amara Okafor', doctor: 'Dr. Kelechi Amadi', drug: 'Lisinopril 10mg', dosage: '1 tablet daily', duration: '30 days', status: 'Active', date: '2026-01-20', avatar: 'AO', color: '#3b82f6' },
    { id: 'RX-002', patientId: 'P-004820', patientName: 'James Nwosu', doctor: 'Dr. Blessing Ogar', drug: 'Gabapentin 300mg', dosage: '1 capsule 3x daily', duration: '14 days', status: 'Active', date: '2026-01-18', avatar: 'JN', color: '#8b5cf6' },
    { id: 'RX-003', patientId: 'P-004818', patientName: 'Emeka Chukwu', doctor: 'Dr. Uche Nkem', drug: 'Ibuprofen 400mg', dosage: '1 tablet 3x daily', duration: '7 days', status: 'Dispensed', date: '2026-01-22', avatar: 'EC', color: '#f59e0b' },
    { id: 'RX-004', patientId: 'P-004817', patientName: 'Ngozi Eze', doctor: 'Dr. Kelechi Amadi', drug: 'Metformin 500mg', dosage: '1 tablet twice daily', duration: '60 days', status: 'Active', date: '2026-01-19', avatar: 'NE', color: '#ec4899' },
    { id: 'RX-005', patientId: 'P-004816', patientName: 'Chidi Obi', doctor: 'Dr. Blessing Ogar', drug: 'Atorvastatin 20mg', dosage: '1 tablet at night', duration: '90 days', status: 'Active', date: '2026-01-21', avatar: 'CO', color: '#06b6d4' },
];

export const MOCK_RECORDS = [
    { id: 'REC-001', patientId: 'P-004821', patientName: 'Amara Okafor', type: 'Lab Result', title: 'Full Blood Count', doctor: 'Dr. Kelechi Amadi', date: '2026-01-20', notes: 'Hemoglobin slightly low. Monitor.', avatar: 'AO', color: '#3b82f6' },
    { id: 'REC-002', patientId: 'P-004820', patientName: 'James Nwosu', type: 'Diagnosis', title: 'MRI Brain Scan', doctor: 'Dr. Blessing Ogar', date: '2026-01-18', notes: 'No abnormalities detected.', avatar: 'JN', color: '#8b5cf6' },
    { id: 'REC-003', patientId: 'P-004818', patientName: 'Emeka Chukwu', type: 'Surgery', title: 'Knee Replacement', doctor: 'Dr. Uche Nkem', date: '2026-01-22', notes: 'Surgery successful. Recovery normal.', avatar: 'EC', color: '#f59e0b' },
    { id: 'REC-004', patientId: 'P-004817', patientName: 'Ngozi Eze', type: 'Consultation', title: 'Oncology Review', doctor: 'Dr. Kelechi Amadi', date: '2026-01-19', notes: 'Chemotherapy response positive.', avatar: 'NE', color: '#ec4899' },
    { id: 'REC-005', patientId: 'P-004816', patientName: 'Chidi Obi', type: 'Lab Result', title: 'Cardiac Enzyme Test', doctor: 'Dr. Blessing Ogar', date: '2026-01-21', notes: 'Troponin levels within range.', avatar: 'CO', color: '#06b6d4' },
];

export const DEPARTMENTS = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Oncology',
    'Gynecology', 'Urology', 'Pharmacy', 'Laboratory', 'Emergency', 'General'
];

export const STAFF_ROLES = ['Doctor', 'Nurse', 'Pharmacist', 'Lab Technician', 'Receptionist', 'Administrator'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Checkup', 'Surgery Prep', 'Emergency', 'Lab Test'];
export const RECORD_TYPES = ['Lab Result', 'Diagnosis', 'Surgery', 'Consultation', 'Prescription', 'Imaging'];