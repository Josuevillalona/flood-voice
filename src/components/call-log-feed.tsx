'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Activity, Zap, Droplets, Utensils, Home, Brain, ChevronDown, ChevronUp } from 'lucide-react';
Score: { log.sentiment_score }/10
                                </Badge >
                            )}
                        </div >

    {/* Summary / Key Topics Row */ }
    < div className = "flex justify-between items-end" >
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
                        </div >
                    </div >

    {/* Expanded Detail View: Audio & Full Transcript */ }
{
    expandedId === log.id && (
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
    )
}
                </Card >
            ))}
        </div >
    );
}
