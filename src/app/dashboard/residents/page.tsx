'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, User, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type definition
type Resident = {
    id: string;
    name: string;
    phone_number: string;
    status: 'safe' | 'distress' | 'unresponsive' | 'pending';
};

export default function ResidentsPage() {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchResidents();
    }, []);

    const fetchResidents = async () => {
        setIsLoading(true);
        // For MVP, we fetch all. In real app, filter by auth.uid()
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setResidents(data as Resident[]);
        setIsLoading(false);
    };

    const handleAddResident = async () => {
        if (!formData.name || !formData.phone) return;
        setIsSubmitting(true);

        // Get current user (mock or real)
        const { data: { user } } = await supabase.auth.getUser();

        // Fallback if no auth for demo: use a mock uuid or just try insert
        // Note: RLS will fail if not authenticated.
        // For this MVP step, we assume user might handle auth outside or we simulate success if local.

        const { error } = await supabase.from('residents').insert({
            liaison_id: user?.id || '00000000-0000-0000-0000-000000000000', // Warning: Needs real ID
            name: formData.name,
            phone_number: formData.phone,
            status: 'pending'
        });

        if (!error) {
            setIsOpen(false);
            setFormData({ name: '', phone: '' });
            fetchResidents(); // Refresh list
        } else {
            alert("Error adding resident: " + error.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Your Pod</h1>
                    <p className="text-slate-400">Manage the vulnerable residents you are responsible for.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Add Resident
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Resident</DialogTitle>
                            <DialogDescription>
                                Add a person to your triage list. They will be contacted during flood alerts.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Maria Rodriguez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+19175550123"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddResident} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Resident'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Residents Grid */}
            {isLoading ? (
                <div className="text-slate-500">Loading residents...</div>
            ) : residents.length === 0 ? (
                <div className="p-12 border border-dashed border-slate-700 rounded-xl text-center text-slate-500">
                    No residents found. Add someone to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {residents.map((resident) => (
                        <div key={resident.id} className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-900/50 group-hover:text-blue-400 transition-colors">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{resident.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone className="w-3 h-3" /> {resident.phone_number}
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                resident.status === 'safe' && "bg-green-500/10 text-green-500",
                                resident.status === 'distress' && "bg-red-500/10 text-red-500",
                                resident.status === 'pending' && "bg-slate-700 text-slate-300",
                                resident.status === 'unresponsive' && "bg-yellow-500/10 text-yellow-500",
                            )}>
                                {resident.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
