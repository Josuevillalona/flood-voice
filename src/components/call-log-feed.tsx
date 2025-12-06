'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Activity, Zap, Droplets, Utensils, Home, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CallLog = {
    id: string;
    created_at: string;
    recording_url: string;
    transcript: string;
    summary: string;
    resident_id: string;
    resident: { name: string };
    // New Fields
    tags: string[];
    sentiment_score: number;
    key_topics: string;
};

// Map Tags to Colors & Icons
const getTagConfig = (tag: string) => {
    switch (tag) {
        case 'Medical': return { color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: Activity };
        case 'Food/Water': return { color: 'bg-orange-500/20 text-orange-500 border-orange-500/30', icon: Utensils };
        case 'Power': return { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', icon: Zap };
        case 'Evacuation': return { color: 'bg-purple-500/20 text-purple-500 border-purple-500/30', icon: Home };
        case 'Mental Health': return { color: 'bg-pink-500/20 text-pink-500 border-pink-500/30', icon: Brain };
        case 'Property Damage': return { color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: Droplets };
        default: return { color: 'bg-slate-800 text-slate-400 border-slate-700', icon: FileText };
    }
};

const getSentimentColor = (score: number) => {
    if (score >= 9) return "bg-red-600 text-white animate-pulse";
    if (score >= 7) return "bg-red-500 text-white";
    if (score >= 4) return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
};

export function CallLogFeed({ limit = 10 }: { limit?: number }) {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('call_logs')
                .select(`
                    id, created_at, recording_url, transcript, summary, resident_id, tags, sentiment_score, key_topics,
                    resident:residents(name)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (data) setLogs(data as any[]);
            setIsLoading(false);
        };

        fetchLogs();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('call_logs_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' },
                (payload) => {
                    console.log('Call Log Updated:', payload);
                    fetchLogs(); // Refresh on Insert OR Update
                }
            )
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [limit]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isLoading) return <div className="text-slate-500 text-sm animate-pulse">Scanning feed...</div>;

    if (logs.length === 0) return <div className="text-slate-500 text-sm">No recent calls recorded.</div>;

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <Card key={log.id} className={cn(
                    "bg-slate-900 border-slate-800 overflow-hidden transition-all duration-300",
                    (log.sentiment_score ?? 0) >= 8 ? "border-l-4 border-l-red-500" : ""
                )}>
                    <div
                        className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleExpand(log.id)}
                    >
                        {/* Header Row: Name | Time | Badges */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-white text-base">
                                    {log.resident?.name || 'Unknown Caller'}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            {/* Sentiment Badge - The Primary Signal */}
                            {log.sentiment_score > 0 && (
                                <Badge className={cn("text-xs font-bold px-2 py-0.5 border-none", getSentimentColor(log.sentiment_score))}>
                                    Score: {log.sentiment_score}/10
                                </Badge>
                            )}
                        </div>

                        {/* Summary / Key Topics Row */}
                        <div className="flex justify-between items-end">
                            <div className="space-y-2 flex-1 mr-4">
                                {/* AI Summary Check */}
                                {log.key_topics ? (
                                    <p className="text-sm text-slate-300 italic border-l-2 border-slate-700 pl-3">
                                        "{log.key_topics}"
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 line-clamp-1">
                                        {log.summary || log.transcript || "Processing transcript..."}
                                    </p>
                                )}

                                {/* Tags Row */}
                                {log.tags && log.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {log.tags.map(tag => {
                                            const config = getTagConfig(tag);
                                            const Icon = config.icon;
                                            return (
                                                <span key={tag} className={cn("text-[10px] px-2 py-0.5 rounded border flex items-center gap-1", config.color)}>
                                                    <Icon className="w-3 h-3" />
                                                    {tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
                                {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Expanded Detail View: Audio & Full Transcript */}
                    {expandedId === log.id && (
                        <div className="border-t border-slate-800 bg-slate-950 p-4 animate-in slide-in-from-top-2 duration-200">
                            {/* Audio Player */}
                            {log.recording_url && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <Play className="w-3 h-3" /> Call Recording
                                    </h4>
                                    <audio controls className="w-full h-8 rounded bg-slate-900" src={log.recording_url} />
                                </div>
                            )}

                            {/* Full Transcript */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Full Transcript
                                </h4>
                                <div className="text-sm text-slate-300 leading-relaxed p-3 bg-slate-900 rounded-md max-h-60 overflow-y-auto font-mono">
                                    {log.transcript || "Transcript not available."}
                                </div>
                            </div>

                            {/* Manual Re-Analyze Button (Debug) */}
                            {(!log.sentiment_score || log.sentiment_score === 0) && (
                                <div className="mt-4 pt-4 border-t border-slate-900 flex justify-end">
                                    <Button size="sm" variant="secondary"
                                        className="text-xs h-7"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await fetch('/api/analyze-call', {
                                                method: 'POST',
                                                body: JSON.stringify({ callId: log.id })
                                            });
                                            alert("Analysis Queued!");
                                        }}
                                    >
                                        <Brain className="w-3 h-3 mr-2" />
                                        Analyze with Gemini
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
