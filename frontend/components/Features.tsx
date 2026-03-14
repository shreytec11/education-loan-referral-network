"use client";

import { CreditCard, ShieldCheck, Zap, DollarSign } from 'lucide-react';

const features = [
    {
        name: 'Flexible Payments',
        description: 'Split school fees into easy monthly installments. Take control of your family budget with customizable plans.',
        icon: CreditCard,
        color: 'var(--accent)',
        bg: 'var(--accent-soft)',
    },
    {
        name: 'No Extra Fees',
        description: 'Enjoy 0% interest and no hidden fees if you pay on time. Complete transparency in every transaction.',
        icon: DollarSign,
        color: 'var(--success)',
        bg: 'var(--success-soft)',
    },
    {
        name: '10-Minute Onboarding',
        description: 'Smooth digital checkout and fast approval process. Go from application to approval in minutes, not days.',
        icon: Zap,
        color: 'var(--warning)',
        bg: 'var(--warning-soft)',
    },
    {
        name: 'Buyer Protection',
        description: 'Secure transactions and AES-256 encrypted data protection for complete peace of mind.',
        icon: ShieldCheck,
        color: 'var(--purple)',
        bg: 'var(--purple-soft)',
    },
];

export default function Features() {
    return (
        <section className="features-section" id="features">
            <div className="features-container">
                <div className="features-header animate-fade-in">
                    <span className="features-tag">Why FinConnect Axis</span>
                    <h2 className="features-title">Education payments, made simple</h2>
                    <p className="features-subtitle">
                        Designed for schools, parents, and financial partners to ensure secure and transparent experiences.
                    </p>
                </div>

                <div className="features-grid stagger-children">
                    {features.map((feature) => (
                        <div key={feature.name} className="feature-card card">
                            <div
                                className="feature-icon"
                                style={{ background: feature.bg, color: feature.color }}
                            >
                                <feature.icon size={24} />
                            </div>
                            <h3 className="feature-name">{feature.name}</h3>
                            <p className="feature-desc">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .features-section {
                    padding: 5rem 2rem;
                    background: var(--bg-secondary);
                    transition: background 0.35s ease;
                }

                .features-container {
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .features-header {
                    text-align: center;
                    margin-bottom: 3.5rem;
                }

                .features-tag {
                    display: inline-block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--accent);
                    margin-bottom: 0.75rem;
                }

                .features-title {
                    font-size: clamp(1.5rem, 3vw, 2.25rem);
                    font-weight: 800;
                    color: var(--text-primary);
                    letter-spacing: -0.02em;
                    margin-bottom: 0.75rem;
                }

                .features-subtitle {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    max-width: 520px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }

                .feature-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.25rem;
                    transition: transform 0.3s ease;
                }

                .feature-name {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }

                .feature-desc {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                }

                @media (max-width: 640px) {
                    .features-section { padding: 3rem 1rem; }
                    .features-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </section>
    );
}
