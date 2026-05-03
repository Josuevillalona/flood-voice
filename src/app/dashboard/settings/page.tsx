'use client';

import { CheckCircle2, AlertCircle, Minus, Database, Waves, Droplets, BarChart2, Twitter, Facebook, MessageCircle } from 'lucide-react';

type ConnectionStatus = 'connected' | 'not_configured' | 'coming_soon';

interface ApiCard {
    name: string;
    description: string;
    status: ConnectionStatus;
    icon: React.ElementType;
    envVar?: string;
    note?: string;
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
    if (status === 'connected') return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.06em', color: '#1A6B7C', fontWeight: 600 }}>
            <CheckCircle2 size={11} /> Connected
        </span>
    );
    if (status === 'not_configured') return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.06em', color: '#E8A030', fontWeight: 600 }}>
            <AlertCircle size={11} /> Not Configured
        </span>
    );
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.06em', color: 'rgba(61,79,88,.4)', fontWeight: 600 }}>
            <Minus size={11} /> Coming Soon
        </span>
    );
}

const STATUS_BORDER: Record<ConnectionStatus, string> = {
    connected:      '#1A6B7C',
    not_configured: '#E8A030',
    coming_soon:    'rgba(61,79,88,.15)',
};

const apiSources: ApiCard[] = [
    {
        name: 'Supabase',
        description: 'Resident records, call logs, and community reports database.',
        status: 'connected',
        icon: Database,
        envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    },
    {
        name: 'NYC FloodNet',
        description: 'Real-time street-level flood sensor network across NYC.',
        status: 'connected',
        icon: Waves,
        note: 'Public API — no key required.',
    },
    {
        name: 'FEMA Flood Zones',
        description: 'National Flood Hazard Layer (NFHL) GeoJSON for NYC.',
        status: 'coming_soon',
        icon: Droplets,
        note: 'Wiring on Day 2 via /api/fema/zones.',
    },
    {
        name: 'NYC Flood Vulnerability Index',
        description: 'Neighborhood-level flood risk scores from NYC Open Data.',
        status: 'coming_soon',
        icon: BarChart2,
        note: 'Wiring on Day 2 via /api/fvi/data.',
    },
    {
        name: 'Twitter / X',
        description: 'Social media posts geo-tagged to NYC flood areas.',
        status: 'not_configured',
        icon: Twitter,
        envVar: 'TWITTER_BEARER_TOKEN',
        note: 'Requires Twitter API v2 Basic or Pro access.',
    },
    {
        name: 'Facebook',
        description: 'Public group posts and community alerts.',
        status: 'not_configured',
        icon: Facebook,
        envVar: 'FACEBOOK_PAGE_ACCESS_TOKEN',
        note: 'Requires Meta Graph API page access token.',
    },
    {
        name: 'Nextdoor',
        description: 'Hyperlocal neighborhood emergency posts.',
        status: 'coming_soon',
        icon: MessageCircle,
        note: 'Nextdoor does not have a public API — manual input panel planned.',
    },
];

export default function SettingsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div className="db-ph">
                <div>
                    <h1 className="db-ph-title">Settings</h1>
                    <p className="db-ph-sub">API connections, environment status, and configuration.</p>
                </div>
            </div>

            {/* Data source connections */}
            <div>
                <div className="db-section-head">
                    <div className="db-section-dot" />
                    <span className="db-section-title">Data Source Connections</span>
                    <span className="db-section-meta">{apiSources.filter(a => a.status === 'connected').length} / {apiSources.length} active</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {apiSources.map((api) => {
                        const Icon = api.icon;
                        const borderColor = STATUS_BORDER[api.status];
                        return (
                            <div key={api.name} style={{
                                background: '#fff',
                                borderRadius: '12px',
                                borderLeft: `3px solid ${borderColor}`,
                                boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
                                padding: '1rem 1.25rem',
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                                    background: 'rgba(26,107,124,.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={16} style={{ color: '#1A6B7C' }} />
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>
                                            {api.name}
                                        </span>
                                        <StatusBadge status={api.status} />
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.55)', lineHeight: 1.5, margin: 0 }}>
                                        {api.description}
                                    </p>
                                    {api.envVar && (
                                        <code style={{
                                            display: 'inline-block', marginTop: '6px',
                                            fontFamily: 'var(--font-plex-mono)', fontSize: '10px',
                                            color: '#1A6B7C', background: 'rgba(26,107,124,.07)',
                                            border: '1px solid rgba(26,107,124,.15)',
                                            borderRadius: '4px', padding: '2px 6px',
                                        }}>
                                            {api.envVar}
                                        </code>
                                    )}
                                    {api.note && (
                                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '10px', color: 'rgba(61,79,88,.4)', fontStyle: 'italic', marginTop: '4px', marginBottom: 0 }}>
                                            {api.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
