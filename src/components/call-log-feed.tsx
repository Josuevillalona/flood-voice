'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Activity, Phone, Play, FileText } from 'lucide-react';
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

    useEffect(() => {
        fetchLogs();

        // Realtime Subscription
        const channel = supabase
            .channel('realtime-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs' }, (payload) => {
                const newLog = payload.new as Log;
                fetchLogWithResident(newLog.id).then(fullLog => {
                    if (fullLog) {
                        setLogs(prev => [fullLog, ...prev]);
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('call_logs')
            .select('*, residents(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setLogs(data as any[]);
        }
    };

    const fetchLogWithResident = async (logId: string) => {
        const { data } = await supabase
            .from('call_logs')
            .select('*, residents(name)')
            .eq('id', logId)
            .single();
        return data as any;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-slate-800 pb-4 mb-4 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-white">Live Intel Feed</h3>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs font-bold tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                    LIVE
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700">
                {logs.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                        <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No calls recorded yet.</p>
                        <p className="text-xs">Trigger a check-in to see live data.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className={cn(
                            "p-3 rounded-lg border flex gap-3 animate-in slide-in-from-left-2 duration-300",
                            log.risk_label === 'distress'
                                ? "bg-red-500/10 border-red-500/30 text-red-200"
                                : "bg-slate-900/50 border-slate-800 text-slate-300"
                        )}>
                            <div className="mt-1 shrink-0">
                                {log.risk_label === 'distress' ? (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                {/* Header */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white truncate">{log.residents?.name || 'Unknown'}</span>
                                        <span className="text-xs opacity-50 whitespace-nowrap">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <p className="leading-relaxed opacity-90 break-words">
                                        {log.summary || "No summary provided."}
                                    </p>
                                </div>

                                {/* Artifacts: Audio & Transcript */}
                                {(log.recording_url || log.transcript) && (
                                    <div className="pt-2 mt-2 border-t border-slate-700/50 space-y-2">
                                        {log.recording_url && (
                                            <div className="flex items-center gap-2">
                                                <audio controls className="h-8 w-full rounded opacity-80 hover:opacity-100 transition-opacity" src={log.recording_url} />
                                                <a
                                                    href={log.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                                    title="Open Recording"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}

                                        {log.transcript && (
                                            <details className="group">
                                                <summary className="cursor-pointer text-xs text-slate-500 hover:text-white flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> View Transcript
                                                </summary>
                                                <p className="mt-2 text-xs text-slate-400 bg-slate-950/50 p-2 rounded whitespace-pre-wrap">
                                                    {log.transcript}
                                                </p>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
