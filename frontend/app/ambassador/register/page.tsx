"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';

export default function AmbassadorRegister() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        college_name: '',
        referral_code: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ambassadors/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Registration failed');
            }

            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => { router.push('/ambassador/login'); }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', transition: 'background 0.35s ease' }}>
            {/* Nav */}
            <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', transition: 'all 0.35s ease' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="var(--accent)" /><path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    FinConnect Axis
                </Link>
                <Link href="/ambassador/login" className="btn btn-ghost btn-sm">Already have an account?</Link>
            </nav>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '4rem 2rem 3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero)', zIndex: 0 }} />
                <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.15, top: -150, right: -100, zIndex: 0 }} />
                <div style={{ position: 'relative', zIndex: 1 }} className="animate-fade-in">
                    <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                        Ambassador <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hub</span>
                    </h1>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 2rem' }}>
                        Join an elite network of student ambassadors and start earning commissions by referring education loans.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
                        {[
                            { value: 'Up to 25%', label: 'Commission' },
                            { value: '1,200+', label: 'Partners' },
                            { value: '45+', label: 'Institutions' },
                        ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{stat.value}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 2rem 4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                    {/* Left: benefits + marketing assets */}
                    <div className="animate-slide-up">
                        {/* Benefits */}
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Why Join?</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                            {[
                                { emoji: '💰', title: 'Competitive Commissions', desc: 'Earn commission on every successful loan disbursement in your network.' },
                                { emoji: '📊', title: 'Real-Time Dashboard', desc: 'Track every referral, conversion, and earning with our live dashboard.' },
                                { emoji: '🚀', title: 'Fast Payouts', desc: 'Get paid within 7 days of loan disbursement. No delays.' },
                            ].map(item => (
                                <div key={item.title} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.title}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Marketing Assets */}
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Marketing Assets</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { name: 'Brand Guidelines', size: '2.4 MB' },
                                { name: 'Social Media Kit', size: '8.1 MB' },
                                { name: 'Pitch Deck Template', size: '4.5 MB' },
                            ].map(asset => (
                                <div key={asset.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <Download size={16} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.size}</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm">Download</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Registration Form */}
                    <div className="card animate-slide-up" style={{ animationDelay: '0.1s', alignSelf: 'flex-start', position: 'sticky', top: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Create Ambassador Account</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="label" htmlFor="full_name">Full Name</label>
                                <input id="full_name" name="full_name" className="input" type="text" required value={formData.full_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="email">Email Address</label>
                                <input id="email" name="email" className="input" type="email" required value={formData.email} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="phone_number">Phone Number</label>
                                <input id="phone_number" name="phone_number" className="input" type="tel" required value={formData.phone_number} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="college_name">College/University</label>
                                <input id="college_name" name="college_name" className="input" type="text" required value={formData.college_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="referral_code">Preferred Referral Code</label>
                                <input id="referral_code" name="referral_code" className="input" type="text" required placeholder="e.g. YOURNAME123" value={formData.referral_code} onChange={handleChange} />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Students will use this code to refer you.</p>
                            </div>
                            <div>
                                <label className="label" htmlFor="password">Password</label>
                                <input id="password" name="password" className="input" type="password" required value={formData.password} onChange={handleChange} />
                            </div>

                            {error && <div style={{ padding: '0.65rem', borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}>{error}</div>}
                            {success && <div style={{ padding: '0.65rem', borderRadius: 10, background: 'var(--success-soft)', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 500 }}>{success}</div>}

                            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                {loading ? 'Registering...' : 'Create Account'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Already have an account?{' '}
                                <Link href="/ambassador/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 380px"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
