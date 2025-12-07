'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Waves, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloodingSensor {
    id: string;
    name: string;
    depth_mm: number;
    depth_in: number;
}

interface StreamData {
    type: 'init' | 'update' | 'complete' | 'error';
    floodingCount: number;
    activeSensors?: number;
    totalToCheck?: number;
    checked?: number;
    floodingSensors: FloodingSensor[];
    error?: string;
}

export function FloodingDetected({ className }: { className?: string }) {
    const [floodingCount, setFloodingCount] = useState(0);
    const [activeSensors, setActiveSensors] = useState(0);
    const [floodingSensors, setFloodingSensors] = useState<FloodingSensor[]>([]);
    const [checked, setChecked] = useState(0);
    const [totalToCheck, setTotalToCheck] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsComplete(false);
        setError('');
        setFloodingCount(0);
        setChecked(0);
        setFloodingSensors([]);

        try {
            const response = await fetch('/api/floodnet/flooding-stream');
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Stream not supported');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: StreamData = JSON.parse(line.slice(6));

                            if (data.type === 'error') {
                                setError(data.error || 'Unknown error');
                                break;
                            }

                            if (data.type === 'init') {
                                setTotalToCheck(data.totalToCheck || 0);
                                setIsLoading(false);
                            }

                            if (data.type === 'update' || data.type === 'complete') {
                                setFloodingCount(data.floodingCount);
                                setChecked(data.checked || 0);
                                setFloodingSensors(data.floodingSensors || []);
                            }

                            if (data.type === 'complete') {
                                setActiveSensors(data.activeSensors || 0);
                                setIsComplete(true);
                            }
                        } catch {
                            // Ignore JSON parse errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const hasFlooding = floodingCount > 0;
    const progress = totalToCheck > 0 ? Math.round((checked / totalToCheck) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className={cn(
                "glass-panel p-6 rounded-xl border-l-4 transition-all duration-500 relative overflow-hidden min-h-[140px]",
                hasFlooding
                    ? "border-red-500 bg-red-500/5"
                    : isComplete
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-blue-500 bg-blue-500/5",
                className
            )}
        >
            {/* Pulsing background for active flooding */}
            {hasFlooding && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
            )}

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                        "text-sm font-medium",
                        hasFlooding ? "text-red-300" : isComplete ? "text-emerald-300" : "text-blue-300"
                    )}>
                        Flooding Detected
                    </span>
                    <div className="flex items-center gap-2">
                        {hasFlooding && (
                            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                        )}
                        <button
                            onClick={fetchData}
                            disabled={isLoading || (!isComplete && checked > 0)}
                            className="p-1 hover:bg-white/5 rounded transition-colors"
                            title="Refresh flooding status"
                        >
                            <RefreshCw className={cn(
                                "w-4 h-4 text-slate-500",
                                (isLoading || (!isComplete && checked > 0)) && "animate-spin"
                            )} />
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="text-red-400 text-sm">{error}</div>
                ) : (
                    <>
                        <div className="flex items-end gap-2">
                            <span className={cn(
                                "text-4xl font-bold transition-colors",
                                hasFlooding ? "text-red-500" : isComplete ? "text-emerald-400" : "text-blue-400"
                            )}>
                                {floodingCount}
                            </span>
                            <Waves className={cn(
                                "w-6 h-6 mb-1",
                                hasFlooding ? "text-red-500" : isComplete ? "text-emerald-400" : "text-blue-400"
                            )} />
                        </div>

                        <div className="text-xs text-slate-400 mt-1 truncate max-w-full">
                            {isComplete
                                ? hasFlooding && floodingSensors.length > 0
                                    ? `📍 ${floodingSensors[0].name.replace(/^[A-Z]+\s*-\s*/, '').substring(0, 20)}...`
                                    : `of ${activeSensors} sensors checked`
                                : `Checking... ${checked}/${totalToCheck}`
                            }
                        </div>

                        {/* Progress bar while loading */}
                        {!isComplete && totalToCheck > 0 && (
                            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}


                    </>
                )}
            </div>
        </motion.div>
    );
}
