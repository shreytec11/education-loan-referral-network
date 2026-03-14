"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function LeadForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [formData, setFormData] = useState({
        student_name: '',
        contact_email: '',
        contact_phone: '',
        course_and_university: '',
        loan_requirement: '',
        referral_code: '',
    });

    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // Auto-populate from URL params (from Eligibility calculator or referral links)
        const ref = searchParams.get('ref');
        const name = searchParams.get('name');
        const course = searchParams.get('course');
        const amount = searchParams.get('amount');
        
        setFormData(prev => ({ 
            ...prev, 
            referral_code: ref || prev.referral_code,
            student_name: name || prev.student_name,
            course_and_university: course || prev.course_and_university,
            loan_requirement: amount || prev.loan_requirement,
        }));
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Strict Validation
        if (!formData.student_name.trim() || !formData.contact_email.trim() || !formData.contact_phone.trim() || !formData.course_and_university.trim() || !formData.loan_requirement.toString().trim()) {
            setStatus("error");
            setErrorMessage("Please fill in all the required fields.");
            return;
        }

        setStatus("submitting");
        setErrorMessage("");

        try {
            const data = await api.post('/api/leads/', {
                ...formData,
                loan_requirement: parseFloat(formData.loan_requirement),
            }) as { id: string; student_name: string };

            // Auto-login: save student credentials and redirect to dashboard
            localStorage.setItem('studentId', data.id);
            localStorage.setItem('studentName', data.student_name);

            setStatus("success");

            // Redirect to home page after a brief delay
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setErrorMessage(error.message || "Failed to submit application. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--success-soft)', borderRadius: 12, border: '1px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle className="h-12 w-12" style={{ color: 'var(--success)' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>Application Received!</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Thank you! Redirecting to the home page...</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: 'var(--success)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Your Application Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <FormField label="Full Name" name="student_name" value={formData.student_name} onChange={handleChange} required />
                <FormField label="Email Address" name="contact_email" value={formData.contact_email} onChange={handleChange} required type="email" />
                <FormField label="Phone Number" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required type="tel" />
                <FormField label="Course & University" name="course_and_university" value={formData.course_and_university} onChange={handleChange} required placeholder="e.g. MBA, Harvard" />
                <FormField label="Loan Requirement (INR)" name="loan_requirement" value={formData.loan_requirement} onChange={handleChange} required type="number" />

                <div>
                    <label className="label">Referral Code (Optional)</label>
                    <input
                        type="text"
                        name="referral_code"
                        value={formData.referral_code}
                        onChange={handleChange}
                        className="input"
                    />
                </div>

                {status === "error" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', background: 'var(--danger-soft)', padding: '0.75rem', borderRadius: 8, fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <AlertCircle className="h-4 w-4" />
                        {errorMessage}
                    </div>
                )}

                <button
                    disabled={status === "submitting"}
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                >
                    {status === "submitting" ? "Submitting..." : "Submit Application"}
                    {!status && <ArrowRight className="ml-2 h-5 w-5" />}
                </button>
            </div>
        </form>
    );
}

function FormField({ label, name, value, onChange, required = false, type = "text", placeholder = "" }: any) {
    return (
        <div>
            <label className="label">{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
            <input
                required={required}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="input"
            />
        </div>
    );
}
