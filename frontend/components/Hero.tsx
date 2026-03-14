"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const ROTATING_TEXTS = [
    "zero-cost EMIs",
    "flexible payments",
    "transparent installments"
];

export default function Hero() {
    const [textIndex, setTextIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero-section" id="hero">
            {/* Background decorations */}
            <div className="hero-bg">
                <div className="hero-gradient-orb hero-orb-1" />
                <div className="hero-gradient-orb hero-orb-2" />
                <div className="hero-grid-pattern" />
            </div>

            {/* Navigation */}
            <nav className="hero-nav">
                <div className="hero-nav-inner">
                    <Link href="/" className="hero-nav-brand">
                        <Image src="/logo.png" alt="FinConnect Axis Logo" width={48} height={48} style={{ borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>FinConnect Axis</span>
                    </Link>
                    <div className="hero-nav-links">
                        <Link href="/eligibility" className="hero-nav-link">Eligibility</Link>
                        <Link href="/apply" className="hero-nav-link">Apply Now</Link>
                        <Link href="/student/login" className="hero-nav-link">Student Portal</Link>
                        <Link href="/ambassador/login" className="btn btn-primary btn-sm">Ambassador Login</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="hero-content">
                <div className="hero-text animate-slide-up">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Trusted by 1,200+ Students Nationwide
                    </div>
                    <h1 className="hero-title flex-title">
                        <span>Split school fees</span>
                        <span className="rotating-text-container">
                            {ROTATING_TEXTS.map((text, idx) => {
                                const isActive = (!mounted && idx === 0) || (mounted && idx === textIndex);
                                return (
                                    <span
                                        key={text}
                                        className={`hero-title-accent rotating-text ${isActive ? 'active' : ''}`}
                                        aria-hidden={!isActive}
                                    >
                                        in {text}
                                    </span>
                                );
                            })}
                        </span>
                        <span>with <span className="brand-highlight">FinConnect Axis</span></span>
                    </h1>
                    <p className="hero-description">
                        Enjoy secure school fee payments, 10-minute digital onboarding, and flexible payment options that suit your family&apos;s budget. Zero hidden fees, hassle-free experience.
                    </p>
                    <div className="hero-actions">
                        <Link href="/apply" className="btn btn-primary btn-lg">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            Start Application
                        </Link>
                        <Link href="/eligibility" className="btn btn-secondary btn-lg">
                            Check Eligibility ⚡
                        </Link>
                    </div>
                    <div className="hero-quick-links">
                        <Link href="/ambassador/register">Become an Ambassador →</Link>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="hero-stats animate-slide-up" style={{ animationDelay: '0.15s' }}>
                    <div className="hero-stat">
                        <span className="hero-stat-value">₹50Cr+</span>
                        <span className="hero-stat-label">Disbursed</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">1,200+</span>
                        <span className="hero-stat-label">Students</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">10 min</span>
                        <span className="hero-stat-label">Onboarding</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">0%</span>
                        <span className="hero-stat-label">Hidden Fees</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hero-section {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .hero-bg {
                    position: absolute;
                    inset: 0;
                    background: var(--gradient-hero);
                    z-index: 0;
                }

                .hero-gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                }

                .hero-orb-1 {
                    width: 500px;
                    height: 500px;
                    background: var(--accent);
                    top: -150px;
                    right: -100px;
                    animation: float 8s ease-in-out infinite;
                }

                .hero-orb-2 {
                    width: 400px;
                    height: 400px;
                    background: #8b5cf6;
                    bottom: -150px;
                    left: -100px;
                    animation: float 10s ease-in-out infinite reverse;
                }

                .hero-grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(var(--border) 1px, transparent 1px);
                    background-size: 40px 40px;
                    opacity: 0.3;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-30px); }
                }

                /* Nav */
                .hero-nav {
                    position: relative;
                    z-index: 10;
                    padding: 1.25rem 2rem;
                }

                .hero-nav-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .hero-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-decoration: none;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.02em;
                }

                .hero-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .hero-nav-link {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .hero-nav-link:hover {
                    color: var(--accent);
                }

                /* Content */
                .hero-content {
                    position: relative;
                    z-index: 10;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem;
                    text-align: center;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 1rem;
                    border-radius: 50px;
                    background: var(--accent-soft);
                    border: 1px solid var(--accent-glow);
                    color: var(--accent);
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }

                .hero-badge-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--success);
                    animation: pulse-glow 2s ease infinite;
                }

                .hero-title {
                    font-size: clamp(2.25rem, 4.5vw, 3.75rem);
                    font-weight: 800;
                    line-height: 1.2;
                    letter-spacing: -0.03em;
                    color: var(--text-primary);
                    margin-bottom: 1.25rem;
                }
                
                .flex-title {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    column-gap: 0.4em;
                    row-gap: 0.2em;
                }

                .hero-title-accent {
                    background: var(--gradient-accent);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .brand-highlight {
                    color: var(--accent);
                    font-weight: 900;
                    font-size: 1.1em;
                    letter-spacing: -0.01em;
                    text-shadow: 0 0 25px var(--accent-glow), 0 0 10px rgba(88, 101, 242, 0.4);
                    display: inline-block;
                    transform: translateY(-2px);
                }

                /* The CSS Grid trick: All items occupy exactly the same space (grid-area 1/1).
                   The container automatically sizes itself to the widest element. */
                .rotating-text-container {
                    display: inline-grid;
                    align-items: center;
                    justify-items: center;
                }

                .rotating-text {
                    grid-area: 1 / 1;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(15px);
                    /* Fade out immediately (0s delay), visibility hidden after 0.5s */
                    transition: opacity 0.4s ease, transform 0.4s ease, visibility 0s 0.4s;
                    pointer-events: none;
                }

                .rotating-text.active {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                    pointer-events: auto;
                    /* Fade in after 0.5s delay (waiting for old text to hide) */
                    transition: opacity 0.4s ease 0.4s, transform 0.4s ease 0.4s, visibility 0s 0s;
                }

                .hero-description {
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    line-height: 1.7;
                    max-width: 640px;
                    margin-bottom: 2rem;
                }

                .hero-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-bottom: 2rem;
                }

                .hero-quick-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    justify-content: center;
                    font-size: 0.8rem;
                }

                .hero-quick-links a {
                    color: var(--text-muted);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .hero-quick-links a:hover { color: var(--accent); }
                .hero-divider { color: var(--border); }

                /* Stats */
                .hero-stats {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    padding: 1.5rem 2.5rem;
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    margin-top: 2rem;
                }

                .hero-stat { text-align: center; }

                .hero-stat-value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .hero-stat-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .hero-stat-divider {
                    width: 1px;
                    height: 40px;
                    background: var(--border);
                }

                @media (max-width: 768px) {
                    .hero-nav-links { display: none; }
                    .hero-content { padding: 1rem; }
                    .hero-stats {
                        flex-wrap: wrap;
                        gap: 1rem;
                        padding: 1rem;
                    }
                    .hero-stat-divider { display: none; }
                    .hero-stat { flex: 1; min-width: 80px; }
                }
            `}</style>
        </section>
    );
}
