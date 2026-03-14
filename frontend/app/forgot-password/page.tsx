"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ForgotPasswordForm() {
    const searchParams = useSearchParams();
    const userType = searchParams.get('type') || 'student';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ token?: string; message: string; ok: boolean } | null>(null);

    const isAdmin = userType === 'admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            let res: Response;
            if (isAdmin) {
                res = await fetch(`${API_URL}/api/auth/forgot-password/admin/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email })
                });
            } else {
                res = await fetch(`${API_URL}/api/auth/forgot-password/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, user_type: userType })
                });
            }
            const data = await res.json();
            setResult({ ok: true, message: data.message, token: data.reset_token });
        } catch {
            setResult({ ok: false, message: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const loginPath = isAdmin ? '/admin/login' : userType === 'ambassador' ? '/ambassador/login' : '/student/login';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem' }}>🔑</div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Forgot Password</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isAdmin ? 'Enter your admin username' : `Enter your ${userType} email address`} to receive a reset token.
                    </p>
                </div>

                <div className="card">
                    {!result ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="label">{isAdmin ? 'Admin Username' : 'Email Address'}</label>
                                <input
                                    className="input"
                                    type={isAdmin ? 'text' : 'email'}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder={isAdmin ? 'Enter admin username' : 'Enter your registered email'}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Sending...' : 'Get Reset Token'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{result.ok ? '✅' : '❌'}</div>
                            <p style={{ color: result.ok ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>
                                {result.message}
                            </p>
                            {result.token && (
                                <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>⚠️ MVP Mode: Your reset token (would be emailed in production):</p>
                                    <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--accent)' }}>{result.token}</code>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Expires in 1 hour.</p>
                                </div>
                            )}
                            {result.token && (
                                <Link href={`/reset-password?token=${result.token}&type=${userType}`} className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                                    Reset Password Now →
                                </Link>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <Link href={loginPath} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense>
            <ForgotPasswordForm />
        </Suspense>
    );
}
