"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function AmbassadorLogin() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const ambassadorId = localStorage.getItem('ambassadorId');
        if (ambassadorId) {
            router.push(`/ambassador/dashboard/${ambassadorId}`);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.post<any>('/api/auth/ambassador/login', formData);
            localStorage.setItem('ambassadorId', data.id);
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => { router.push(`/ambassador/dashboard/${data.id}`); }, 1000);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', transition: 'background 0.35s ease' }}>
            <div style={{ width: '100%', maxWidth: 420 }} className="animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="var(--accent)" /><path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    </Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Ambassador Portal</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Track your performance and manage referrals.</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="label" htmlFor="email">Email Address</label>
                            <input id="email" className="input" type="email" required placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <input id="password" className="input" type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>

                        {error && <div style={{ padding: '0.65rem', borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}>{error}</div>}
                        {success && <div style={{ padding: '0.65rem', borderRadius: 10, background: 'var(--success-soft)', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 500 }}>{success}</div>}

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            New to the program?{' '}
                            <Link href="/ambassador/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Create an account →</Link>
                        </p>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Link href="/" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>← Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
