"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationCenter({ recipientType, recipientId }: { recipientType: string, recipientId?: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/?recipient_type=${recipientType}`;
            if (recipientId) url += `&recipient_id=${recipientId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [recipientType, recipientId]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${id}/read`, { method: 'PUT' });
            // Optimistic update
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/mark-all-read?recipient_type=${recipientType}`;
            if (recipientId) url += `&recipient_id=${recipientId}`;
            await fetch(url, { method: 'POST' });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    const nextShow = !showDropdown;
                    setShowDropdown(nextShow);
                    if (nextShow && unreadCount > 0) markAllAsRead();
                }}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors focus:outline-none"
            >
                <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {showDropdown && (
                <div className="fixed top-20 right-8 w-80 rounded-2xl shadow-xl bg-[var(--glass)] border border-[var(--glass-border)] backdrop-blur-xl focus:outline-none z-[100] overflow-hidden">
                    <div className="py-1">
                        <div className="px-4 py-3 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--surface-color)]/50">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                            <button onClick={() => setShowDropdown(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-[var(--text-muted)]">
                                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-[var(--glass-border)] last:border-0 ${notif.is_read ? 'opacity-70 hover:bg-[var(--surface-color)]/30' : 'bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/80'}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-sm ${notif.is_read ? 'font-medium' : 'font-semibold'} text-[var(--text-primary)]`}>{notif.title}</p>
                                            {!notif.is_read && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-[var(--accent)] mt-1.5 shadow-[0_0_8px_var(--accent)]"></span>}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{notif.message}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium uppercase tracking-wider">{new Date(notif.created_at).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
