'use client';

import { ExternalLink, Waves, BarChart2, MessageSquare, MapPin, Users, Building2, Droplets } from 'lucide-react';
import { getNeighborhoodsSorted, COVERAGE_LABEL, type IdaNeighborhood } from '@/lib/neighborhoods';

const SORTED_NEIGHBORHOODS = getNeighborhoodsSorted();

// ─── Brand-aligned tier config (replaces TIER_CONFIG Tailwind classes) ──────
const TIER: Record<number, { color: string; bg: string; border: string; dot: string; label: string }> = {
    1: { color: '#C4622D', bg: 'rgba(196,98,45,.07)',  border: 'rgba(196,98,45,.18)', dot: '#C4622D',             label: 'Tier 1' },
    2: { color: '#E8A030', bg: 'rgba(232,160,48,.07)', border: 'rgba(232,160,48,.18)', dot: '#E8A030',             label: 'Tier 2' },
    3: { color: 'rgba(61,79,88,.5)', bg: 'rgba(61,79,88,.04)', border: 'rgba(61,79,88,.12)', dot: 'rgba(61,79,88,.35)', label: 'Tier 3' },
};

// ─── Severity config (community reports) ────────────────────────────────────
const SEV = {
    critical: { label: 'Critical', color: '#C4622D', bg: 'rgba(196,98,45,.08)',  border: 'rgba(196,98,45,.2)',  dot: '#C4622D' },
    moderate: { label: 'Moderate', color: '#E8A030', bg: 'rgba(232,160,48,.08)', border: 'rgba(232,160,48,.2)', dot: '#E8A030' },
    low:      { label: 'Low',      color: 'rgba(232,160,48,.6)', bg: 'rgba(232,160,48,.05)', border: 'rgba(232,160,48,.15)', dot: 'rgba(232,160,48,.5)' },
};

// ─── Community voice reports (demo) ─────────────────────────────────────────
const COMMUNITY_REPORTS = [
    { id: 1, timestamp: '2 hours ago', location: 'Van Dyke St & Ferris St, Red Hook', message: 'Water is coming under the front door. At least 4 inches on the street. Power is still on but I can hear the sump pump struggling.', severity: 'critical', reporter: 'Anonymous resident', verified: true },
    { id: 2, timestamp: '3 hours ago', location: 'Hunts Point Ave & Lafayette Ave, Bronx', message: 'Flooding at the corner. Cars can\'t get through. A few families on the ground floor need help — one older man with oxygen.', severity: 'critical', reporter: 'Community liaison', verified: true },
    { id: 3, timestamp: '4 hours ago', location: 'E 86th St, Canarsie', message: 'Street flooding on my block. Drains are backed up. Basement apartments getting water. Some people need to get to higher ground.', severity: 'moderate', reporter: 'Nextdoor report', verified: false },
    { id: 4, timestamp: '5 hours ago', location: 'Willis Ave, South Bronx', message: 'Utility pole on Willis sparking. Water below it. Someone called 911 already. Stay away from that corner.', severity: 'critical', reporter: 'Resident — translated from Spanish', verified: true },
    { id: 5, timestamp: '6 hours ago', location: 'Tiffany St, Hunts Point', message: 'Flooding on Tiffany. Not too deep yet. Most people I see are staying inside. Bodega on the corner is still open and helping people.', severity: 'low', reporter: 'WhatsApp community group', verified: false },
];

// ─── Neighborhood Card ───────────────────────────────────────────────────────
function NeighborhoodCard({ n }: { n: IdaNeighborhood }) {
    const tier = TIER[n.priority_tier] ?? TIER[3];

    return (
        <div style={{
            background: '#fff',
            borderRadius: '10px',
            borderLeft: `3px solid ${tier.color}`,
            boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
            padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
            {/* Tier pill + name + score */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                        fontFamily: 'var(--font-plex-mono)', fontSize: '8px', letterSpacing: '.06em',
                        padding: '2px 7px', borderRadius: '8px',
                        background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                        display: 'inline-block',
                    }}>
                        {tier.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                        <MapPin size={12} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.name}
                        </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)', marginLeft: '17px' }}>
                        {n.borough}
                    </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '28px', fontWeight: 800, color: tier.color, lineHeight: 1, letterSpacing: '-.04em' }}>
                        {n.true_risk_score}
                    </div>
                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)' }}>/ 100</div>
                </div>
            </div>

            {/* FEMA gap flag */}
            {n.fema_gap_flag && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(232,160,48,.08)', border: '1px solid rgba(232,160,48,.2)',
                    borderRadius: '6px', padding: '5px 8px',
                    fontFamily: 'var(--font-noto)', fontSize: '10px', color: '#E8A030',
                }}>
                    <Waves size={11} style={{ flexShrink: 0 }} />
                    Ida damage in FEMA Zone {n.fema_designated_zone} — model gap confirmed
                </div>
            )}

            {/* Risk score bar */}
            <div style={{ height: '4px', background: 'rgba(61,79,88,.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: tier.dot, width: `${n.true_risk_score}%`, transition: 'width .5s' }} />
            </div>

            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.6)' }}>
                    <Droplets size={11} style={{ color: '#E8A030', flexShrink: 0 }} />
                    {n.ida_impact.local_damage_rate_pct}% dmg rate
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.6)' }}>
                    <Users size={11} style={{ color: '#1A6B7C', flexShrink: 0 }} />
                    {n.demographics.lep_pct}% LEP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.45)', gridColumn: 'span 2' }}>
                    <Building2 size={11} style={{ color: 'rgba(61,79,88,.3)', flexShrink: 0 }} />
                    {n.infrastructure.basement_units_at_risk !== null
                        ? `${n.infrastructure.basement_units_at_risk.toLocaleString()} basement units`
                        : 'Basement data pending'}
                    <span style={{ color: 'rgba(61,79,88,.2)' }}>·</span>
                    <span style={{ color: 'rgba(61,79,88,.35)' }}>{COVERAGE_LABEL[n.infrastructure.floodnet_coverage]}</span>
                </div>
            </div>

            {/* Language tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {n.demographics.primary_languages.slice(0, 3).map(lang => (
                    <span key={lang} style={{
                        fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.03em',
                        padding: '2px 7px', borderRadius: '6px',
                        background: 'rgba(61,79,88,.06)', border: '1px solid rgba(61,79,88,.1)', color: 'rgba(61,79,88,.55)',
                    }}>
                        {lang}
                    </span>
                ))}
                {n.demographics.primary_languages.length > 3 && (
                    <span style={{
                        fontFamily: 'var(--font-plex-mono)', fontSize: '9px',
                        padding: '2px 7px', borderRadius: '6px',
                        background: 'rgba(61,79,88,.04)', color: 'rgba(61,79,88,.3)',
                    }}>
                        +{n.demographics.primary_languages.length - 3}
                    </span>
                )}
            </div>

            {/* CBO partners */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(61,79,88,.07)', fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)' }}>
                {n.cbo_partners.length} CBO partner{n.cbo_partners.length !== 1 ? 's' : ''} ·{' '}
                <span style={{ color: 'rgba(61,79,88,.3)' }}>
                    {n.cbo_partners.slice(0, 2).map(c => c.name).join(', ')}
                    {n.cbo_partners.length > 2 ? ' +more' : ''}
                </span>
            </div>
        </div>
    );
}

// ─── Card panel wrapper ───────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
    overflow: 'hidden',
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function FloodIntelligencePage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Page header */}
            <div className="db-ph">
                <div>
                    <h1 className="db-ph-title">Flood Intelligence</h1>
                    <p className="db-ph-sub">
                        Live data from NYC FloodNet, FEMA flood zones, Ida priority neighborhood risk scores, and community reports.
                    </p>
                </div>
            </div>

            {/* Row 1: FloodNet + FEMA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Panel — FloodNet Live */}
                <div style={CARD}>
                    <div className="db-card-head">
                        <div className="db-card-title">
                            <div className="db-card-title-dot" />
                            <Waves size={13} style={{ color: '#1A6B7C' }} />
                            NYC FloodNet — Live Sensors
                        </div>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.06em', padding: '2px 8px', borderRadius: '8px', background: 'rgba(26,107,124,.1)', color: '#1A6B7C', border: '1px solid rgba(26,107,124,.2)' }}>
                            LIVE
                        </span>
                    </div>
                    <div style={{ padding: '1rem 1.25rem' }}>
                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(61,79,88,.6)', lineHeight: 1.6, marginBottom: '1rem' }}>
                            Sensor data and the <strong style={{ color: '#3D4F58' }}>FEMA zone overlay</strong> are displayed on the Command Center map — click the{' '}
                            <span style={{ color: '#1A6B7C', fontWeight: 600 }}>FEMA Zones</span> toggle on the map to show AE, VE, and shallow flood areas. For historical trends and borough breakdowns, use the official FloodNet dashboard below.
                        </p>
                        <a
                            href="https://dataviz.floodnet.nyc"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', borderRadius: '8px',
                                background: 'rgba(26,107,124,.08)', color: '#1A6B7C',
                                border: '1px solid rgba(26,107,124,.2)',
                                fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            <ExternalLink size={13} />
                            Open FloodNet Dashboard
                        </a>
                    </div>
                </div>

                {/* Panel — FEMA Flood Zones */}
                <div style={CARD}>
                    <div className="db-card-head">
                        <div className="db-card-title">
                            <div className="db-card-title-dot" />
                            <Droplets size={13} style={{ color: '#1A6B7C' }} />
                            FEMA Flood Zone Map
                        </div>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.06em', padding: '2px 8px', borderRadius: '8px', background: 'rgba(26,107,124,.1)', color: '#1A6B7C', border: '1px solid rgba(26,107,124,.2)' }}>
                            LIVE
                        </span>
                    </div>
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(61,79,88,.6)', lineHeight: 1.6 }}>
                            FEMA flood zone polygons are overlaid on the Command Center map. Toggle with the{' '}
                            <span style={{ color: '#1A6B7C', fontWeight: 600 }}>FEMA Zones</span> button.
                        </p>
                        {[
                            { zone: 'VE',   label: 'Coastal High Hazard',  color: '#C4622D', bg: 'rgba(196,98,45,.08)',  border: 'rgba(196,98,45,.2)',  desc: 'Wave action + 1% annual flood risk. Highest risk.' },
                            { zone: 'AE',   label: '100-Year Flood Zone',  color: '#1A6B7C', bg: 'rgba(26,107,124,.08)', border: 'rgba(26,107,124,.2)', desc: '1% annual chance of flooding. FEMA insurance required.' },
                            { zone: 'AO/AH',label: 'Shallow Flooding',     color: '#E8A030', bg: 'rgba(232,160,48,.08)', border: 'rgba(232,160,48,.2)', desc: 'Sheet flow or ponding. Depth 1–3 ft.' },
                            { zone: 'X',    label: 'Minimal Hazard',       color: 'rgba(61,79,88,.45)', bg: 'rgba(61,79,88,.04)', border: 'rgba(61,79,88,.1)', desc: 'Outside 500-year floodplain. Lowest risk.' },
                        ].map(({ zone, label, color, bg, border, desc }) => (
                            <div key={zone} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: bg, border: `1px solid ${border}` }}>
                                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '10px', fontWeight: 700, color, flexShrink: 0, marginTop: '1px', minWidth: '32px' }}>
                                    {zone}
                                </span>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600, color }}>{label}</div>
                                    <div style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.5)', marginTop: '1px' }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ida Priority Neighborhoods */}
            <div style={CARD}>
                <div className="db-card-head">
                    <div className="db-card-title">
                        <div className="db-card-title-dot" />
                        <BarChart2 size={13} style={{ color: '#1A6B7C' }} />
                        Ida Priority Neighborhoods — True Risk Score
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
                            7 pilot areas
                        </span>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(232,160,48,.1)', color: '#E8A030', border: '1px solid rgba(232,160,48,.2)', letterSpacing: '.04em' }}>
                            80.4% of Ida damage in Zone X
                        </span>
                    </div>
                </div>
                <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {SORTED_NEIGHBORHOODS.map(n => (
                            <NeighborhoodCard key={n.id} n={n} />
                        ))}
                    </div>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)', marginTop: '1rem', lineHeight: 1.6, letterSpacing: '.03em' }}>
                        True Risk Score = weighted composite: Ida damage rate (30%) · FEMA model gap (25%) · LEP population (20%) · sensor gap (10%) · basement density (10%) · social vulnerability (5%). Source: NYC Community Flood Triage Pilot Report.
                    </p>
                </div>
            </div>

            {/* Community Voice Reports */}
            <div style={CARD}>
                <div className="db-card-head">
                    <div className="db-card-title">
                        <div className="db-card-title-dot" />
                        <MessageSquare size={13} style={{ color: '#1A6B7C' }} />
                        Community Voice Reports
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
                            Field reports from residents &amp; liaisons
                        </span>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(232,160,48,.1)', color: '#E8A030', border: '1px solid rgba(232,160,48,.2)' }}>
                            DEMO
                        </span>
                    </div>
                </div>
                <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {COMMUNITY_REPORTS.map((report) => {
                            const sev = SEV[report.severity as keyof typeof SEV];
                            return (
                                <div key={report.id} style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${sev.dot}`,
                                    border: `1px solid rgba(61,79,88,.08)`,
                                    borderLeftColor: sev.dot,
                                    borderLeftWidth: '3px',
                                    padding: '12px',
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    boxShadow: '0 1px 3px rgba(61,79,88,.04)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sev.dot, flexShrink: 0 }} />
                                            <span style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', fontWeight: 600, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {report.location}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                            {report.verified && (
                                                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '8px', padding: '1px 6px', borderRadius: '8px', background: 'rgba(26,107,124,.08)', color: '#1A6B7C', border: '1px solid rgba(26,107,124,.15)' }}>
                                                    ✓ verified
                                                </span>
                                            )}
                                            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '8px', padding: '1px 6px', borderRadius: '8px', background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                                                {sev.label}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: '#3D4F58', lineHeight: 1.6, margin: 0 }}>
                                        &ldquo;{report.message}&rdquo;
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: 'var(--font-noto)', fontSize: '10px', color: 'rgba(61,79,88,.45)' }}>{report.reporter}</span>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)' }}>{report.timestamp}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)', marginTop: '1rem', letterSpacing: '.04em' }}>
                        Demo data — live community_reports table connects here when Supabase is configured.
                    </p>
                </div>
            </div>

        </div>
    );
}
