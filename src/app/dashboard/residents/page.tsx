'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, User, Phone, MapPin, Languages, Activity, Trash2, Edit2, PhoneCall, CheckCircle, Clock, Waves } from 'lucide-react';
import { getZipPriorityOrder, getNeighborhoodByZip } from '@/lib/neighborhoods';
import { ResidentIntakeDialog } from '@/components/resident-intake-dialog';

// ─── Sort helpers ─────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
    distress:    0,
    unresponsive: 1,
    pending:     2,
    safe:        3,
    unaffected:  3,
};

function sortResidents(list: Resident[]): Resident[] {
    return [...list].sort((a, b) => {
        const nA = getZipPriorityOrder(a.zip_code);
        const nB = getZipPriorityOrder(b.zip_code);
        if (nA !== nB) return nA - nB;
        const sA = STATUS_ORDER[a.status] ?? 4;
        const sB = STATUS_ORDER[b.status] ?? 4;
        if (sA !== sB) return sA - sB;
        return a.name.localeCompare(b.name);
    });
}

type Resident = {
    id: string;
    name: string;
    phone_number: string;
    age?: number;
    address?: string;
    zip_code?: string;
    health_conditions?: string;
    language?: string;
    status: 'safe' | 'distress' | 'unresponsive' | 'pending';
};

// ─── Status styles ─────────────────────────────────────────────────────────────

const statusStyle = (s: string) => {
    switch (s) {
        case 'safe':        return { bg: 'rgba(26,107,124,.1)',    color: '#1A6B7C',             border: 'rgba(26,107,124,.2)'    };
        case 'distress':    return { bg: 'rgba(196,98,45,.1)',     color: '#C4622D',             border: 'rgba(196,98,45,.2)'     };
        case 'unresponsive':return { bg: 'rgba(232,160,48,.1)',    color: '#E8A030',             border: 'rgba(232,160,48,.2)'    };
        default:            return { bg: 'rgba(61,79,88,.07)',     color: 'rgba(61,79,88,.55)',  border: 'rgba(61,79,88,.12)'     };
    }
};

// ─── Tier badge (inline, brand-aligned) ────────────────────────────────────────

const tierStyle = (t: number) =>
    t === 1 ? { color: '#C4622D', bg: 'rgba(196,98,45,.1)',   border: 'rgba(196,98,45,.2)'   } :
    t === 2 ? { color: '#E8A030', bg: 'rgba(232,160,48,.1)',  border: 'rgba(232,160,48,.2)'  } :
              { color: 'rgba(61,79,88,.5)', bg: 'rgba(61,79,88,.06)', border: 'rgba(61,79,88,.12)' };

// ─── Initials avatar ───────────────────────────────────────────────────────────

const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ─── Input / select shared style ──────────────────────────────────────────────

const INPUT: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--font-noto)', fontSize: '13px', color: '#3D4F58',
    padding: '7px 10px', borderRadius: '6px',
    border: '1px solid rgba(61,79,88,.15)', background: '#fff', outline: 'none',
};

const LABEL: React.CSSProperties = {
    fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.08em',
    textTransform: 'uppercase', color: '#1A6B7C', display: 'block', marginBottom: '4px',
};

export default function ResidentsPage() {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isIntakeOpen, setIsIntakeOpen] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', phone: '', age: '', address: '', zip_code: '', health_conditions: '', language: 'en'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    useEffect(() => { fetchResidents(); }, []);

    const fetchResidents = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('residents').select('*');
        if (data) setResidents(sortResidents(data as Resident[]));
        setIsLoading(false);
    };

    const handleEditClick = (resident: Resident) => {
        setEditingId(resident.id);
        setFormData({
            name: resident.name,
            phone: resident.phone_number,
            age: resident.age ? resident.age.toString() : '',
            address: resident.address || '',
            zip_code: resident.zip_code || '',
            health_conditions: resident.health_conditions || '',
            language: resident.language || 'en'
        });
        setIsOpen(true);
    };

    const handleCreateClick = () => {
        setEditingId(null);
        setFormData({ name: '', phone: '', age: '', address: '', zip_code: '', health_conditions: '', language: 'en' });
        setIsOpen(true);
    };

    const handleSaveResident = async () => {
        if (!formData.name || !formData.phone) return;
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            name: formData.name,
            phone_number: formData.phone,
            age: formData.age ? parseInt(formData.age) : null,
            address: formData.address,
            zip_code: formData.zip_code,
            health_conditions: formData.health_conditions,
            language: formData.language
        };

        let result;
        if (editingId) {
            result = await supabase.from('residents').update(payload).eq('id', editingId);
        } else {
            result = await supabase.from('residents').insert({
                ...payload,
                liaison_id: user?.id || '00000000-0000-0000-0000-000000000000',
                status: 'pending'
            });
        }

        if (!result.error) {
            setIsOpen(false);
            fetchResidents();
        } else {
            alert('Error saving resident: ' + result.error.message);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;
        const { error: logsError } = await supabase.from('call_logs').delete().eq('resident_id', id);
        if (logsError) console.error('Error deleting logs:', logsError);
        const { error } = await supabase.from('residents').delete().eq('id', id);
        if (!error) fetchResidents();
        else alert('Error deleting resident: ' + error.message);
    };

    const handleSingleCall = async (resident: Resident) => {
        if (!confirm(`Start emergency check-in for ${resident.name}?`)) return;
        try {
            const res = await fetch('/api/vapi/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetResidentId: resident.id })
            });
            const data = await res.json();
            if (res.ok) { alert('Call Initiated!'); fetchResidents(); }
            else alert('Call Failed: ' + (data.error || 'Unknown'));
        } catch (e: unknown) {
            alert('Network Error: ' + (e instanceof Error ? e.message : 'Unknown'));
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: Resident['status']) => {
        if (newStatus === 'distress') {
            const resident = residents.find(r => r.id === id);
            if (!confirm(`Mark ${resident?.name} as IN DISTRESS? This will send a Telegram alert.`)) return;
        }
        setUpdatingStatusId(id);
        const { error } = await supabase.from('residents').update({ status: newStatus }).eq('id', id);
        if (!error) {
            // Optimistically update local state so the badge changes immediately
            setResidents(prev => sortResidents(prev.map(r => r.id === id ? { ...r, status: newStatus } : r)));
            if (newStatus === 'distress') {
                const resident = residents.find(r => r.id === id);
                if (resident) {
                    try {
                        await fetch('/api/telegram/send-alert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ residentId: id, residentName: resident.name, source: 'manual' })
                        });
                    } catch (e) { console.error('Failed to send Telegram alert:', e); }
                }
            }
        } else {
            alert('Error updating status: ' + error.message);
        }
        setUpdatingStatusId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div className="db-ph">
                <div>
                    <h1 className="db-ph-title">Your Pod</h1>
                    <p className="db-ph-sub">
                        Sorted by <span style={{ color: '#1A6B7C', fontWeight: 600 }}>Ida neighborhood priority</span> then status urgency.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button className="db-ph-btn" style={{ background: 'rgba(61,79,88,.08)', color: '#3D4F58', border: '1px solid rgba(61,79,88,.12)' }} onClick={handleCreateClick}>
                        <Edit2 size={13} /> Quick Add
                    </button>
                    <button className="db-ph-btn" onClick={() => setIsIntakeOpen(true)}>
                        <Plus size={13} /> Full Intake
                    </button>
                </div>
            </div>

            <ResidentIntakeDialog open={isIntakeOpen} onOpenChange={setIsIntakeOpen} onSaved={fetchResidents} />

            {/* Edit / Create Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-white border-0 shadow-xl max-w-lg" style={{ borderRadius: '16px', padding: '0', overflow: 'hidden' }}>
                    <div style={{ background: '#1A6B7C', padding: '1.25rem 1.5rem' }}>
                        <DialogTitle style={{ fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {editingId ? 'Edit Profile' : 'Add Resident'}
                        </DialogTitle>
                        <DialogDescription style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(255,255,255,.65)', marginTop: '2px' }}>
                            {editingId ? 'Update details used for emergency response.' : 'Create a profile to help emergency responders.'}
                        </DialogDescription>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={LABEL}>Full Name *</label>
                                <input style={INPUT} placeholder="Maria Rodriguez" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL}>Phone Number *</label>
                                <input style={INPUT} placeholder="+19175550123" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={LABEL}>Age</label>
                                <input style={INPUT} type="number" placeholder="75" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL}>Preferred Language</label>
                                <select style={INPUT} value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })}>
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="zh">Chinese</option>
                                    <option value="ru">Russian</option>
                                    <option value="ht">Haitian Creole</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={LABEL}>Street Address</label>
                                <input style={INPUT} placeholder="123 Basement Apt" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL}>Zip Code</label>
                                <input style={INPUT} placeholder="11369" value={formData.zip_code} onChange={e => setFormData({ ...formData, zip_code: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label style={LABEL}>Vulnerabilities / Health Conditions</label>
                            <textarea
                                style={{ ...INPUT, height: '72px', resize: 'vertical' }}
                                placeholder="e.g. Wheelchair user, Insulin dependent, Oxygen tank..."
                                value={formData.health_conditions}
                                onChange={e => setFormData({ ...formData, health_conditions: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter style={{ padding: '.75rem 1.5rem 1.25rem', borderTop: '1px solid rgba(61,79,88,.07)' }}>
                        <button
                            onClick={handleSaveResident}
                            disabled={isSubmitting}
                            className="db-ph-btn"
                            style={{ width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Profile'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Residents Grid */}
            {isLoading ? (
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
                    Loading residents...
                </p>
            ) : residents.length === 0 ? (
                <div style={{ padding: '3rem', border: '1.5px dashed rgba(61,79,88,.15)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-noto)', fontSize: '13px', color: 'rgba(61,79,88,.4)' }}>
                        No residents found. Add someone to get started.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {residents.map((resident) => {
                        const st = statusStyle(resident.status);
                        const hood = getNeighborhoodByZip(resident.zip_code ?? '');
                        const tier = hood?.priority_tier ? tierStyle(hood.priority_tier) : null;

                        return (
                            <div key={resident.id} style={{
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
                                display: 'flex', flexDirection: 'column',
                                overflow: 'hidden',
                            }}>
                                {/* Card top */}
                                <div style={{ padding: '1.1rem 1.25rem .875rem', flex: 1 }}>
                                    {/* Row 1: avatar + name + status */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'rgba(26,107,124,.1)', color: '#1A6B7C',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700,
                                                flexShrink: 0,
                                            }}>
                                                {initials(resident.name)}
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '14px', fontWeight: 700, color: '#3D4F58', lineHeight: 1.2 }}>
                                                    {resident.name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                                                    {resident.age && (
                                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)' }}>
                                                            {resident.age} yrs
                                                        </span>
                                                    )}
                                                    {tier && hood && (
                                                        <span style={{
                                                            fontFamily: 'var(--font-plex-mono)', fontSize: '8px', letterSpacing: '.04em',
                                                            padding: '1px 6px', borderRadius: '8px',
                                                            background: tier.bg, color: tier.color,
                                                            border: `1px solid ${tier.border}`,
                                                        }}>
                                                            T{hood.priority_tier} · {hood.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <span style={{
                                            fontFamily: 'var(--font-plex-mono)', fontSize: '8px', letterSpacing: '.08em',
                                            textTransform: 'uppercase', padding: '3px 8px', borderRadius: '10px',
                                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                            flexShrink: 0,
                                        }}>
                                            {resident.status}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={11} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                                            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: 'rgba(61,79,88,.55)' }}>
                                                {resident.phone_number}
                                            </span>
                                        </div>
                                        {(resident.address || resident.zip_code) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={11} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                                                <span style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {resident.address}{resident.zip_code ? ` (${resident.zip_code})` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {resident.language && resident.language !== 'en' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Languages size={11} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                                                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '10px', color: 'rgba(61,79,88,.5)', textTransform: 'uppercase' }}>
                                                    {resident.language}
                                                </span>
                                            </div>
                                        )}
                                        {resident.health_conditions && (
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '2px', background: 'rgba(232,160,48,.08)', borderLeft: '2px solid #E8A030', borderRadius: '0 4px 4px 0', padding: '4px 6px' }}>
                                                <Activity size={10} style={{ color: '#E8A030', flexShrink: 0, marginTop: '1px' }} />
                                                <span style={{ fontFamily: 'var(--font-noto)', fontSize: '10px', color: '#3D4F58', lineHeight: 1.4 }}>
                                                    {resident.health_conditions}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action bar */}
                                <div style={{ borderTop: '1px solid rgba(61,79,88,.07)', padding: '.625rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(61,79,88,.02)' }}>
                                    <button
                                        onClick={() => handleSingleCall(resident)}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px', borderRadius: '6px', border: '1px solid rgba(26,107,124,.2)', background: 'rgba(26,107,124,.06)', color: '#1A6B7C', fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <PhoneCall size={11} /> Call
                                    </button>

                                    <div style={{ width: '1px', height: '20px', background: 'rgba(61,79,88,.1)', margin: '0 2px' }} />

                                    <button title="Mark Safe" onClick={() => handleUpdateStatus(resident.id, 'safe')}
                                        disabled={updatingStatusId === resident.id}
                                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(61,79,88,.35)', cursor: 'pointer', opacity: updatingStatusId === resident.id ? 0.4 : 1 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#1A6B7C', e.currentTarget.style.background = 'rgba(26,107,124,.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,79,88,.35)', e.currentTarget.style.background = 'transparent')}>
                                        <CheckCircle size={14} />
                                    </button>
                                    <button title="Mark Pending" onClick={() => handleUpdateStatus(resident.id, 'pending')}
                                        disabled={updatingStatusId === resident.id}
                                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(61,79,88,.35)', cursor: 'pointer', opacity: updatingStatusId === resident.id ? 0.4 : 1 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#3D4F58', e.currentTarget.style.background = 'rgba(61,79,88,.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,79,88,.35)', e.currentTarget.style.background = 'transparent')}>
                                        <Clock size={14} />
                                    </button>
                                    <button title="Mark Distress" onClick={() => handleUpdateStatus(resident.id, 'distress')}
                                        disabled={updatingStatusId === resident.id}
                                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(61,79,88,.35)', cursor: 'pointer', opacity: updatingStatusId === resident.id ? 0.4 : 1 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#C4622D', e.currentTarget.style.background = 'rgba(196,98,45,.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,79,88,.35)', e.currentTarget.style.background = 'transparent')}>
                                        <Waves size={14} />
                                    </button>

                                    <div style={{ width: '1px', height: '20px', background: 'rgba(61,79,88,.1)', margin: '0 2px' }} />

                                    <button title="Edit" onClick={() => handleEditClick(resident)}
                                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(61,79,88,.35)', cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#3D4F58', e.currentTarget.style.background = 'rgba(61,79,88,.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,79,88,.35)', e.currentTarget.style.background = 'transparent')}>
                                        <Edit2 size={13} />
                                    </button>
                                    <button title="Delete" onClick={() => handleDelete(resident.id, resident.name)}
                                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(61,79,88,.35)', cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#C4622D', e.currentTarget.style.background = 'rgba(196,98,45,.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,79,88,.35)', e.currentTarget.style.background = 'transparent')}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
