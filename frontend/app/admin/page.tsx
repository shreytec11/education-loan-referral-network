"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, CheckCircle, TrendingUp, LayoutDashboard, List, DollarSign, Settings, Search, KeyRound } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationCenter from '@/components/NotificationCenter';

interface AdminData {
    total_ambassadors: number;
    total_leads: number;
    status_breakdown: Record<string, number>;
    financials: {
        disbursed: number;
        revenue: number;
        commission_distributed: number;
    };
}

interface LeadData {
    id: string;
    student_name: string;
    course: string;
    loan_amount: number;
    status: string;
    created_at: string;
    ambassador: { name: string; code: string; };
    disbursed_amount: number;
    admin_comments?: string;
}

interface AmbassadorData {
    id: string;
    full_name: string;
    email: string;
    college: string;
    referral_code: string;
    leads_generated: number;
    total_earnings: number;
    joined_at: string;
}

interface PayoutData {
    id: string;
    amount: number;
    disbursed_amount: number;
    company_revenue: number;
    status: string;
    date: string;
    paid_date?: string;
    ambassador: { name: string; email: string; college: string; };
    lead: { student_name: string; course: string; };
}

interface Document {
    id: string;
    filename: string;
    uploaded_at: string;
    status: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'ambassadors' | 'payouts' | 'management'>('dashboard');
    const [stats, setStats] = useState<AdminData | null>(null);
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [ambassadors, setAmbassadors] = useState<AmbassadorData[]>([]);
    const [payouts, setPayouts] = useState<PayoutData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [ambassadorSearchQuery, setAmbassadorSearchQuery] = useState('');

    const [editingLead, setEditingLead] = useState<LeadData | null>(null);
    const [editForm, setEditForm] = useState({ status: '', comments: '', disbursedAmount: '' });
    const [updating, setUpdating] = useState(false);

    const [viewingDocsLeadId, setViewingDocsLeadId] = useState<string | null>(null);
    const [leadDocuments, setLeadDocuments] = useState<Document[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [showAddLead, setShowAddLead] = useState(false);
    const [addLeadForm, setAddLeadForm] = useState({
        student_name: '',
        course_and_university: '',
        loan_requirement: '',
        current_city: '',
        phone_number: '',
        email: '',
        ambassador_id: ''
    });

    const [showAddAmbassador, setShowAddAmbassador] = useState(false);
    const [addAmbassadorForm, setAddAmbassadorForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        college_name: '',
        referral_code: '',
        password: 'Password@123'
    });
    const [adding, setAdding] = useState(false);

    const [settings, setSettings] = useState({ company_revenue_rate: 0.7, ambassador_commission_rate: 0.3 });
    const [updatingSettings, setUpdatingSettings] = useState(false);
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ text: string; ok: boolean } | null>(null);

    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { router.push('/admin/login'); } else { fetchStats(); }
    }, [router]);

    const getAdminHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
    });

    useEffect(() => {
        if (!localStorage.getItem('adminToken')) return;
        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'leads') fetchLeads();
        if (activeTab === 'ambassadors') fetchAmbassadors();
        if (activeTab === 'payouts') fetchPayouts();
        if (activeTab === 'management') fetchSettings();
    }, [activeTab]);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const fetchStats = async () => {
        try {
            const res = await fetch(`${apiBase}/api/analytics/admin/performance`, { headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed to fetch stats');
            setStats(await res.json());
        } catch { setError('Failed to load stats'); } finally { setLoading(false); }
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/analytics/admin/leads`, { headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed');
            setLeads(await res.json());
        } catch { setError('Failed to load leads'); } finally { setLoading(false); }
    };

    const fetchAmbassadors = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/analytics/admin/ambassadors`, { headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed');
            setAmbassadors(await res.json());
        } catch { setError('Failed to load ambassadors'); } finally { setLoading(false); }
    };

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/admin/payouts`, { headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed');
            setPayouts(await res.json());
        } catch { setError('Failed to load payouts'); } finally { setLoading(false); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${apiBase}/api/admin/settings`, { headers: getAdminHeaders() });
            if (res.ok) setSettings(await res.json());
        } catch { console.error('Failed to load settings'); }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingSettings(true);
        try {
            const res = await fetch(`${apiBase}/api/admin/settings`, { 
                method: 'PATCH', 
                headers: getAdminHeaders(),
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error('Failed');
            alert('Settings updated successfully!');
        } catch { alert('Failed to update settings'); } finally { setUpdatingSettings(false); }
    };

    const handleExportCsv = async () => {
        try {
            const res = await fetch(`${apiBase}/api/admin/export/all`, { headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'finconnect_export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch { alert('Failed to export data'); }
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
            const res = await fetch(`${apiBase}/api/auth/admin/change-password`, {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: 'Failed' }));
                throw new Error(err.detail || 'Failed to change password');
            }
            setPwMessage({ text: '✓ Password changed! You will be logged out.', ok: true });
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => { localStorage.removeItem('adminToken'); router.push('/admin/login'); }, 2000);
        } catch (err: any) {
            setPwMessage({ text: err.message || 'Failed to change password.', ok: false });
        } finally {
            setPwLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = lead.student_name.toLowerCase().includes(q) || lead.course.toLowerCase().includes(q) || lead.ambassador.name.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredAmbassadors = ambassadors.filter(amb => {
        const q = ambassadorSearchQuery.toLowerCase();
        return amb.full_name.toLowerCase().includes(q) || amb.email.toLowerCase().includes(q) || amb.college.toLowerCase().includes(q) || amb.referral_code.toLowerCase().includes(q);
    });

    const handleMarkPaid = async (payoutId: string) => {
        if (!confirm('Mark this commission as PAID?')) return;
        try {
            const res = await fetch(`${apiBase}/api/admin/payouts/${payoutId}/pay`, { method: 'POST', headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status: 'Paid', paid_date: data.paid_date } : p));
            fetchStats();
        } catch { alert('Failed to update payout status'); }
    };

    const handleViewDocuments = async (leadId: string) => {
        setViewingDocsLeadId(leadId);
        setLoadingDocs(true);
        setLeadDocuments([]);
        try {
            const res = await fetch(`${apiBase}/api/documents/${leadId}`);
            if (res.ok) setLeadDocuments(await res.json());
        } catch (err) { console.error(err); } finally { setLoadingDocs(false); }
    };

    const updateDocStatus = async (docId: string, status: string) => {
        if (!confirm(`Mark document as ${status}?`)) return;
        try {
            const res = await fetch(`${apiBase}/api/documents/${docId}/verify`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
            });
            if (res.ok) setLeadDocuments(leadDocuments.map(d => d.id === docId ? { ...d, status } : d));
        } catch { alert('Failed to update document status'); }
    };

    const handleEditClick = (lead: LeadData) => {
        setEditingLead(lead);
        setEditForm({ status: lead.status, comments: lead.admin_comments || '', disbursedAmount: lead.loan_amount?.toString() || '' });
    };

    const handleUpdateLead = async () => {
        if (!editingLead) return;
        setUpdating(true);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('adminToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            if (editForm.status === 'Disbursed' && editingLead.status !== 'Disbursed') {
                const amount = parseFloat(editForm.disbursedAmount);
                if (!amount || amount <= 0) { alert('Please enter a valid disbursed loan amount.'); setUpdating(false); return; }
                if (editForm.comments !== (editingLead.admin_comments || '')) {
                    await fetch(`${apiBase}/api/leads/${editingLead.id}`, { method: 'PATCH', headers, body: JSON.stringify({ admin_comments: editForm.comments }) });
                }
                const res = await fetch(`${apiBase}/api/leads/${editingLead.id}/disburse`, { method: 'POST', headers, body: JSON.stringify({ disbursed_amount: amount }) });
                if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Failed to disburse' })); throw new Error(err.detail || 'Failed to disburse'); }
                const result = await res.json();
                alert(`Loan disbursed! Commission: ₹${result.ambassador_commission?.toLocaleString() || 0}, Company revenue: ₹${result.company_revenue?.toLocaleString() || 0}`);
            } else {
                const res = await fetch(`${apiBase}/api/leads/${editingLead.id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: editForm.status, admin_comments: editForm.comments }) });
                if (!res.ok) throw new Error('Failed to update lead');
            }
            setLeads(leads.map(l => l.id === editingLead.id ? { ...l, status: editForm.status, admin_comments: editForm.comments, disbursed_amount: editForm.status === 'Disbursed' ? parseFloat(editForm.disbursedAmount) : l.disbursed_amount } : l));
            fetchStats();
            if (editForm.status === 'Disbursed') fetchPayouts();
            setEditingLead(null);
        } catch (err: any) { alert(err.message || 'Failed to update lead'); } finally { setUpdating(false); }
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch(`${apiBase}/api/admin/leads/`, {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({
                    ...addLeadForm,
                    loan_requirement: parseFloat(addLeadForm.loan_requirement),
                    ambassador_id: addLeadForm.ambassador_id || null
                })
            });
            if (!res.ok) throw new Error('Failed to add lead');
            alert('Lead added successfully');
            setShowAddLead(false);
            fetchLeads();
            fetchStats();
        } catch (err: any) { alert(err.message); } finally { setAdding(false); }
    };

    const handleAddAmbassador = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch(`${apiBase}/api/ambassadors/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addAmbassadorForm)
            });
            if (!res.ok) throw new Error('Failed to add ambassador');
            alert('Ambassador added successfully');
            setShowAddAmbassador(false);
            fetchAmbassadors();
            fetchStats();
        } catch (err: any) { alert(err.message); } finally { setAdding(false); }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Are you sure you want to permanently DELETE this lead? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${apiBase}/api/admin/leads/${id}`, { method: 'DELETE', headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed to delete');
            setLeads(leads.filter(l => l.id !== id));
            fetchStats();
        } catch (err: any) { alert(err.message); }
    };

    const handleDeleteAmbassador = async (id: string) => {
        if (!confirm('Are you sure you want to DELETE this ambassador? All associated data will be removed.')) return;
        try {
            const res = await fetch(`${apiBase}/api/admin/ambassadors/${id}`, { method: 'DELETE', headers: getAdminHeaders() });
            if (!res.ok) throw new Error('Failed to delete');
            setAmbassadors(ambassadors.filter(a => a.id !== id));
            fetchStats();
        } catch (err: any) { alert(err.message); }
    };

    const sidebarItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Overview', active: activeTab === 'dashboard', onClick: () => setActiveTab('dashboard') },
        { icon: <List size={18} />, label: 'All Leads', active: activeTab === 'leads', onClick: () => setActiveTab('leads') },
        { icon: <Users size={18} />, label: 'Ambassadors', active: activeTab === 'ambassadors', onClick: () => setActiveTab('ambassadors') },
        { icon: <DollarSign size={18} />, label: 'Payouts', active: activeTab === 'payouts', onClick: () => setActiveTab('payouts') },
        { icon: <Settings size={18} />, label: 'Management', active: activeTab === 'management', onClick: () => setActiveTab('management') },
    ];

    const statusBadgeClass = (status: string) => {
        if (status === 'Disbursed' || status === 'Paid') return 'badge-success';
        if (status === 'Approved') return 'badge-accent';
        if (status === 'Rejected') return 'badge-danger';
        return 'badge-warning';
    };

    if (loading && !stats) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p>Loading Admin Dashboard...</p>
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {/* Edit Lead Modal */}
            {editingLead && (
                <div className="modal-overlay" onClick={() => setEditingLead(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Manage Lead: {editingLead.student_name}</h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Status</label>
                            <select className="select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Disbursed">Disbursed</option>
                            </select>
                            {editForm.status === 'Disbursed' && editingLead.status !== 'Disbursed' && (
                                <div style={{ marginTop: '0.75rem', padding: '1rem', borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-glow)' }}>
                                    <label className="label">Disbursed Loan Amount (₹)</label>
                                    <input className="input" type="number" value={editForm.disbursedAmount} onChange={(e) => setEditForm({ ...editForm, disbursedAmount: e.target.value })} placeholder="e.g. 1000000" min="0" />
                                    {editForm.disbursedAmount && parseFloat(editForm.disbursedAmount) > 0 && (
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>💰 Total Profit (1%): <strong>₹{(parseFloat(editForm.disbursedAmount) * 0.01).toLocaleString()}</strong></span>
                                            <span style={{ color: 'var(--success)' }}>🤝 Ambassador Commission (0.3%): <strong>₹{(parseFloat(editForm.disbursedAmount) * 0.003).toLocaleString()}</strong></span>
                                            <span style={{ color: 'var(--accent)' }}>🏢 Net Revenue (0.7%): <strong>₹{(parseFloat(editForm.disbursedAmount) * 0.007).toLocaleString()}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Admin Comments</label>
                            <textarea className="input" value={editForm.comments} onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })} placeholder="Add notes..." style={{ minHeight: 100, resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingLead(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateLead} disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            {viewingDocsLeadId && (
                <div className="modal-overlay" onClick={() => setViewingDocsLeadId(null)}>
                    <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Documents</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setViewingDocsLeadId(null)}>Close</button>
                        </div>
                        {loadingDocs ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading documents...</p>
                        ) : leadDocuments.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {leadDocuments.map((doc) => (
                                    <div key={doc.id} style={{ padding: '1rem', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.filename}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                <span className={`badge ${doc.status === 'Verified' ? 'badge-success' : doc.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ marginTop: '0.5rem' }}>
                                                    {doc.status || 'Pending'}
                                                </span>
                                            </div>
                                            <a href={`${apiBase}/api/documents/file/${doc.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View</a>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => updateDocStatus(doc.id, 'Verified')}>Verify</button>
                                            <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => updateDocStatus(doc.id, 'Rejected')}>Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Sidebar
                brandTitle="FinConnect"
                items={sidebarItems}
                user={{ name: 'Admin', role: 'Enterprise Admin' }}
                onLogout={() => { localStorage.removeItem('adminToken'); router.push('/admin/login'); }}
            />

            <main className="dashboard-main">
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    {/* Header Area with Notifications */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative', zIndex: 50 }}>
                        <NotificationCenter recipientType="admin" />
                    </div>

                    {error && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 12, color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}

                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && stats && (
                        <div className="animate-fade-in">
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 className="section-title">Executive Overview</h1>
                                <p className="section-subtitle">Monitoring real-time performance across all financial channels.</p>
                            </div>

                            <div className="stat-grid stagger-children" style={{ marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><TrendingUp size={22} /></div>
                                    <div className="stat-label">Total Revenue</div>
                                    <div className="stat-value">₹{stats.financials.revenue.toLocaleString()}</div>
                                    <span className="stat-trend up">↑ Active</span>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><FileText size={22} /></div>
                                    <div className="stat-label">Active Leads</div>
                                    <div className="stat-value">{stats.total_leads.toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}><Users size={22} /></div>
                                    <div className="stat-label">Ambassadors</div>
                                    <div className="stat-value">{stats.total_ambassadors}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}><DollarSign size={22} /></div>
                                    <div className="stat-label">Commission Paid</div>
                                    <div className="stat-value">₹{stats.financials.commission_distributed.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Financial Performance</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', textAlign: 'center' }}>
                                    <div>
                                        <p className="stat-label">Total Disbursed</p>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{stats.financials.disbursed.toLocaleString()}</p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                                        <p className="stat-label">Commission Paid</p>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{stats.financials.commission_distributed.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="stat-label">Net Revenue</p>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>₹{stats.financials.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Breakdown */}
                            <div className="card">
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Lead Status Breakdown</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {Object.entries(stats.status_breakdown).map(([status, count]) => (
                                        <div key={status} style={{ padding: '0.75rem 1.25rem', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', textAlign: 'center', minWidth: 100 }}>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{count}</p>
                                            <span className={`badge ${statusBadgeClass(status)}`}>{status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LEADS */}
                    {activeTab === 'leads' && (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h1 className="section-title">All Student Leads</h1>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input className="input" placeholder="Search leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.25rem', width: 240 }} />
                                    </div>
                                    <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 140 }}>
                                        <option value="All">All Status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Disbursed">Disbursed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Course</th>
                                            <th>Referral</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem' }}>
                                                            {lead.student_name.charAt(0)}
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{lead.student_name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>{lead.course}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{lead.loan_amount.toLocaleString()}</div>
                                                </td>
                                                <td>
                                                    <div>{lead.ambassador.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.ambassador.code}</div>
                                                </td>
                                                <td><span className={`badge ${statusBadgeClass(lead.status)}`}>{lead.status}</span></td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(lead)}>Edit</button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleViewDocuments(lead.id)}>Docs</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLead(lead.id)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredLeads.length === 0 && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leads found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* AMBASSADORS */}
                    {activeTab === 'ambassadors' && (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h1 className="section-title">Network Ambassadors</h1>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input className="input" placeholder="Search ambassadors..." value={ambassadorSearchQuery} onChange={(e) => setAmbassadorSearchQuery(e.target.value)} style={{ paddingLeft: '2.25rem', width: 260 }} />
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={fetchAmbassadors}>Refresh</button>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>College</th>
                                            <th>Code</th>
                                            <th>Leads</th>
                                            <th>Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAmbassadors.map((amb) => (
                                            <tr key={amb.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{amb.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{amb.email}</div>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{amb.college}</td>
                                                <td><span className="badge badge-accent">{amb.referral_code}</span></td>
                                                <td style={{ fontWeight: 600 }}>{amb.leads_generated}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{amb.total_earnings.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAmbassador(amb.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredAmbassadors.length === 0 && (
                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No ambassadors found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PAYOUTS */}
                    {activeTab === 'management' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Business Management</h2>
                            
                            {/* Management Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="card">
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Leads Management</h3>
                                    <button 
                                        className="btn btn-primary btn-sm w-full mb-3"
                                        onClick={() => setShowAddLead(true)}
                                    >
                                        + Add New Lead Manually
                                    </button>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a lead entry without an ambassador referral.</p>
                                </div>
                                <div className="card">
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Ambassador Network</h3>
                                    <button 
                                        className="btn btn-accent btn-sm w-full mb-3"
                                        onClick={() => setShowAddAmbassador(true)}
                                    >
                                        + Onboard New Ambassador
                                    </button>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invite a new partner to the referral program.</p>
                                </div>
                            </div>

                            {/* Add Lead Modal */}
                            {showAddLead && (
                                <div className="modal-overlay" onClick={() => setShowAddLead(false)}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add New Lead</h3>
                                        <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <input className="input" placeholder="Student Full Name" value={addLeadForm.student_name} onChange={e => setAddLeadForm({...addLeadForm, student_name: e.target.value})} required />
                                            <input className="input" placeholder="Course & University" value={addLeadForm.course_and_university} onChange={e => setAddLeadForm({...addLeadForm, course_and_university: e.target.value})} required />
                                            <input className="input" type="number" placeholder="Loan Amount (₹)" value={addLeadForm.loan_requirement} onChange={e => setAddLeadForm({...addLeadForm, loan_requirement: e.target.value})} required />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <input className="input" placeholder="Phone" value={addLeadForm.phone_number} onChange={e => setAddLeadForm({...addLeadForm, phone_number: e.target.value})} required />
                                                <input className="input" type="email" placeholder="Email" value={addLeadForm.email} onChange={e => setAddLeadForm({...addLeadForm, email: e.target.value})} required />
                                            </div>
                                            <input className="input" placeholder="Current City" value={addLeadForm.current_city} onChange={e => setAddLeadForm({...addLeadForm, current_city: e.target.value})} required />
                                            <select className="select" value={addLeadForm.ambassador_id} onChange={e => setAddLeadForm({...addLeadForm, ambassador_id: e.target.value})}>
                                                <option value="">Direct (No Ambassador)</option>
                                                {ambassadors.map(a => (
                                                    <option key={a.id} value={a.id}>{a.full_name} ({a.referral_code})</option>
                                                ))}
                                            </select>
                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddLead(false)}>Cancel</button>
                                                <button type="submit" className="btn btn-primary" disabled={adding}>{adding ? 'Adding...' : 'Add Lead'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Add Ambassador Modal */}
                            {showAddAmbassador && (
                                <div className="modal-overlay" onClick={() => setShowAddAmbassador(false)}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Onboard Ambassador</h3>
                                        <form onSubmit={handleAddAmbassador} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <input className="input" placeholder="Full Name" value={addAmbassadorForm.full_name} onChange={e => setAddAmbassadorForm({...addAmbassadorForm, full_name: e.target.value})} required />
                                            <input className="input" type="email" placeholder="Email Address" value={addAmbassadorForm.email} onChange={e => setAddAmbassadorForm({...addAmbassadorForm, email: e.target.value})} required />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <input className="input" placeholder="Phone" value={addAmbassadorForm.phone_number} onChange={e => setAddAmbassadorForm({...addAmbassadorForm, phone_number: e.target.value})} required />
                                                <input className="input" placeholder="Referral Code" value={addAmbassadorForm.referral_code} onChange={e => setAddAmbassadorForm({...addAmbassadorForm, referral_code: e.target.value})} required />
                                            </div>
                                            <input className="input" placeholder="College Name" value={addAmbassadorForm.college_name} onChange={e => setAddAmbassadorForm({...addAmbassadorForm, college_name: e.target.value})} required />
                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddAmbassador(false)}>Cancel</button>
                                                <button type="submit" className="btn btn-accent" disabled={adding}>{adding ? 'Creating...' : 'Create Ambassador'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Administrative Controls</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure high-level business logic and system parameters.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Loan Commission Logic</h4>
                                        <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem' }}>Company Revenue (%)</span>
                                                <input type="number" step="0.01" className="input" style={{ width: '80px', padding: '0.25rem 0.5rem', textAlign: 'right' }} value={settings.company_revenue_rate} onChange={e => setSettings({...settings, company_revenue_rate: parseFloat(e.target.value)})} required />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem' }}>Ambassador Comm (%)</span>
                                                <input type="number" step="0.01" className="input" style={{ width: '80px', padding: '0.25rem 0.5rem', textAlign: 'right' }} value={settings.ambassador_commission_rate} onChange={e => setSettings({...settings, ambassador_commission_rate: parseFloat(e.target.value)})} required />
                                            </div>
                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 700 }}>Total Service Fee</span>
                                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{(settings.company_revenue_rate + settings.ambassador_commission_rate).toFixed(2)}%</span>
                                            </div>
                                            <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={updatingSettings}>{updatingSettings ? 'Updating...' : 'Save Changes'}</button>
                                        </form>
                                    </div>
                                    <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Action Center</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleExportCsv}>Bulk Export Leads & Data (.csv)</button>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled>Reset Test Data (Disabled)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security / Change Password */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Security — Change Admin Password</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>After changing, you will be logged out automatically.</p>
                                    </div>
                                </div>
                                <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', maxWidth: 700 }}>
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
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pwLoading}>
                                            {pwLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                                {pwMessage && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: 10, background: pwMessage.ok ? 'var(--success-soft)' : 'var(--danger-soft)', color: pwMessage.ok ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem', maxWidth: 700 }}>
                                        {pwMessage.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'payouts' && (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h1 className="section-title">Commission Payouts</h1>
                                <button className="btn btn-ghost btn-sm" onClick={fetchPayouts}>Refresh</button>
                            </div>

                            <div className="table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
                                <table className="table">
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                                        <tr>
                                            <th>Ambassador</th>
                                            <th>Lead</th>
                                            <th style={{ textAlign: 'right' }}>Loan Amt</th>
                                            <th style={{ textAlign: 'right' }}>Profit (1%)</th>
                                            <th style={{ textAlign: 'right' }}>Commission</th>
                                            <th style={{ textAlign: 'right' }}>Net Revenue</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((payout) => (
                                            <tr key={payout.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{payout.ambassador.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payout.ambassador.email}</div>
                                                </td>
                                                <td>
                                                    <div>{payout.lead.student_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payout.lead.course}</div>
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{payout.disbursed_amount?.toLocaleString() || '—'}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{((payout.disbursed_amount || 0) * 0.01).toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>₹{payout.amount?.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>₹{payout.company_revenue?.toLocaleString() || '—'}</td>
                                                <td><span className={`badge ${statusBadgeClass(payout.status)}`}>{payout.status}</span></td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {new Date(payout.date).toLocaleDateString()}
                                                    {payout.paid_date && <div style={{ fontSize: '0.7rem' }}>Paid: {new Date(payout.paid_date).toLocaleDateString()}</div>}
                                                </td>
                                                <td>
                                                    {payout.status === 'Pending' ? (
                                                        <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(payout.id)}>Mark Paid</button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {payouts.length === 0 && (
                                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payouts found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: repeat(3"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
