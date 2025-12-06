'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Activity, Phone, Play, Pause, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type Log = {
    id: string;
    resident_id: string;
    summary: string;
    risk_label: 'safe' | 'distress' | 'pending';
    recording_url?: string;
    transcript?: string;
    created_at: string;
    residents?: {
        name: string;
    };
};

export function CallLogFeed() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel('realtime-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs' }, (payload) => {
                const newLog = payload.new as Log;
                fetchLogWithResident(newLog.id).then(fullLog => {
                    if (fullLog) setLogs(prev => [fullLog, ...prev]);
                });
            })
            .subscribe();
        const [showTranscript, setShowTranscript] = useState(false);

        return (
            <div className={cn(
                "p-4 rounded-xl border transition-all duration-300 group hover:border-slate-700",
                log.risk_label === 'distress'
                    ? "bg-red-500/10 border-red-500/30 text-red-100"
                    : "bg-slate-900/40 border-slate-800 text-slate-300"
            )}>
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {log.risk_label === 'distress' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        <span className="font-semibold text-white truncate max-w-[120px]" title={log.residents?.name}>
                            {log.residents?.name || 'Unknown'}
                        </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wide opacity-50 bg-slate-950/30 px-1.5 py-0.5 rounded">
                        {formatDistanceToNow(new Date(log.created_at))} ago
                    </span>
                </div>

                {/* Content */}
                <div className="mb-3">
                    <p
                        className={cn(
                            "text-xs leading-relaxed opacity-80",
                            !isExpanded && "line-clamp-2"
                        )}
                        title={!isExpanded ? "Click to expand" : ""}
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ cursor: 'pointer' }}
                    >
                        {log.summary || "No summary provided."}
                    </p>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        {log.recording_url && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPlay(); }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                        isPlaying
                                            ? "bg-blue-500/20 text-blue-400 animate-pulse"
                                            : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                    )}
                                >
                                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {isPlaying ? "Playing" : "Play"}
                                </button>

                                <a
                                    href={log.recording_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                                    title="Open Recording Link"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </>
                        )}
                    </div>

                    {log.transcript && (
                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <FileText className="w-3 h-3" />
                            Transcript
                            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                </div>

                {/* Transcript Drawer */}
                {showTranscript && log.transcript && (
                    <div className="mt-3 text-xs bg-black/20 p-3 rounded-lg border border-white/5 font-mono text-slate-400 whitespace-pre-wrap animate-in slide-in-from-top-2">
                        {log.transcript}
                    </div>
                )}
            </div>
        );
    }
