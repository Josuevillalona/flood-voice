'use client';

import { useState } from 'react';
import { CallLogFeed } from '@/components/call-log-feed';
import { PriorityQueue } from '@/components/analytics';
import { PhoneCall, Waves } from 'lucide-react';

export default function CallsPage() {
    const [isCalling, setIsCalling] = useState(false);

    const handleTrigger = async () => {
        setIsCalling(true);
        try {
            const res = await fetch('/api/vapi/trigger', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                const failures = data.results?.filter((r: { success: boolean }) => !r.success) || [];
                if (failures.length > 0) {
                    alert(`Failed to call ${failures.length} resident(s). Error: ${failures[0].error}`);
                } else {
                    alert(`Emergency Check-in initiated for ${data.results?.length || 0} residents.`);
                }
            } else {
                alert(`Failed to trigger calls: ${data.error || 'Unknown error'}`);
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            console.error(e);
            alert(`Network error: ${message}`);
        }
        setIsCalling(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="db-ph">
                <div>
                    <h1 className="db-ph-title">Live Call Feed</h1>
                    <p className="db-ph-sub">Real-time monitoring of all check-in calls and AI analysis.</p>
                </div>
                <button
                    onClick={handleTrigger}
                    disabled={isCalling}
                    className="db-ph-btn"
                    style={{
                        background: '#C4622D',
                        opacity: isCalling ? 0.6 : 1,
                        cursor: isCalling ? 'not-allowed' : 'pointer',
                    }}
                >
                    <Waves size={14} />
                    {isCalling ? 'Initiating...' : 'Trigger Emergency Check-in'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                <div style={{ position: 'sticky', top: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4622D', animation: 'pulse-teal 2s infinite' }} />
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(61,79,88,.45)' }}>
                            Priority Queue
                        </span>
                    </div>
                    <PriorityQueue limit={15} />
                </div>

                <div className="db-card">
                    <div className="db-card-head">
                        <div className="db-card-title">
                            <div className="db-card-title-dot" />
                            <PhoneCall size={13} style={{ color: '#1A6B7C' }} />
                            Incoming Transcripts & Analysis
                        </div>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <CallLogFeed limit={50} />
                    </div>
                </div>
            </div>
        </div>
    );
}
