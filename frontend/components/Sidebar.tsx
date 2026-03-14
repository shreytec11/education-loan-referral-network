"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

interface SidebarItem {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
}

interface SidebarProps {
    brandTitle: string;
    items: SidebarItem[];
    user?: { name: string; role: string; avatar?: string };
    onLogout?: () => void;
    children?: React.ReactNode;
}

export default function Sidebar({ brandTitle, items, user, onLogout, children }: SidebarProps) {
    return (
        <aside className="sidebar" aria-label="Main navigation">
            {/* Brand */}
            <Link href="/" className="sidebar-brand" style={{ textDecoration: 'none' }}>
                <div className="sidebar-logo" style={{ background: 'transparent' }}>
                    <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
                </div>
                <span className="sidebar-brand-text" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem', textShadow: '0 0 10px rgba(88, 101, 242, 0.3)' }}>
                    {brandTitle}
                </span>
            </Link>

            {/* User profile */}
            {user && (
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="sidebar-user-info">
                        <p className="sidebar-user-name">{user.name}</p>
                        <p className="sidebar-user-role">{user.role}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {items.map((item, idx) => {
                    const content = (
                        <>
                            <span className="sidebar-nav-icon">{item.icon}</span>
                            <span className="sidebar-nav-label">{item.label}</span>
                        </>
                    );

                    if (item.href) {
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={idx}
                            onClick={item.onClick}
                            className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
                        >
                            {content}
                        </button>
                    );
                })}
            </nav>

            {/* Extra content slot */}
            {children && <div className="sidebar-extra">{children}</div>}

            {/* Logout */}
            <div className="sidebar-footer">
                {onLogout && (
                    <button onClick={onLogout} className="sidebar-nav-item sidebar-logout">
                        <span className="sidebar-nav-icon"><LogOut size={18} /></span>
                        <span className="sidebar-nav-label">Logout</span>
                    </button>
                )}
            </div>
        </aside>
    );
}
