'use client';

import { CallLogFeed } from '@/components/call-log-feed';
import { PhoneCall } from 'lucide-react';

export default function CallsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Live Call Feed</h1>
                <p className="text-slate-400">Real-time monitoring of all check-in calls and AI analysis.</p>
            </div>

            {/* Main Feed */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 min-h-[600px]">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                    <PhoneCall className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Incoming Transcripts & Analysis</h2>
                </div>

                <CallLogFeed limit={50} />
            </div>
        </div>
    );
}
