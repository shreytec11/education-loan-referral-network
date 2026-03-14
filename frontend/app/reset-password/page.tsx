"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const userType = searchParams.get('type') || 'student';

    const [form, setForm] = useState({ token, new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string; ok: boolean } | null>(null);

    const loginPath = userType === 'admin' ? '/admin/login' : userType === 'ambassador' ? '/ambassador/login' : '/student/login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            setResult({ ok: false, message: 'Passwords do not match.' });
            return;
        }
        if (form.new_password.length < 6) {
            setResult({ ok: false, message: 'Password must be at least 6 characters.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: form.token, new_password: form.new_password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Reset failed');
            setResult({ ok: true, message: data.message });
        } catch (err: any) {
            setResult({ ok: false, message: err.message || 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem' }}>🔐</div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Reset Password</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your reset token and choose a new password.</p>
                </div>

                <div className="card">
                    {result?.ok ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                            <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '1.5rem' }}>{result.message}</p>
                            <Link href={loginPath} className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                                Go to Login →
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="label">Reset Token</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={form.token}
                                    onChange={e => setForm({ ...form, token: e.target.value })}
                                    required
                                    placeholder="Paste your reset token here"
                                />
                            </div>
                            <div>
                                <label className="label">New Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={form.new_password}
                                    onChange={e => setForm({ ...form, new_password: e.target.value })}
                                    required
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                            <div>
                                <label className="label">Confirm New Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={form.confirm_password}
                                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                                    required
                                    placeholder="Repeat new password"
                                />
                            </div>
                            {result && !result.ok && (
                                <div style={{ padding: '0.6rem 0.85rem', borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.875rem' }}>
                                    {result.message}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <Link href={`/forgot-password?type=${userType}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Get a new token</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
