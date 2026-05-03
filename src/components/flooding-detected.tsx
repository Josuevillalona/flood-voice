'use client';

import { useFlooding } from '@/contexts/flooding-context';

export function FloodingDetected({ className }: { className?: string }) {
    const { floodingCount, activeSensors, isLoading, isComplete, checked, totalToCheck } = useFlooding();

    const hasFlooding = floodingCount > 0;
    const progress = totalToCheck > 0 ? (checked / totalToCheck) * 100 : 0;

    const accentColor = (hasFlooding || !isComplete) ? '#E8A030' : '#1A6B7C';
    const subColor = isComplete && !hasFlooding ? 'rgba(26,107,124,.7)' : 'rgba(61,79,88,.45)';

    return (
        <div
            className={className}
            style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '1.25rem 1.25rem 1rem',
                borderLeft: `4px solid ${accentColor}`,
                boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
                position: 'relative',
            }}
        >
            <div style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: '9px',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: '#1A6B7C',
                marginBottom: '.5rem',
            }}>
                Flooding Detected
            </div>
            <div style={{
                fontFamily: 'var(--font-jakarta)',
                fontSize: '2rem',
                fontWeight: 800,
                color: accentColor,
                letterSpacing: '-.04em',
                lineHeight: 1,
                marginBottom: '.35rem',
            }}>
                {isLoading ? '—' : floodingCount}
            </div>
            <div style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: subColor }}>
                {isComplete
                    ? `of ${activeSensors} sensors`
                    : `Checking ${checked}/${totalToCheck}`}
            </div>
            {!isComplete && totalToCheck > 0 && (
                <div style={{ marginTop: '.5rem', height: '3px', background: 'rgba(61,79,88,.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#E8A030', width: `${progress}%`, transition: 'width .3s' }} />
                </div>
            )}
        </div>
    );
}
