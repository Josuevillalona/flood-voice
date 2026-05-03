'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RefreshCw, MapPin, Waves, Search, ExternalLink, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlooding } from '@/contexts/flooding-context';
import type { SocrataSensorMetadata } from '@/lib/nyc-opendata';

const BOROUGH_PREFIX_MAP: Record<string, string> = {
    'bk': 'Brooklyn', 'q': 'Queens', 'm': 'Manhattan', 'bx': 'Bronx', 'si': 'Staten Island',
};

function inferBorough(sensorName: string): string | undefined {
    const prefix = sensorName.trim().split(/\s*-\s*/)[0]?.toLowerCase();
    return prefix ? BOROUGH_PREFIX_MAP[prefix] : undefined;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const TOKEN_VALID  = MAPBOX_TOKEN.startsWith('pk.');

// Brand colors
const C_TEAL    = '#1A6B7C';
const C_AMBER   = '#E8A030';
const C_AMBER_M = 'rgba(232,160,48,.55)'; // muted amber for warning
const C_SLATE_M = 'rgba(61,79,88,.35)';   // muted slate for offline

interface Sensor {
    deployment_id: string;
    name: string;
    sensor_status: string;
    location: { coordinates: [number, number] };
}

interface FloodingSensor { id: string; name: string; depth_mm: number; depth_in: number }

export function FloodMap({ className }: { className?: string }) {
    const mapContainer  = useRef<HTMLDivElement>(null);
    const map           = useRef<mapboxgl.Map | null>(null);
    const markersRef    = useRef<mapboxgl.Marker[]>([]);

    const [sensors, setSensors]             = useState<Sensor[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [mapLoaded, setMapLoaded]         = useState(false);

    const flooding     = useFlooding();
    const floodingData = { floodingCount: flooding.floodingCount, activeSensors: flooding.activeSensors, floodingSensors: flooding.floodingSensors };

    const [sensorMetadata, setSensorMetadata]       = useState<Record<string, SocrataSensorMetadata>>({});
    const [boroughFilter, setBoroughFilter]         = useState('');
    const [boroughs, setBoroughs]                   = useState<string[]>([]);
    const [searchQuery, setSearchQuery]             = useState('');
    const [showFloodingOnly, setShowFloodingOnly]   = useState(false);
    const [showActiveOnly, setShowActiveOnly]       = useState(true);
    const hasFlyToFlooding                          = useRef(false);

    const [showFemaZones, setShowFemaZones]                 = useState(false);
    const [femaLoading, setFemaLoading]                     = useState(false);
    const [showCouncilDistricts, setShowCouncilDistricts]   = useState(false);
    const [councilLoading, setCouncilLoading]               = useState(false);

    const [councilCountsUnavailable, setCouncilCountsUnavailable] = useState(false);

    const NYC_CENTER: [number, number] = [-73.935242, 40.730610];
    const NYC_ZOOM = 10;

    const fetchSensors = async () => {
        try {
            const res = await fetch('/api/floodnet/sensors');
            if (res.ok) { const d = await res.json(); setSensors(d.deployments || []); }
        } catch (e) { console.error('Failed to fetch sensors:', e); }
    };

    const fetchData = async () => {
        setIsLoading(true);
        await fetchSensors();
        setIsLoading(false);
    };

    const getMarkerColor = (sensor: Sensor): string => {
        if (['dead', 'retired', 'signal'].includes(sensor.sensor_status)) return C_SLATE_M;
        const isFlooding = floodingData?.floodingSensors?.some(f => f.id === sensor.deployment_id);
        if (isFlooding) return C_AMBER;
        if (['low_charge', 'noisy', 'non-ota'].includes(sensor.sensor_status)) return C_AMBER_M;
        return C_TEAL;
    };

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current || !TOKEN_VALID) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: NYC_CENTER,
            zoom: NYC_ZOOM,
            attributionControl: false,
        });
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        map.current.on('load', () => setMapLoaded(true));
        return () => { map.current?.remove(); map.current = null; };
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/floodnet/opendata/sensors');
                if (!res.ok) return;
                const data: SocrataSensorMetadata[] = await res.json();
                const lookup: Record<string, SocrataSensorMetadata> = {};
                const boroughSet = new Set<string>();
                for (const s of data) {
                    const key = s.sensor_name?.trim().toLowerCase();
                    if (key) lookup[key] = s;
                    if (s.borough) boroughSet.add(s.borough);
                }
                setSensorMetadata(lookup);
                Object.values(BOROUGH_PREFIX_MAP).forEach(b => boroughSet.add(b));
                setBoroughs(Array.from(boroughSet).sort());
            } catch (e) { console.error('Failed to fetch sensor metadata:', e); }
        })();
    }, []);

    // Update markers
    useEffect(() => {
        if (!map.current || !mapLoaded || sensors.length === 0) return;

        const offlineStatuses = ['dead', 'retired', 'signal'];
        const sensorsToShow = sensors.filter(sensor => {
            const matchesSearch   = searchQuery === '' || sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) || sensor.deployment_id.toLowerCase().includes(searchQuery.toLowerCase());
            const isFlooding      = floodingData?.floodingSensors?.some(f => f.id === sensor.deployment_id);
            const isOffline       = offlineStatuses.includes(sensor.sensor_status);
            const meta            = sensorMetadata[sensor.name?.trim().toLowerCase()];
            const sensorBorough   = meta?.borough || inferBorough(sensor.name);
            return matchesSearch && (!showFloodingOnly || isFlooding) && (!showActiveOnly || !isOffline) && (!boroughFilter || sensorBorough === boroughFilter);
        });

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        sensorsToShow.forEach(sensor => {
            if (!sensor.location?.coordinates) return;
            const [lng, lat] = sensor.location.coordinates;
            const color        = getMarkerColor(sensor);
            const floodingInfo = floodingData?.floodingSensors?.find(f => f.id === sensor.deployment_id);
            const isFlooding   = !!floodingInfo;

            const el = document.createElement('div');
            el.className = 'flood-sensor-marker';
            const baseGlow = isFlooding ? `0 0 8px ${C_AMBER}` : `0 0 3px ${color}`;
            el.style.cssText = `
                width: 11px; height: 11px;
                background-color: ${color};
                border: 2px solid rgba(255,255,255,0.9);
                border-radius: 50%;
                cursor: pointer;
                transition: box-shadow 0.2s, border-width 0.2s;
                box-shadow: ${baseGlow};
                ${isFlooding ? 'animation: fv-pulse 1.5s infinite;' : ''}
            `;

            el.addEventListener('mouseenter', () => {
                el.style.boxShadow = `0 0 12px ${color}, 0 0 20px ${color}`;
                el.style.borderWidth = '3px';
            });
            el.addEventListener('mouseleave', () => {
                el.style.boxShadow = baseGlow;
                el.style.borderWidth = '2px';
            });

            const meta       = sensorMetadata[sensor.name?.trim().toLowerCase()];
            const statusText = isFlooding
                ? `Flooding · ${floodingInfo!.depth_in}" depth`
                : sensor.sensor_status === 'good' ? 'Active · No flooding'
                : sensor.sensor_status;
            const statusColor = isFlooding ? C_AMBER : sensor.sensor_status === 'good' ? C_TEAL : 'rgba(61,79,88,.45)';

            const metaLines: string[] = [];
            if (meta?.borough)              metaLines.push(`${meta.borough}${meta.zipcode ? ` · ${meta.zipcode}` : ''}`);
            if (meta?.street_name)          metaLines.push(meta.street_name);
            if (meta?.tidally_influenced === 'true') metaLines.push('Tidally influenced');

            const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, className: 'fv-map-popup' })
                .setHTML(`
                    <div style="font-family:var(--font-jakarta,system-ui);padding:2px;">
                        <div style="font-weight:700;font-size:12px;color:#3D4F58;margin-bottom:3px;">${sensor.name}</div>
                        <div style="font-size:10px;font-weight:600;color:${statusColor};">${statusText}</div>
                        ${metaLines.length > 0 ? `
                            <div style="font-size:9px;color:rgba(61,79,88,.45);margin-top:5px;padding-top:5px;border-top:1px solid rgba(61,79,88,.1);letter-spacing:.03em;">
                                ${metaLines.join(' &nbsp;·&nbsp; ')}
                            </div>
                        ` : ''}
                    </div>
                `);

            el.addEventListener('click', () => {
                map.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
            });

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map.current!);
            markersRef.current.push(marker);
        });

        if (!hasFlyToFlooding.current && floodingData?.floodingSensors?.length > 0) {
            const fs = sensors.find(s => s.deployment_id === floodingData.floodingSensors[0].id);
            if (fs?.location?.coordinates) {
                hasFlyToFlooding.current = true;
                map.current.flyTo({ center: fs.location.coordinates, zoom: 13, duration: 2000 });
            }
        }
    }, [sensors, floodingData, mapLoaded, searchQuery, showFloodingOnly, showActiveOnly, boroughFilter, sensorMetadata]);

    // FEMA zones
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const SRC = 'fema-zones', FILL = 'fema-zones-fill', LINE = 'fema-zones-outline';
        const remove = () => {
            if (map.current!.getLayer(LINE)) map.current!.removeLayer(LINE);
            if (map.current!.getLayer(FILL)) map.current!.removeLayer(FILL);
            if (map.current!.getSource(SRC))  map.current!.removeSource(SRC);
        };
        if (!showFemaZones) { remove(); return; }
        if (map.current.getSource(SRC)) return;
        setFemaLoading(true);
        fetch('/api/fema/zones').then(r => r.json()).then(geojson => {
            if (!map.current || map.current.getSource(SRC)) return;
            map.current.addSource(SRC, { type: 'geojson', data: geojson });
            map.current.addLayer({
                id: FILL, type: 'fill', source: SRC,
                paint: {
                    'fill-color': [
                        'match', ['get', 'FLD_ZONE'],
                        'VE', 'rgba(196,98,45,0.45)',
                        'AE', 'rgba(26,107,124,0.30)',
                        'AO', 'rgba(232,160,48,0.35)',
                        'AH', 'rgba(232,160,48,0.35)',
                        'A',  'rgba(61,79,88,0.15)',
                        'rgba(0,0,0,0)'
                    ],
                    'fill-opacity': 1,
                },
            }, 'waterway-label');
            map.current.addLayer({
                id: LINE, type: 'line', source: SRC,
                paint: {
                    'line-color': [
                        'match', ['get', 'FLD_ZONE'],
                        'VE', 'rgba(196,98,45,0.85)',
                        'AE', 'rgba(26,107,124,0.70)',
                        'AO', 'rgba(232,160,48,0.75)',
                        'AH', 'rgba(232,160,48,0.75)',
                        'A',  'rgba(61,79,88,0.40)',
                        'rgba(0,0,0,0)'
                    ],
                    'line-width': 1.5,
                },
            }, 'waterway-label');
        }).catch(err => console.error('FEMA layer error:', err)).finally(() => setFemaLoading(false));
    }, [showFemaZones, mapLoaded]);

    // Council Districts layer — fetches polygons + 30-day flood counts in parallel. Counts can fail independently — districts still render, just without gradient.
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        const COUNCIL_SOURCE = 'council-districts';
        const COUNCIL_FILL = 'council-districts-fill';
        const COUNCIL_OUTLINE = 'council-districts-outline';
        const COUNCIL_LABEL = 'council-districts-label';

        const removeCouncilLayers = () => {
            if (map.current!.getLayer(COUNCIL_LABEL)) map.current!.removeLayer(COUNCIL_LABEL);
            if (map.current!.getLayer(COUNCIL_OUTLINE)) map.current!.removeLayer(COUNCIL_OUTLINE);
            if (map.current!.getLayer(COUNCIL_FILL)) map.current!.removeLayer(COUNCIL_FILL);
            if (map.current!.getSource(COUNCIL_SOURCE)) map.current!.removeSource(COUNCIL_SOURCE);
        };

        if (!showCouncilDistricts) {
            removeCouncilLayers();
            setCouncilCountsUnavailable(false);
            return;
        }

        if (map.current.getSource(COUNCIL_SOURCE)) return;

        setCouncilLoading(true);
        Promise.all([
            fetch('/api/council-districts').then(r => r.json()),
            fetch('/api/council-districts/flood-counts').then(r => r.ok ? r.json() : Promise.reject(r.statusText)).catch(() => null),
        ])
            .then(([geojson, countsResp]) => {
                if (!map.current || map.current.getSource(COUNCIL_SOURCE)) return;
                if (geojson?.type !== 'FeatureCollection') {
                    throw new Error(`Expected GeoJSON FeatureCollection, got: ${JSON.stringify(geojson).slice(0, 200)}`);
                }

                const counts: Record<string, number> = countsResp?.counts ?? {};
                const countsAvailable = countsResp !== null && countsResp.counts !== undefined;
                setCouncilCountsUnavailable(!countsAvailable);

                const enriched = {
                    ...geojson,
                    features: geojson.features.map((f: { properties?: { coundist?: string } }) => ({
                        ...f,
                        properties: {
                            ...f.properties,
                            flood_count: counts[f.properties?.coundist ?? ''] ?? 0,
                        },
                    })),
                };

                map.current.addSource(COUNCIL_SOURCE, { type: 'geojson', data: enriched });

                const allCounts: number[] = enriched.features.map((f: { properties: { flood_count: number } }) => f.properties.flood_count);
                const maxCount = Math.max(...allCounts, 0);
                const useGradient = countsAvailable && maxCount > 0;

                const fillColor = useGradient
                    ? ([
                        'interpolate', ['linear'], ['get', 'flood_count'],
                        0, 'rgba(254,243,199,1)',
                        Math.max(maxCount * 0.5, 1), 'rgba(245,158,11,1)',
                        maxCount, 'rgba(146,64,14,1)',
                      ] as unknown as string)
                    : 'rgba(245,158,11,1)';

                map.current.addLayer({
                    id: COUNCIL_FILL, type: 'fill', source: COUNCIL_SOURCE,
                    paint: {
                        'fill-color': fillColor,
                        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.20, 12, 0.30, 15, 0.35],
                    },
                }, 'waterway-label');

                map.current.addLayer({
                    id: COUNCIL_OUTLINE, type: 'line', source: COUNCIL_SOURCE,
                    paint: {
                        'line-color': 'rgba(245,158,11,0.85)',
                        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 12, 1.5, 15, 2.0],
                    },
                }, 'waterway-label');

                map.current.addLayer({
                    id: COUNCIL_LABEL, type: 'symbol', source: COUNCIL_SOURCE,
                    minzoom: 11,
                    layout: {
                        'text-field': countsAvailable
                            ? ['format',
                                ['concat', 'District ', ['get', 'coundist']], { 'font-scale': 1.0 },
                                '\n', {},
                                ['to-string', ['get', 'flood_count']], { 'font-scale': 1.2, 'text-color': '#fef3c7' },
                              ]
                            : ['concat', 'District ', ['get', 'coundist']],
                        'text-size': 11, 'text-anchor': 'center', 'text-justify': 'center',
                        'text-allow-overlap': false, 'text-ignore-placement': false,
                    },
                    paint: {
                        'text-color': '#fbbf24',
                        'text-halo-color': 'rgba(0,0,0,0.85)',
                        'text-halo-width': 1.5,
                    },
                });
            })
            .catch(err => console.error('Council Districts layer error:', err))
            .finally(() => setCouncilLoading(false));
    }, [showCouncilDistricts, mapLoaded]);

    const offlineStatusList = ['dead', 'retired', 'signal'];
    const filteredSensors = sensors.filter(sensor => {
        const matchesSearch  = searchQuery === '' || sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) || sensor.deployment_id.toLowerCase().includes(searchQuery.toLowerCase());
        const isFlooding     = floodingData?.floodingSensors?.some(f => f.id === sensor.deployment_id);
        const isOffline      = offlineStatusList.includes(sensor.sensor_status);
        const meta           = sensorMetadata[sensor.name?.trim().toLowerCase()];
        const sensorBorough  = meta?.borough || inferBorough(sensor.name);
        return matchesSearch && (!showFloodingOnly || isFlooding) && (!showActiveOnly || !isOffline) && (!boroughFilter || sensorBorough === boroughFilter);
    });

    // Shared button style helper
    const filterBtn = (active: boolean, activeColor: string): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '6px', border: '1px solid',
        fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600,
        cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' as const,
        ...(active
            ? { background: `${activeColor}18`, borderColor: `${activeColor}55`, color: activeColor }
            : { background: 'rgba(61,79,88,.04)', borderColor: 'rgba(61,79,88,.12)', color: 'rgba(61,79,88,.5)' }
        ),
    });

    return (
        <div className={cn("overflow-hidden flex flex-col", className)} style={{ background: '#fff', borderRadius: '0 0 12px 12px' }}>
            {/* Filter bar */}
            <div style={{ padding: '.625rem 1rem', borderBottom: '1px solid rgba(61,79,88,.07)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem' }}>

                {/* Sensor count */}
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)', letterSpacing: '.06em', marginRight: '.25rem' }}>
                    {filteredSensors.length}/{sensors.length} SENSORS
                </span>

                {/* Search */}
                <div style={{ position: 'relative', minWidth: '120px', maxWidth: '160px' }}>
                    <Search size={11} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(61,79,88,.35)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', paddingLeft: '22px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
                            fontFamily: 'var(--font-noto)', fontSize: '11px', color: '#3D4F58',
                            background: 'rgba(61,79,88,.05)', border: '1px solid rgba(61,79,88,.1)',
                            borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const,
                        }}
                    />
                </div>

                {/* Borough */}
                {boroughs.length > 0 && (
                    <select
                        value={boroughFilter}
                        onChange={e => setBoroughFilter(e.target.value)}
                        style={{
                            fontFamily: 'var(--font-plex-mono)', fontSize: '10px', color: '#3D4F58',
                            background: 'rgba(61,79,88,.05)', border: '1px solid rgba(61,79,88,.1)',
                            borderRadius: '6px', padding: '4px 8px', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">All Boroughs</option>
                        {boroughs.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                )}

                {/* Active toggle */}
                <button onClick={() => setShowActiveOnly(!showActiveOnly)} style={filterBtn(showActiveOnly, C_TEAL)}>
                    <MapPin size={10} />
                    Active
                </button>

                {/* Flooding toggle */}
                <button onClick={() => setShowFloodingOnly(!showFloodingOnly)} style={filterBtn(showFloodingOnly, C_AMBER)}>
                    <Waves size={10} />
                    Flooding
                    {floodingData?.floodingCount > 0 && (
                        <span style={{ marginLeft: '2px', padding: '1px 5px', background: C_AMBER, color: '#fff', borderRadius: '10px', fontFamily: 'var(--font-plex-mono)', fontSize: '9px', lineHeight: '1.6' }}>
                            {floodingData.floodingCount}
                        </span>
                    )}
                </button>

                {/* FEMA zones */}
                <button onClick={() => setShowFemaZones(!showFemaZones)} disabled={femaLoading} style={filterBtn(showFemaZones, C_TEAL)}>
                    {femaLoading ? <RefreshCw size={10} className="animate-spin" /> : <Waves size={10} />}
                    FEMA Zones
                </button>

                {/* Council Districts */}
                <button onClick={() => setShowCouncilDistricts(!showCouncilDistricts)} disabled={councilLoading} style={filterBtn(showCouncilDistricts, C_AMBER)}>
                    {councilLoading ? <RefreshCw size={10} className="animate-spin" /> : <Building2 size={10} />}
                    Council Districts
                </button>

                {showCouncilDistricts && councilCountsUnavailable && (
                    <span className="text-[10px] text-amber-300/80 italic px-1" title="Could not load 30-day flood event counts; districts shown without color grading.">
                        flood event data unavailable
                    </span>
                )}
                <a
                    href="https://dataviz.floodnet.nyc"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...filterBtn(false, C_TEAL), textDecoration: 'none', color: 'rgba(61,79,88,.5)' }}
                >
                    <ExternalLink size={10} />
                    FloodNet
                </a>

                {/* Refresh */}
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    style={{ marginLeft: 'auto', padding: '5px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(61,79,88,.4)', borderRadius: '6px' }}
                    title="Refresh"
                >
                    <RefreshCw size={13} className={cn(isLoading && 'animate-spin')} />
                </button>
            </div>

            {/* Map */}
            <div className="relative flex-1 min-h-[350px]">
                <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

                {/* No token */}
                {!TOKEN_VALID && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,244,239,.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '.75rem', textAlign: 'center', padding: '1.5rem' }}>
                        <MapPin size={28} style={{ color: 'rgba(61,79,88,.25)' }} />
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>Map unavailable</p>
                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(61,79,88,.5)', maxWidth: '280px', lineHeight: 1.6 }}>
                            Add your Mapbox token to <code style={{ color: C_TEAL }}>.env.local</code> as <code style={{ color: C_TEAL }}>NEXT_PUBLIC_MAPBOX_TOKEN</code>.
                        </p>
                    </div>
                )}

                {/* Loading */}
                {TOKEN_VALID && isLoading && !mapLoaded && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,244,239,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: C_TEAL, letterSpacing: '.08em' }}>LOADING MAP…</span>
                    </div>
                )}

                {/* Legend */}
                <div style={{
                    position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 10,
                    background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)',
                    borderRadius: '10px', padding: '.75rem', border: '1px solid rgba(61,79,88,.08)',
                    boxShadow: '0 2px 8px rgba(61,79,88,.1)',
                }}>
                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(61,79,88,.4)', marginBottom: '.5rem' }}>Sensors</div>
                    {[
                        { color: C_TEAL,    label: 'Active' },
                        { color: C_AMBER_M, label: 'Warning' },
                        { color: C_AMBER,   label: 'Flooding', glow: true },
                        { color: C_SLATE_M, label: 'Offline' },
                    ].map(({ color, label, glow }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: '1.5px solid rgba(255,255,255,.9)', boxShadow: glow ? `0 0 6px ${C_AMBER}` : 'none', flexShrink: 0 }} />
                            <span style={{ fontFamily: 'var(--font-noto)', fontSize: '10px', color: '#3D4F58' }}>{label}</span>
                        </div>
                    ))}

                    {showFemaZones && (
                        <>
                            <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(61,79,88,.4)', margin: '.5rem 0 .3rem' }}>FEMA Zones</div>
                            {[
                                { color: 'rgba(196,98,45,.7)',  border: 'rgba(196,98,45,.9)',  label: 'VE — Coastal high vel.' },
                                { color: 'rgba(26,107,124,.5)', border: 'rgba(26,107,124,.8)', label: 'AE — 1% annual' },
                                { color: 'rgba(232,160,48,.5)', border: 'rgba(232,160,48,.8)', label: 'AO / AH — Shallow' },
                                { color: 'rgba(61,79,88,.25)',  border: 'rgba(61,79,88,.5)',   label: 'A — Approximate' },
                            ].map(({ color, border, label }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, border: `1px solid ${border}`, flexShrink: 0 }} />
                                    <span style={{ fontFamily: 'var(--font-noto)', fontSize: '10px', color: '#3D4F58' }}>{label}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .mapboxgl-map { position: absolute; top: 0; bottom: 0; left: 0; right: 0; }
                .mapboxgl-canvas { position: absolute; left: 0; top: 0; }
                .mapboxgl-canvas-container { position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow: hidden; }

                .mapboxgl-ctrl-group {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 1px 4px rgba(61,79,88,.15);
                    border: 1px solid rgba(61,79,88,.1);
                }
                .mapboxgl-ctrl-group button { background: #fff; border: none; }
                .mapboxgl-ctrl-group button:hover { background: rgba(61,79,88,.05); }

                @keyframes fv-pulse {
                    0%, 100% { box-shadow: 0 0 6px ${C_AMBER}; }
                    50%       { box-shadow: 0 0 14px ${C_AMBER}, 0 0 22px rgba(232,160,48,.4); }
                }

                .fv-map-popup .mapboxgl-popup-content {
                    background: #fff;
                    border: 1px solid rgba(61,79,88,.12);
                    border-radius: 8px;
                    padding: 8px 12px;
                    box-shadow: 0 2px 8px rgba(61,79,88,.12);
                }
                .fv-map-popup .mapboxgl-popup-tip { border-top-color: #fff; }
            `}</style>
        </div>
    );
}
