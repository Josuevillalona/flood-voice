'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Brain, Settings, LogOut, Phone, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import { FloodingProvider } from '@/contexts/flooding-context';
import './dashboard.css';

const navItems = [
    { name: 'Command Center', href: '/dashboard',                icon: LayoutDashboard },
    { name: 'Live Calls',     href: '/dashboard/calls',          icon: Phone },
    { name: 'Residents Pod',  href: '/dashboard/residents',      icon: Users },
    { name: 'Intake Form',    href: '/dashboard/intake',         icon: ClipboardList },
    { name: 'Flood Intel',    href: '/dashboard/intelligence',   icon: Brain },
    { name: 'Settings',       href: '/dashboard/settings',       icon: Settings },
];

function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="db-sidebar">
            <div className="db-sidebar-logo">
                <Image src="/logo-white.png" alt="FloodVoice" width={110} height={62} priority />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                <div className="db-sidebar-section">Operations</div>
                <div className="db-sidebar-nav">
                    {navItems.slice(0, 3).map(item => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`db-nav-item${pathname === item.href ? ' active' : ''}`}>
                                <Icon size={14} strokeWidth={1.75} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="db-sidebar-section">Intelligence</div>
                <div className="db-sidebar-nav">
                    {navItems.slice(3).map(item => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`db-nav-item${pathname === item.href ? ' active' : ''}`}>
                                <Icon size={14} strokeWidth={1.75} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="db-sidebar-foot">
                <div className="db-sidebar-user">
                    <div className="db-sidebar-avatar">FV</div>
                    <div>
                        <div className="db-sidebar-uname">Liaison</div>
                        <div className="db-sidebar-urole">FloodVoice NYC</div>
                    </div>
                </div>
                <button className="db-nav-item" style={{ marginTop: '2px' }}>
                    <LogOut size={14} strokeWidth={1.75} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const currentPage = navItems.find(i => i.href === pathname)?.name ?? 'Dashboard';

    return (
        <FloodingProvider>
            <div className="db-shell">
                <Sidebar />
                <div className="db-main">
                    <div className="db-topbar">
                        <div className="db-breadcrumb">
                            <span>FloodVoice</span>
                            <span>/</span>
                            <span className="db-breadcrumb-active">{currentPage}</span>
                        </div>
                    </div>
                    <div className="db-body">
                        {children}
                    </div>
                </div>
            </div>
        </FloodingProvider>
    );
}
