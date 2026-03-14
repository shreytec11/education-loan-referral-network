"use client";

import Link from 'next/link';
import LeadForm from '@/components/LeadForm';

export default function ApplyPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', transition: 'background 0.35s ease' }}>
            {/* Nav */}
            <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', transition: 'all 0.35s ease' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="var(--accent)" /><path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    FinConnect Axis
                </Link>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
                    <Link href="/eligibility" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Check Eligibility</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 2rem' }}>
                <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'var(--success-soft)', borderRadius: 50, marginBottom: '1rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>Applications Open</span>
                    </div>
                    <h1 className="section-title">Start Your Application</h1>
                    <p className="section-subtitle">Fill in your details below. We'll match you with the best loan options in minutes.</p>
                </div>

                <div className="card animate-slide-up">
                    <LeadForm />
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Not sure if you qualify?{' '}
                        <Link href="/eligibility" style={{ color: 'var(--accent)', fontWeight: 600 }}>Check Eligibility First →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
