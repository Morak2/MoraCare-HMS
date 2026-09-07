/**
 * PatientManagement.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hospital-admin patient management table.
 *
 * Features:
 *   • Lists all patients registered under the logged-in hospital
 *   • Search by name, patient number, or phone
 *   • Add / Edit patient via a modal form
 *   • Delete patient with a confirmation dialog
 *   • On add, saves temporary credentials to CredentialsHistory if the API
 *     returns a tempPassword (so the admin can view them later)
 *
 * All feedback (success / error) uses inline banners instead of browser
 * alert() / confirm() popups for a smoother UX.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
    Users, Search, Plus, Edit, Trash2, X, Save,
    UserPlus, Phone, Mail, MapPin, Calendar, Droplet, User,
    AlertCircle, CheckCircle,
} from 'lucide-react';
// ─── Shared Tailwind class string for all form inputs ─────────────────────────
const INPUT_CLS =
    "w-full py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 transition-all " +
    "focus:ring-orange-200 focus:border-orange-400 text-slate-800 placeholder-slate-400";

export default function PatientManagement() {

    // ── State ──────────────────────────────────────────────────────────────
    const [patients,         setPatients]         = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [searchQuery,      setSearchQuery]      = useState('');
    const [showModal,        setShowModal]        = useState(false);
    const [modalMode,        setModalMode]        = useState('add');      // 'add' | 'edit'
    const [selectedPatient,  setSelectedPatient]  = useState(null);       // patient being edited

    // Inline feedback banners (replace browser alert() calls)
    const [pageMessage,  setPageMessage]  = useState(null);  // { type: 'success'|'error', text: string }
    const [modalMessage, setModalMessage] = useState(null);  // feedback inside the modal form

    // Confirmation state for the delete action (replaces window.confirm())
    const [deleteConfirm, setDeleteConfirm] = useState(null);  // { id, name } | null

    // Patient form fields
    const [formData, setFormData] = useState({
        fullName: '', dateOfBirth: '', gender: '', phone: '', email: '',
        address: '', bloodGroup: '', medicalConditions: '',
        nextOfKinName: '', nextOfKinPhone: '',
    });


    // ── Load patients on mount ─────────────────────────────────────────────
    useEffect(() => { fetchPatients(); }, []);

    /**
     * Fetches all patients belonging to the logged-in hospital.
     * Silently fails – any error is surfaced via the pageMessage banner.
     */
    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const user  = JSON.parse(localStorage.getItem('user'));

            if (!user?.id) {
                setPageMessage({ type: 'error', text: 'Could not identify your hospital. Please refresh or log in again.' });
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patients/hospital/${user.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setPatients(data.patients);
            } else {
                setPageMessage({ type: 'error', text: 'Failed to load patients. Please refresh the page.' });
            }
        } catch {
            setPageMessage({ type: 'error', text: 'Network error while loading patients. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };


    // ── Modal openers ──────────────────────────────────────────────────────

    /** Open the modal in "add" mode with a blank form */
    const handleAddPatient = () => {
        setModalMode('add');
        setFormData({
            fullName: '', dateOfBirth: '', gender: '', phone: '', email: '',
            address: '', bloodGroup: '', medicalConditions: '',
            nextOfKinName: '', nextOfKinPhone: '',
        });
        setModalMessage(null);
        setShowModal(true);
    };

    /** Open the modal in "edit" mode pre-filled with the patient's current data */
    const handleEditPatient = (patient) => {
        setModalMode('edit');
        setSelectedPatient(patient);
        setFormData({
            fullName:          patient.full_name           || '',
            dateOfBirth:       patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
            gender:            patient.gender              || '',
            phone:             patient.phone               || '',
            email:             patient.email               || '',
            address:           patient.address             || '',
            bloodGroup:        patient.blood_group         || '',
            medicalConditions: patient.medical_conditions  || '',
            nextOfKinName:     patient.next_of_kin_name    || '',
            nextOfKinPhone:    patient.next_of_kin_phone   || '',
        });
        setModalMessage(null);
        setShowModal(true);
    };


    // ── Delete flow ────────────────────────────────────────────────────────

    /**
     * Shows the inline delete confirmation banner instead of window.confirm().
     * The actual deletion happens in confirmDelete().
     */
    const handleDeletePatient = (patientId, patientName) => {
        setDeleteConfirm({ id: patientId, name: patientName ?? 'this patient' });
    };

    /** Executes the deletion after the user confirms via the inline banner */
    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const token    = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patients/${deleteConfirm.id}`,
                { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                setPageMessage({ type: 'success', text: `${deleteConfirm.name} has been removed from the system.` });
                fetchPatients();  // refresh list
            } else {
                const data = await response.json();
                setPageMessage({ type: 'error', text: data.error || 'Could not delete the patient. Please try again.' });
            }
        } catch {
            setPageMessage({ type: 'error', text: 'Network error while deleting the patient. Please check your connection.' });
        } finally {
            setDeleteConfirm(null);  // dismiss the confirmation banner
        }
    };


    // ── Form submission (add / edit) ───────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalMessage(null);

        try {
            const token = localStorage.getItem('token');
            const user  = JSON.parse(localStorage.getItem('user'));

            const url    = modalMode === 'add'
                ? `${import.meta.env.VITE_API_URL}/api/patients/hospital/${user.id}`
                : `${import.meta.env.VITE_API_URL}/api/patients/${selectedPatient.id}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // If the API returned a temporary password, save it to credentials history
                // so the admin can view / share it with the patient later
                if (modalMode === 'add' && data.tempPassword) {
                    saveCredential({
                        type:          'patient',
                        fullName:      data.patient?.full_name   || formData.fullName,
                        email:         data.patient?.email       || formData.email  || null,
                        phone:         data.patient?.phone       || formData.phone  || null,
                        patientNumber: data.patient?.patient_number || null,
                        tempPassword:  data.tempPassword,
                    });
                }

                setShowModal(false);
                fetchPatients();  // refresh the table

                setPageMessage({
                    type: 'success',
                    text: modalMode === 'add'
                        ? `${formData.fullName} has been registered successfully. Login credentials have been saved.`
                        : `${formData.fullName}'s details have been updated.`,
                });
            } else {
                const errData = await response.json();
                setModalMessage({ type: 'error', text: errData.error || 'Could not save changes. Please check your details and try again.' });
            }
        } catch {
            setModalMessage({ type: 'error', text: 'Network error while saving. Please check your connection and try again.' });
        }
    };

    /** Generic change handler for all form inputs */
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });


    // ── Filtered patients list ─────────────────────────────────────────────
    const filteredPatients = patients.filter(p =>
        (p.full_name      ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.patient_number ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone          ?? '').includes(searchQuery)
    );

    /** Returns the first character of a name as an uppercase initial */
    const getInitial = (name) => (name ?? '?').charAt(0).toUpperCase();

    // ── Shared label style for modal form fields ──────────────────────────
    const LBL = "block text-sm font-semibold mb-2";


    // ── Loading state ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 rounded-full mx-auto mb-4 animate-spin"
                        style={{ borderColor: '#FF5A1F', borderTopColor: 'transparent' }} />
                    <p className="text-slate-600">Loading patients…</p>
                </div>
            </div>
        );
    }


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="p-6 min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
            <div className="max-w-7xl mx-auto">

                {/* ── Page-level feedback banner ── */}
                {pageMessage && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                        background: pageMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${pageMessage.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                        {pageMessage.type === 'success'
                            ? <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                            : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                        }
                        <span style={{ fontSize: 14, color: pageMessage.type === 'success' ? '#065f46' : '#991b1b', flex: 1 }}>
                            {pageMessage.text}
                        </span>
                        <button
                            onClick={() => setPageMessage(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0, display: 'flex' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* ── Inline delete confirmation banner ── */}
                {deleteConfirm && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 18px', borderRadius: 12, marginBottom: 20,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        flexWrap: 'wrap',
                    }}>
                        <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: '#7f1d1d', flex: 1, minWidth: 200 }}>
                            Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                                onClick={confirmDelete}
                                style={{ padding: '7px 18px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Yes, Remove
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', color: '#4b5563', border: '1px solid rgba(10,26,63,0.15)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}


                {/* ── Page header ── */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0A1A3F' }}>Patient Management</h1>
                        <p className="text-slate-500">Manage all registered patients</p>
                    </div>
                    <button
                        onClick={handleAddPatient}
                        className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all active:scale-95"
                        style={{ backgroundColor: '#FF5A1F', boxShadow: '0 4px 16px rgba(255,90,31,0.3)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e64d15'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF5A1F'}
                    >
                        <Plus className="w-5 h-5" /> Add New Patient
                    </button>
                </div>


                {/* ── Stats cards ── */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {/* Total patients */}
                    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,90,31,0.1)' }}>
                                <Users className="w-6 h-6" style={{ color: '#FF5A1F' }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: '#0A1A3F' }}>{patients.length}</p>
                                <p className="text-sm text-slate-500">Total Patients</p>
                            </div>
                        </div>
                    </div>

                    {/* Registered today */}
                    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: '#0A1A3F' }}>
                                    {patients.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
                                </p>
                                <p className="text-sm text-slate-500">Registered Today</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ── Search bar ── */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, patient number, or phone…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={`${INPUT_CLS} pl-11 pr-4`}
                        />
                    </div>
                </div>


                {/* ── Patient table ── */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {filteredPatients.length === 0 ? (
                        /* Empty state */
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: '#0A1A3F' }}>
                                {patients.length === 0 ? 'No patients registered yet' : 'No patients found'}
                            </h3>
                            <p className="text-slate-500 mb-6">
                                {patients.length === 0
                                    ? 'Start by registering your first patient'
                                    : 'Try adjusting your search query'
                                }
                            </p>
                            {patients.length === 0 && (
                                <button
                                    onClick={handleAddPatient}
                                    className="px-6 py-3 text-white rounded-lg font-bold transition-all active:scale-95"
                                    style={{ backgroundColor: '#FF5A1F' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e64d15'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF5A1F'}
                                >
                                    Register First Patient
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ backgroundColor: '#F5F7FA', borderBottom: '1px solid rgba(10,26,63,0.08)' }}>
                                    <tr>
                                        {['Patient #', 'Name', 'Gender', 'Blood Group', 'Phone', 'Registered', 'Actions'].map(h => (
                                            <th key={h}
                                                className={`px-6 py-4 text-sm font-semibold ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                                                style={{ color: '#0A1A3F' }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPatients.map(patient => (
                                        <tr
                                            key={patient.id}
                                            className="transition-colors"
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,90,31,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {/* Patient number */}
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold" style={{ color: '#FF5A1F' }}>
                                                    {patient.patient_number}
                                                </span>
                                            </td>

                                            {/* Name + email */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                                                        style={{ backgroundColor: '#0A1A3F' }}>
                                                        {getInitial(patient.full_name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: '#0A1A3F' }}>{patient.full_name ?? 'Unknown'}</p>
                                                        <p className="text-sm text-slate-500">{patient.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 capitalize text-slate-600">{patient.gender}</td>

                                            {/* Blood group badge */}
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-sm font-semibold border border-red-100">
                                                    {patient.blood_group || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">{patient.phone}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </td>

                                            {/* Action buttons */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditPatient(patient)}
                                                        className="p-2 rounded-lg transition-colors"
                                                        style={{ color: '#FF5A1F' }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,90,31,0.08)'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        title="Edit patient"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePatient(patient.id, patient.full_name ?? 'this patient')}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove patient"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


            {/* ══════════════ ADD / EDIT PATIENT MODAL ══════════════ */}
            {showModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        style={{ border: '1px solid rgba(10,26,63,0.08)' }}>

                        {/* Modal header */}
                        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: '1px solid rgba(10,26,63,0.08)' }}>
                            <h2 className="text-2xl font-bold" style={{ color: '#0A1A3F' }}>
                                {modalMode === 'add' ? 'Register New Patient' : 'Edit Patient'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg transition-colors text-slate-500"
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(10,26,63,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Inline modal error/success banner */}
                            {modalMessage && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '12px 14px', borderRadius: 10,
                                    background: modalMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    border: `1px solid ${modalMessage.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                }}>
                                    {modalMessage.type === 'success'
                                        ? <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                                        : <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                                    }
                                    <span style={{ fontSize: 13, color: modalMessage.type === 'success' ? '#065f46' : '#991b1b' }}>
                                        {modalMessage.text}
                                    </span>
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className={LBL} style={{ color: '#0A1A3F' }}>Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input type="text" name="fullName" value={formData.fullName}
                                        onChange={handleChange} required placeholder="John Doe"
                                        className={`${INPUT_CLS} pl-11 pr-4`} />
                                </div>
                            </div>

                            {/* Date of Birth + Gender */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Date of Birth *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth}
                                            onChange={handleChange} required
                                            className={`${INPUT_CLS} pl-11 pr-4`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Gender *</label>
                                    <select name="gender" value={formData.gender}
                                        onChange={handleChange} required
                                        className={`${INPUT_CLS} px-4`}>
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Phone + Blood Group */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input type="tel" name="phone" value={formData.phone}
                                            onChange={handleChange} required placeholder="+1234567890"
                                            className={`${INPUT_CLS} pl-11 pr-4`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Blood Group</label>
                                    <div className="relative">
                                        <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select name="bloodGroup" value={formData.bloodGroup}
                                            onChange={handleChange}
                                            className={`${INPUT_CLS} pl-11 pr-4`}>
                                            <option value="">Select blood group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className={LBL} style={{ color: '#0A1A3F' }}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input type="email" name="email" value={formData.email}
                                        onChange={handleChange} placeholder="patient@email.com"
                                        className={`${INPUT_CLS} pl-11 pr-4`} />
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className={LBL} style={{ color: '#0A1A3F' }}>Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <textarea name="address" value={formData.address}
                                        onChange={handleChange} required rows="2"
                                        placeholder="123 Main Street, City, State, ZIP"
                                        className={`${INPUT_CLS} pl-11 pr-4`} />
                                </div>
                            </div>

                            {/* Medical conditions */}
                            <div>
                                <label className={LBL} style={{ color: '#0A1A3F' }}>Medical Conditions</label>
                                <textarea name="medicalConditions" value={formData.medicalConditions}
                                    onChange={handleChange} rows="2"
                                    placeholder="Any known medical conditions, allergies, etc."
                                    className={`${INPUT_CLS} px-4`} />
                            </div>

                            {/* Next of kin */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Next of Kin Name</label>
                                    <input type="text" name="nextOfKinName" value={formData.nextOfKinName}
                                        onChange={handleChange} placeholder="Jane Doe"
                                        className={`${INPUT_CLS} px-4`} />
                                </div>
                                <div>
                                    <label className={LBL} style={{ color: '#0A1A3F' }}>Next of Kin Phone</label>
                                    <input type="tel" name="nextOfKinPhone" value={formData.nextOfKinPhone}
                                        onChange={handleChange} placeholder="+1234567890"
                                        className={`${INPUT_CLS} px-4`} />
                                </div>
                            </div>

                            {/* Form action buttons */}
                            <div className="flex gap-3 pt-4">
                                <button type="submit"
                                    className="flex-1 py-3 text-white rounded-lg font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#FF5A1F', boxShadow: '0 4px 16px rgba(255,90,31,0.3)' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e64d15'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF5A1F'}
                                >
                                    <Save className="w-5 h-5" />
                                    {modalMode === 'add' ? 'Register Patient' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-6 py-3 rounded-lg font-bold transition-colors text-slate-600"
                                    style={{ border: '1px solid rgba(10,26,63,0.15)' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(10,26,63,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}