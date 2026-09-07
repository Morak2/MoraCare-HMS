import { useState, useEffect, useRef } from 'react';
import { UserPlus, PhoneCall, Undo2, Users, History, Loader, AlertCircle } from 'lucide-react';
import { patientsAPI, queueAPI } from '../../Services/api.js';
import { Queue } from '../../dataStructures/Queue';
import { Stack } from '../../dataStructures/Stack';

// Turn a backend queue row into the shape the UI/linked-list already uses
const toEntry = (row) => ({
    id: row.id, // real DB id — needed so undo/call-next can PATCH/DELETE the right row
    patientId: row.patient?.id ?? row.patientId,
    name: row.patient?.fullName || row.name || 'Unknown patient',
    reason: row.reason || row.department || 'General visit',
    checkedInAt: row.checkInAt || row.checkedInAt,
});

export default function PatientQueueSection({ isDark, t, hospital }) {
    const hospitalId = hospital?.id;

    const queueRef = useRef(new Queue());
    const historyRef = useRef(new Stack());

    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingQueue, setLoadingQueue] = useState(true);
    const [error, setError] = useState('');

    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [reason, setReason] = useState('');

    const [waitingList, setWaitingList] = useState([]);
    const [nowServing, setNowServing] = useState(null);
    const [history, setHistory] = useState([]);

    // Load the hospital's real patients for the check-in dropdown
    useEffect(() => {
        if (!hospitalId) return;
        setLoadingPatients(true);
        patientsAPI.list(hospitalId)
            .then((data) => setPatients(Array.isArray(data) ? data : data.patients || []))
            .catch(() => setError('Could not load patients.'))
            .finally(() => setLoadingPatients(false));
    }, [hospitalId]);

    // Rebuild the in-memory linked-list Queue from whatever is persisted in the
    // database, so the waiting line survives a refresh instead of resetting.
    useEffect(() => {
        if (!hospitalId) return;
        setLoadingQueue(true);
        queueAPI.list(hospitalId)
            .then((data) => {
                const rows = Array.isArray(data) ? data : data.queue || [];
                // backend already orders by priority desc, checkInAt asc — safe to enqueue in that order
                queueRef.current = new Queue();
                rows.filter(r => r.status === 'waiting').forEach(r => queueRef.current.enqueue(toEntry(r)));

                const calledRow = rows.find(r => r.status === 'called');
                setNowServing(calledRow ? toEntry(calledRow) : null);

                historyRef.current = new Stack(); // undo history is session-only, see note below
                sync();
            })
            .catch(() => setError('Could not load the queue.'))
            .finally(() => setLoadingQueue(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hospitalId]);

    const sync = () => {
        setWaitingList(queueRef.current.toArray());
        setHistory(historyRef.current.toArray());
    };

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!selectedPatientId) return;
        const patient = patients.find(p => String(p.id) === String(selectedPatientId));
        if (!patient) return;

        try {
            // Persist first — the DB id is what undo/call-next will need later
            const { entry: row } = await queueAPI.add(hospitalId, {
                patientId: patient.id,
                reason: reason || 'General visit',
            });
            const entry = toEntry(row);

            queueRef.current.enqueue(entry);
            historyRef.current.push({ action: 'checkin', entry });
            sync();
            setSelectedPatientId('');
            setReason('');
        } catch {
            setError('Could not check in that patient. Please try again.');
        }
    };

    const handleCallNext = async () => {
        const entry = queueRef.current.peek();
        if (!entry) return;
        try {
            await queueAPI.updateStatus(entry.id, 'called');
            queueRef.current.dequeue();
            setNowServing(entry);
            historyRef.current.push({ action: 'callnext', entry });
            sync();
        } catch {
            setError('Could not call the next patient. Please try again.');
        }
    };

    const handleUndo = async () => {
        const last = historyRef.current.pop();
        if (!last) return;

        try {
            if (last.action === 'checkin') {
                await queueAPI.remove(last.entry.id);
                queueRef.current.removeWhere(item => item.id === last.entry.id);
            } else if (last.action === 'callnext') {
                await queueAPI.updateStatus(last.entry.id, 'waiting');
                queueRef.current.enqueueFront(last.entry);
                if (nowServing?.id === last.entry.id) setNowServing(null);
            }
            sync();
        } catch {
            setError('Could not undo that action. Please try again.');
            historyRef.current.push(last); // put it back since the undo failed
        }
    };

    const card = {
        background: isDark ? t.softNavy : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
        borderRadius: 16,
        padding: 20,
    };

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#fff' : '#0A1A3F', margin: 0 }}>
                    Patient Queue
                </h2>
                <p style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>
                    Check-in line (Queue) with undo history (Stack) — {hospital?.name || 'this hospital'}'s real patients.
                    The waiting line is saved, so it's still here after a refresh; undo history is cleared on reload.
                </p>
            </div>

            {error && (
                <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center', color: '#b91c1c' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Check-in form */}
            <div style={card}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#fff' : '#0A1A3F', marginBottom: 12 }}>
                    Check In a Patient
                </h3>
                <form onSubmit={handleCheckIn} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        disabled={loadingPatients}
                        required
                        style={{ flex: '1 1 240px', minWidth: 200, padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
                    >
                        <option value="">{loadingPatients ? 'Loading patients…' : 'Select patient'}</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()}
                                {p.patientCode ? ` — ${p.patientCode}` : ''}
                            </option>
                        ))}
                    </select>
                    <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for visit (optional)"
                        style={{ flex: '2 1 240px', minWidth: 200, padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
                    />
                    <button type="submit" disabled={!selectedPatientId} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                        borderRadius: 10, border: 'none', background: '#FF5A1F', color: '#fff', fontWeight: 600,
                        cursor: selectedPatientId ? 'pointer' : 'not-allowed', opacity: selectedPatientId ? 1 : 0.6,
                        flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                        <UserPlus size={16} /> Check In
                    </button>
                </form>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Waiting list (Queue) */}
                <div style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#fff' : '#0A1A3F', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Users size={16} /> Waiting ({waitingList.length})
                        </h3>
                        <button onClick={handleCallNext} disabled={waitingList.length === 0} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                            borderRadius: 8, border: 'none', background: '#0A1A3F', color: '#fff', fontSize: 13,
                            cursor: waitingList.length ? 'pointer' : 'not-allowed', opacity: waitingList.length ? 1 : 0.5,
                        }}>
                            <PhoneCall size={14} /> Call Next
                        </button>
                    </div>
                    {nowServing && (
                        <div style={{ padding: 10, borderRadius: 8, background: isDark ? 'rgba(255,90,31,0.1)' : '#fff7ed', marginBottom: 10, fontSize: 13 }}>
                            Now serving: <strong>{nowServing.name}</strong>
                        </div>
                    )}
                    {loadingQueue ? (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}><Loader size={14} style={{ marginRight: 6 }} />Loading queue…</p>
                    ) : waitingList.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No one waiting.</p>
                    ) : (
                        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                            {waitingList.map((p, i) => (
                                <li key={p.id} style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#374151' }}>
                                    <strong>{p.name}</strong> — {p.reason}
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Undo history (Stack) */}
                <div style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#fff' : '#0A1A3F', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <History size={16} /> History ({history.length})
                        </h3>
                        <button onClick={handleUndo} disabled={history.length === 0} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                            borderRadius: 8, border: '1px solid #d1d5db', background: 'transparent',
                            color: isDark ? '#fff' : '#0A1A3F', fontSize: 13,
                            cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.5,
                        }}>
                            <Undo2 size={14} /> Undo
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No actions yet.</p>
                    ) : (
                        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                            {history.map((h, i) => (
                                <li key={i} style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#374151' }}>
                                    {h.action === 'checkin' ? 'Checked in' : 'Called next'}: <strong>{h.entry.name}</strong>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}