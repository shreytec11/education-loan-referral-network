"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Banknote, LayoutDashboard, Wallet, FolderOpen, Settings, KeyRound } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationCenter from '@/components/NotificationCenter';
import { api } from '@/lib/api';
import Link from 'next/link';

const STATUS_STEPS = [
    { id: 'Pending', label: 'Registered', sublabel: '' },
    { id: 'Processing', label: 'Processing', sublabel: 'In Progress' },
    { id: 'Approved', label: 'Approved', sublabel: 'Waiting' },
    { id: 'Disbursed', label: 'Disbursed', sublabel: '' },
];

function StatusStepper({ currentStatus }: { currentStatus: string }) {
    const isRejected = currentStatus === 'Rejected';
    const currentIdx = isRejected ? -1 : STATUS_STEPS.findIndex(s => s.id === currentStatus);

    if (isRejected) {
        return (
            <div className="card" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <XCircle size={40} style={{ color: 'var(--danger)' }} />
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--danger)' }}>Application Rejected</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Please check admin comments or contact support.</p>
                    </div>
                </div>
            </div>
        );
    }

    const progressWidth = STATUS_STEPS.length > 1 ? (currentIdx / (STATUS_STEPS.length - 1)) * 100 : 0;

    return (
        <div className="stepper">
            <div className="stepper-line" />
            <div className="stepper-progress" style={{ width: `calc(${progressWidth}% - 2rem)` }} />
            {STATUS_STEPS.map((step, idx) => {
                const isCompleted = currentIdx > idx;
                const isCurrent = currentIdx === idx;
                return (
                    <div key={step.id} className="stepper-step">
                        <div className={`stepper-dot ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                            {isCompleted ? <CheckCircle size={18} /> : isCurrent ? <Clock size={18} /> : (idx + 1)}
                        </div>
                        <span className={`stepper-label ${(isCompleted || isCurrent) ? 'active' : ''}`}>
                            {step.label}
                        </span>
                        {step.sublabel && (
                            <span className="stepper-sublabel">{step.sublabel}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

interface LeadStatus {
    id: string;
    student_name: string;
    status: string;
    course: string;
    loan_requirement: number;
    admin_comments?: string;
    disbursed_amount?: number;
    disbursement_date?: string;
}

interface Document {
    id: string;
    filename: string;
    uploaded_at: string;
    status?: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [lead, setLead] = useState<LeadStatus | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
            router.push('/student/login');
            return;
        }
        fetchDashboardData(studentId);
    }, [router]);

    const fetchDashboardData = async (id: string) => {
        try {
            const leadData = await api.get<LeadStatus>(`/api/documents/lead/${id}`);
            setLead(leadData);

            try {
                const docsData = await api.get<Document[]>(`/api/documents/${id}`);
                setDocuments(docsData);
            } catch (err) {
                // Documents might be empty/404, we don't want to crash the whole dashboard
                console.error("Failed to fetch documents", err);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!lead) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lead_id', lead.id);

        try {
            const token = localStorage.getItem('studentId');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/documents/upload`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const newDoc = await res.json();
            setDocuments([...documents, newDoc]);
            alert('Document uploaded successfully!');
        } catch {
            alert('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        router.push('/student/login');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMessage(null);
        if (pwForm.new_password !== pwForm.confirm_password) {
            setPwMessage({ text: 'New passwords do not match.', ok: false });
            return;
        }
        if (pwForm.new_password.length < 6) {
            setPwMessage({ text: 'Password must be at least 6 characters.', ok: false });
            return;
        }
        setPwLoading(true);
        try {
            await api.post('/api/auth/student/change-password', {
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
            });
            setPwMessage({ text: '✓ Password changed successfully!', ok: true });
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: any) {
            setPwMessage({ text: err.message || 'Failed to change password.', ok: false });
        } finally {
            setPwLoading(false);
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

    if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--danger)' }}>{error}</div>;
    if (!lead) return null;

    const sidebarItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', active: activeTab === 'Dashboard', onClick: () => setActiveTab('Dashboard') },
        { icon: <Wallet size={18} />, label: 'Loans', active: activeTab === 'Loans', onClick: () => setActiveTab('Loans') },
        { icon: <FolderOpen size={18} />, label: 'Documents', active: activeTab === 'Documents', onClick: () => setActiveTab('Documents') },
        { icon: <Settings size={18} />, label: 'Settings', active: activeTab === 'Settings', onClick: () => setActiveTab('Settings') },
    ];

    const getDocStatusBadge = (status?: string) => {
        if (status === 'Verified') return <span className="badge badge-success">✓ Verified</span>;
        if (status === 'Rejected') return <span className="badge badge-danger">✗ Rejected</span>;
        return <span className="badge badge-warning">⏳ Pending</span>;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                brandTitle="FinConnect Axis"
                items={sidebarItems}
                user={{ name: lead.student_name, role: 'Verified Student' }}
                onLogout={handleLogout}
            />

            <main className="dashboard-main">
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    {/* Header Area with Notifications */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative', zIndex: 50 }}>
                        <NotificationCenter recipientType="student" recipientId={lead.id} />
                    </div>

                    {activeTab === 'Dashboard' && (
                        <div className="animate-fade-in">
                            {/* Header */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 className="section-title">Student Dashboard</h1>
                                <p className="section-subtitle">Application ID: FC-{lead.id.slice(0, 5).toUpperCase()}-AX • Your loan request is currently under review.</p>
                            </div>

                            {/* Application Roadmap */}
                            <div className="card animate-slide-up" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Application Roadmap</h3>
                                </div>
                                <StatusStepper currentStatus={lead.status} />
                            </div>

                            {/* Stats Row */}
                            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Estimated Disbursement</div>
                                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{lead.loan_requirement?.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Current Status</div>
                                    <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                                        <span className={`badge ${lead.status === 'Approved' ? 'badge-success' : lead.status === 'Disbursed' ? 'badge-purple' : lead.status === 'Rejected' ? 'badge-danger' : lead.status === 'Processing' ? 'badge-accent' : 'badge-warning'}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Course</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lead.course}</div>
                                </div>
                            </div>
                            
                            {/* Disbursement Card */}
                            {lead.status === 'Disbursed' && lead.disbursed_amount && (
                                <div className="card-accent animate-slide-up" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Banknote size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Loan Disbursed Successfully! 🎉</h3>
                                            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Your education loan has been approved and processed.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem' }}>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Disbursed Amount</p>
                                            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{lead.disbursed_amount.toLocaleString()}</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem' }}>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Disbursement Date</p>
                                            <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                                                {lead.disbursement_date ? new Date(lead.disbursement_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Processing'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <Clock size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Final Verification & Deposit</p>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 4 }}>
                                                Amount of <strong>₹{lead.disbursed_amount.toLocaleString()}</strong> will be deposited within <strong>15-20 business days</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Comments */}
                            {lead.admin_comments && (
                                <div className="card animate-slide-up" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--warning)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)' }}>Message from Admin</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{lead.admin_comments}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Loans' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>My Loans</h2>
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Current Application</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 12 }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loan Amount</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{lead.loan_requirement?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</p>
                                        <span className={`badge ${lead.status === 'Approved' ? 'badge-success' : lead.status === 'Disbursed' ? 'badge-purple' : lead.status === 'Rejected' ? 'badge-danger' : lead.status === 'Processing' ? 'badge-accent' : 'badge-warning'}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You currently have one active loan application.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Documents' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Document Center</h2>
                            <div className="card animate-slide-up">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Required Documents</h3>
                                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                                        <Upload size={14} />
                                        {uploading ? 'Uploading...' : 'Upload'}
                                        <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>

                                {documents.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {documents.map((doc) => (
                                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.filename}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                {getDocStatusBadge(doc.status)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                                        <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                        <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No documents yet</p>
                                        <p style={{ fontSize: '0.8rem' }}>Upload your offer letter, identity proof, etc.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Settings' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Account Settings</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage your login credentials.</p>

                            <div className="card animate-slide-up" style={{ maxWidth: 480 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default password is 123456</p>
                                    </div>
                                </div>
                                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label className="label">Current Password</label>
                                        <input className="input" type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required placeholder="Enter current password" />
                                    </div>
                                    <div>
                                        <label className="label">New Password</label>
                                        <input className="input" type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required placeholder="Min. 6 characters" />
                                    </div>
                                    <div>
                                        <label className="label">Confirm New Password</label>
                                        <input className="input" type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} required placeholder="Repeat new password" />
                                    </div>
                                    {pwMessage && (
                                        <div style={{ padding: '0.6rem 0.85rem', borderRadius: 10, background: pwMessage.ok ? 'var(--success-soft)' : 'var(--danger-soft)', color: pwMessage.ok ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem' }}>
                                            {pwMessage.text}
                                        </div>
                                    )}
                                    <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ marginTop: '0.5rem' }}>
                                        {pwLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                                    <Link href="/forgot-password?type=student" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Forgot your password?</Link>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
