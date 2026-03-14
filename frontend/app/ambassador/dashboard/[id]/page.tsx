"use client";

import { useState, useEffect, use } from 'react';
import { Copy, Users, DollarSign, Activity, CheckCircle, TrendingUp, LayoutDashboard, Wallet, UsersRound, Trophy, Settings, Link2 } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import NotificationCenter from '@/components/NotificationCenter';
import { api } from '../../../../lib/api';

interface DashboardData {
    ambassador: {
        id: string;
        full_name: string;
        email: string;
        phone_number: string;
        college_name: string;
        referral_code: string;
        tier: string;
        next_tier_progress: number;
    };
    total_leads: number;
    status_breakdown: Record<string, number>;
    total_earnings: number;
    paid_earnings: number;
    pending_earnings: number;
    recent_leads: Array<{
        id: string;
        student_name: string;
        status: string;
        created_at: string;
    }>;
}

interface LeaderboardEntry {
    name: string;
    college: string;
    leads: number;
}

export default function Dashboard({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const ambassadorId = resolvedParams.id;
    const [data, setData] = useState<DashboardData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [settingsForm, setSettingsForm] = useState({
        email: '',
        phone_number: '',
        college_name: ''
    });
    const [saving, setSaving] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardData, leaderboardData] = await Promise.all([
                    api.get<DashboardData>(`/api/analytics/ambassadors/${ambassadorId}/performance`),
                    api.get<LeaderboardEntry[]>('/api/analytics/leaderboard')
                ]);
                setData(dashboardData);
                setLeaderboard(leaderboardData);
                setSettingsForm({
                    email: dashboardData.ambassador.email || '',
                    phone_number: dashboardData.ambassador.phone_number || '',
                    college_name: dashboardData.ambassador.college_name || ''
                });
            } catch (err: any) {
                setError(err.message || 'Could not load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        if (ambassadorId) fetchData();
    }, [ambassadorId]);

    const copyLink = () => {
        if (data) {
            const link = `${window.location.origin}/apply?ref=${data.ambassador.referral_code}`;
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const updated = await api.patch<any>(`/api/ambassadors/${ambassadorId}`, settingsForm);
            setData(prev => prev ? {
                ...prev,
                ambassador: { ...prev.ambassador, ...updated }
            } : null);
            alert('Settings updated successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleWithdraw = async () => {
        if (!data) return;
        
        if (data.pending_earnings < 1000) {
            alert('Minimum withdrawal amount is ₹1,000. Keep earning to reach the threshold!');
            return;
        }

        setWithdrawing(true);
        try {
            await api.post(`/api/ambassadors/${ambassadorId}/withdraw`, { amount: data.pending_earnings });
            alert('Payout request submitted successfully! Our team will process your payment shortly.');
            // Note: The pending amount is cleared when the Admin actually marks the commission as paid.
        } catch (err: any) {
            alert(err.message || 'Failed to submit payout request.');
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p>Loading Dashboard...</p>
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem' }}>Error</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const sidebarItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', active: activeTab === 'Dashboard', onClick: () => setActiveTab('Dashboard') },
        { icon: <Wallet size={18} />, label: 'Earnings', active: activeTab === 'Earnings', onClick: () => setActiveTab('Earnings') },
        { icon: <UsersRound size={18} />, label: 'Network', active: activeTab === 'Network', onClick: () => setActiveTab('Network') },
        { icon: <Trophy size={18} />, label: 'Rewards', active: activeTab === 'Rewards', onClick: () => setActiveTab('Rewards') },
        { icon: <Settings size={18} />, label: 'Settings', active: activeTab === 'Settings', onClick: () => setActiveTab('Settings') },
    ];

    const statusBadge = (status: string) => {
        const cls = status === 'Disbursed' ? 'badge-success' : status === 'Approved' ? 'badge-accent' : status === 'Rejected' ? 'badge-danger' : 'badge-warning';
        return <span className={`badge ${cls}`}>{status}</span>;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                brandTitle="FinConnect Axis"
                items={sidebarItems}
                user={{ name: data.ambassador.full_name, role: 'Ambassador' }}
                onLogout={() => { 
                    localStorage.removeItem('ambassadorId');
                    window.location.href = '/ambassador/login'; 
                }}
            >
                <div style={{ padding: '0 0.5rem' }}>
                    {/* Upcoming Milestone */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent-glow)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Next Milestone</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                            {data.ambassador.tier === 'Gold' ? 'Platinum Tier' : data.ambassador.tier === 'Silver' ? 'Gold Status' : 'Silver Status'}
                        </p>
                    </div>
                </div>
            </Sidebar>

            <main className="dashboard-main">
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    {/* Header Area with Notifications */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative', zIndex: 50 }}>
                        <NotificationCenter recipientType="ambassador" recipientId={ambassadorId} />
                    </div>

                    {activeTab === 'Dashboard' && (
                        <div className="animate-fade-in">
                            {/* Header */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 className="section-title">Ambassador Overview</h1>
                                <p className="section-subtitle">Welcome back, {data.ambassador.full_name}. Your network grew this week.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="stat-grid stagger-children" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                                        <DollarSign size={22} />
                                    </div>
                                    <div className="stat-label">Total Earnings</div>
                                    <div className="stat-value">₹{data.total_earnings.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                        <Users size={22} />
                                    </div>
                                    <div className="stat-label">Active Referrals</div>
                                    <div className="stat-value">{data.total_leads}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
                                        <TrendingUp size={22} />
                                    </div>
                                    <div className="stat-label">Conversion Rate</div>
                                    <div className="stat-value">{data.total_leads > 0 ? ((data.status_breakdown['Disbursed'] || 0) / data.total_leads * 100).toFixed(1) : '0'}%</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                                        <Activity size={22} />
                                    </div>
                                    <div className="stat-label">Pending Payout</div>
                                    <div className="stat-value">₹{data.pending_earnings.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Referral Link + Tier Progress */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                {/* Referral Link */}
                                <div className="card animate-slide-up">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <Link2 size={18} style={{ color: 'var(--accent)' }} />
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Share your link</h3>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Earn commission on every new partner you bring to the FinConnect network.
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            readOnly
                                            className="input"
                                            style={{ fontSize: '0.8rem' }}
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply?ref=${data.ambassador.referral_code}`}
                                        />
                                        <button onClick={copyLink} className={`btn ${copied ? 'btn-success' : 'btn-primary'} btn-sm`} style={{ minWidth: 90 }}>
                                            {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/ambassador/dashboard/${ambassadorId}/add-lead`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Add Lead</Link>
                                        <Link href={`/ambassador/dashboard/${ambassadorId}/resources`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Resources</Link>
                                    </div>
                                </div>

                                {/* Tier Progress */}
                                <div className="card-accent animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tier Progress</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>
                                        {data.ambassador.tier === 'Gold' ? 'You are a campus legend!' : `Reach ${data.ambassador.tier === 'Bronze' ? 'Silver' : 'Gold'} to unlock higher commissions!`}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{data.ambassador.tier} 🏆</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data.ambassador.tier === 'Gold' ? 'MAX' : `${Math.round(data.ambassador.next_tier_progress)}%`}</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${data.ambassador.next_tier_progress}%`, background: '#fbbf24', borderRadius: 10, transition: 'width 0.5s ease' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem' }}>
                                            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Multiplier</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>1.2x</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem' }}>
                                            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Paid Earnings</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{data.paid_earnings.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity + Leaderboard */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                {/* Recent Activity */}
                                <div className="card animate-slide-up">
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Activity</h3>
                                    {data.recent_leads.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {data.recent_leads.map((lead) => (
                                                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input)', transition: 'background 0.2s' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                            {lead.student_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lead.student_name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied {new Date(lead.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    {statusBadge(lead.status)}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                                            <p style={{ fontSize: '0.875rem' }}>No leads yet. Start sharing your link!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Leaderboard */}
                                <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Trophy size={18} style={{ color: 'var(--warning)' }} />
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Global Leaderboard</h3>
                                    </div>
                                    {leaderboard.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {leaderboard.map((entry, index) => (
                                                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: 8, background: index === 0 ? 'var(--warning-soft)' : 'transparent' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <span style={{
                                                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.75rem', fontWeight: 700,
                                                            background: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-muted)' : index === 2 ? '#cd7f32' : 'var(--bg-input)',
                                                            color: index < 3 ? 'white' : 'var(--text-muted)',
                                                        }}>
                                                            #{index + 1}
                                                        </span>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</p>
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{entry.college}</p>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{entry.leads} Leads</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No data available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Earnings' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Earnings & Payouts</h2>
                            <div className="stat-grid stagger-children" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Total Earnings</div>
                                    <div className="stat-value">₹{data.total_earnings.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Paid Earnings</div>
                                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{data.paid_earnings.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Pending Payout</div>
                                    <div className="stat-value" style={{ color: 'var(--warning)' }}>₹{data.pending_earnings.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Request Payout</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>You can request a payout when your pending earnings exceed ₹1,000.</p>
                                <button 
                                    className="btn btn-primary" 
                                    disabled={withdrawing}
                                    onClick={handleWithdraw}
                                >
                                    {withdrawing ? 'Processing Request...' : `Withdraw ₹${data.pending_earnings.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Network' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>My Referrals</h2>
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Referral Breakdown</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.total_leads}</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{data.status_breakdown['Approved'] || 0}</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disbursed</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{data.status_breakdown['Disbursed'] || 0}</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rejected</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{data.status_breakdown['Rejected'] || 0}</p>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Referrals</h3>
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Applied Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recent_leads.map(lead => (
                                                <tr key={lead.id}>
                                                    <td style={{ fontWeight: 600 }}>{lead.student_name}</td>
                                                    <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                                                    <td>{statusBadge(lead.status)}</td>
                                                </tr>
                                            ))}
                                            {data.recent_leads.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No referrals yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Rewards' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Rewards & Milestones</h2>
                            <div className="card-accent" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Current Tier: {data.ambassador.tier}</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>Keep referring to unlock better rewards and merchandise!</p>
                            </div>
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Upcoming Perks</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Silver Tier - 1.1x Multiplier</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unlock at 5 disbursed loans</p>
                                        </div>
                                        <Trophy size={20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                    </div>
                                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Gold Tier - 1.2x Multiplier</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unlock at 15 disbursed loans + FinConnect Swag Bag</p>
                                        </div>
                                        <Trophy size={20} style={{ color: 'var(--warning)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Settings' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Account Settings</h2>
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Profile Information</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label className="label">Full Name</label>
                                        <input type="text" className="input" value={data.ambassador.full_name} disabled style={{ opacity: 0.6 }} />
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Contact admin to change your legal name.</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label className="label">Email Address</label>
                                            <input 
                                                type="email" 
                                                className="input" 
                                                value={settingsForm.email} 
                                                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Phone Number</label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                value={settingsForm.phone_number} 
                                                onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">College / University</label>
                                        <input 
                                            type="text" 
                                            className="input" 
                                            value={settingsForm.college_name} 
                                            onChange={(e) => setSettingsForm({ ...settingsForm, college_name: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Referral Code</label>
                                        <input type="text" className="input" value={data.ambassador.referral_code} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={handleSaveSettings}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Session management</p>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { window.location.href = '/ambassador/login'; }}>Log Out of All Devices</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                @media (max-width: 900px) {
                    div[style*="grid-template-columns: 2fr 1fr"],
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
