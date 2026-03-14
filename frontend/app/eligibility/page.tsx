"use client";

import { useState } from 'react';
import Link from 'next/link';

const steps = ['Personal Details', 'Financial Info', 'Review'];

export default function EligibilityPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState({
        fullName: '',
        age: '',
        course: '',
        loanAmount: '',
        monthlyIncome: '',
        existingEMI: '',
        creditScore: '',
        emiBounces: '',
    });
    const [result, setResult] = useState<{ eligible: boolean; message: string; details: string[] } | null>(null);

    const update = (field: string, value: string) => setForm({ ...form, [field]: value });

    const calculateEligibility = () => {
        const income = parseFloat(form.monthlyIncome) || 0;
        const existingEMI = parseFloat(form.existingEMI) || 0;
        const creditScore = parseInt(form.creditScore) || 0;
        const loanAmount = parseFloat(form.loanAmount) || 0;
        const emiBounces = parseInt(form.emiBounces) || 0;
        const age = parseInt(form.age) || 0;

        const details: string[] = [];
        let score = 0;

        if (age >= 18 && age <= 55) { score += 20; details.push('✅ Age within acceptable range'); }
        else { details.push('❌ Age outside acceptable range (18–55)'); }

        if (creditScore >= 700) { score += 25; details.push('✅ Excellent credit score'); }
        else if (creditScore >= 600) { score += 15; details.push('⚠️ Fair credit score, some terms may apply'); }
        else { details.push('❌ Credit score too low (minimum 600)'); }

        const foir = income > 0 ? ((existingEMI / income) * 100) : 0;
        if (foir <= 40) { score += 25; details.push(`✅ FOIR ratio: ${foir.toFixed(1)}% (within limit)`); }
        else if (foir <= 55) { score += 10; details.push(`⚠️ FOIR ratio: ${foir.toFixed(1)}% (borderline)`); }
        else { details.push(`❌ FOIR ratio: ${foir.toFixed(1)}% (too high, max 55%)`); }

        if (emiBounces === 0) { score += 15; details.push('✅ No EMI bounces — excellent!'); }
        else if (emiBounces <= 2) { score += 5; details.push(`⚠️ ${emiBounces} EMI bounce(s) — needs review`); }
        else { details.push(`❌ ${emiBounces} EMI bounces — poor repayment history`); }

        if (income >= 15000) { score += 15; details.push('✅ Monthly income meets threshold'); }
        else { details.push('❌ Monthly income below ₹15,000 minimum'); }

        const eligible = score >= 60;
        setResult({
            eligible,
            message: eligible ? `Congratulations ${form.fullName}! You are likely eligible for a ₹${loanAmount.toLocaleString()} education loan.` : `Sorry ${form.fullName}, your eligibility score is too low. Consider improving your credit score or reducing existing EMIs.`,
            details,
        });
    };

    const emi = (() => {
        const P = parseFloat(form.loanAmount);
        if (!P || P <= 0) return null;
        const r = 12 / 100 / 12;
        const n = 10;
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return Math.round(emi);
    })();

    const canProceed = () => {
        if (currentStep === 0) return form.fullName && form.age && form.course;
        if (currentStep === 1) return form.loanAmount && form.monthlyIncome && form.creditScore;
        return true;
    };

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
                    <Link href="/apply" className="btn btn-primary btn-sm">Apply Now</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
                <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 className="section-title">Check Your Loan Eligibility</h1>
                    <p className="section-subtitle" style={{ maxWidth: 500, margin: '0.25rem auto 0' }}>Get an instant pre-assessment for your education loan in 3 simple steps.</p>
                </div>

                {!result ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                        <div>
                            {/* Step Indicator */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                                {steps.map((step, idx) => (
                                    <div key={step} style={{ flex: 1, cursor: idx <= currentStep ? 'pointer' : 'default' }} onClick={() => idx <= currentStep && setCurrentStep(idx)}>
                                        <div style={{ height: 4, borderRadius: 2, background: idx <= currentStep ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', marginBottom: '0.5rem' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, background: idx <= currentStep ? 'var(--accent)' : 'var(--bg-input)', color: idx <= currentStep ? 'white' : 'var(--text-muted)' }}>
                                                {idx < currentStep ? '✓' : idx + 1}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="card animate-slide-up">
                                {currentStep === 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Personal Details</h3>
                                        <div>
                                            <label className="label">Full Name</label>
                                            <input className="input" placeholder="John Doe" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="label">Age</label>
                                                <input className="input" type="number" placeholder="25" value={form.age} onChange={e => update('age', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Course / Program</label>
                                                <input className="input" placeholder="MBA, B.Tech..." value={form.course} onChange={e => update('course', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Information</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="label">Loan Amount Required (₹)</label>
                                                <input className="input" type="number" placeholder="500000" value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Monthly Income (₹)</label>
                                                <input className="input" type="number" placeholder="50000" value={form.monthlyIncome} onChange={e => update('monthlyIncome', e.target.value)} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="label">Existing EMIs (₹/month)</label>
                                                <input className="input" type="number" placeholder="0" value={form.existingEMI} onChange={e => update('existingEMI', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Credit Score (300-900)</label>
                                                <input className="input" type="number" placeholder="750" min="300" max="900" value={form.creditScore} onChange={e => update('creditScore', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">EMI Bounces (Last 6 Months)</label>
                                            <input className="input" type="number" placeholder="0" min="0" value={form.emiBounces} onChange={e => update('emiBounces', e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Review Your Details</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {[
                                                ['Name', form.fullName],
                                                ['Age', form.age],
                                                ['Course', form.course],
                                                ['Loan Amount', `₹${parseFloat(form.loanAmount || '0').toLocaleString()}`],
                                                ['Monthly Income', `₹${parseFloat(form.monthlyIncome || '0').toLocaleString()}`],
                                                ['Existing EMIs', `₹${parseFloat(form.existingEMI || '0').toLocaleString()}`],
                                                ['Credit Score', form.creditScore || 'Not provided'],
                                                ['EMI Bounces', form.emiBounces || '0'],
                                            ].map(([label, value]) => (
                                                <div key={label} style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 10 }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                                    {currentStep > 0 && <button className="btn btn-ghost" onClick={() => setCurrentStep(currentStep - 1)}>← Back</button>}
                                    <div style={{ marginLeft: 'auto' }}>
                                        {currentStep < 2 ? (
                                            <button className="btn btn-primary" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                                                Continue →
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary btn-lg" onClick={calculateEligibility}>
                                                Check Eligibility ⚡
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Side Panel */}
                        <div>
                            {/* Quick EMI Estimate */}
                            <div className="card" style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Quick EMI Estimate</h4>
                                {emi ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{emi.toLocaleString()}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per month (10 installments @ 12%)</p>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Enter loan amount to see estimate</p>
                                )}
                            </div>

                            {/* Feature badges */}
                            {[
                                { icon: '⚡', title: 'Fast Approval', desc: 'Get approved in under 10 minutes' },
                                { icon: '🔒', title: 'Secure & Private', desc: 'AES-256 encrypted data' },
                                { icon: '💡', title: 'Expert Assistance', desc: 'Dedicated advisor support' },
                            ].map(item => (
                                <div key={item.title} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '0.75rem', transition: 'all 0.3s ease' }}>
                                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icon}</span>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Results */
                    <div className="card animate-slide-up" style={{ maxWidth: 600, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: result.eligible ? 'var(--success-soft)' : 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem' }}>
                                {result.eligible ? '🎉' : '😔'}
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: result.eligible ? 'var(--success)' : 'var(--danger)', marginBottom: '0.5rem' }}>
                                {result.eligible ? 'You\'re Eligible!' : 'Not Eligible'}
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{result.message}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {result.details.map((d, i) => (
                                <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: 8 }}>{d}</p>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            {result.eligible && <Link href={`/apply?name=${encodeURIComponent(form.fullName)}&course=${encodeURIComponent(form.course)}&amount=${form.loanAmount}`} className="btn btn-primary">Apply Now →</Link>}
                            <button className="btn btn-ghost" onClick={() => { setResult(null); setCurrentStep(0); }}>Check Again</button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 300px"] {
                        grid-template-columns: 1fr !important;
                    }
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
