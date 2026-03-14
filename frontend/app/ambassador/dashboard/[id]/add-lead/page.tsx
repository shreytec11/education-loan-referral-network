"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, BookOpen, DollarSign, ArrowLeft, Loader2 } from 'lucide-react';

export default function AddLead({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const ambassadorId = resolvedParams.id;
    const router = useRouter();

    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        student_name: '',
        contact_email: '',
        contact_phone: '',
        course_and_university: '',
        loan_requirement: '',
    });

    useEffect(() => {
        const fetchAmbassador = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ambassadors/${ambassadorId}`);
                if (!res.ok) throw new Error('Failed to verify ambassador');
                const data = await res.json();
                setReferralCode(data.referral_code);
            } catch (err) {
                setError('Invalid Ambassador ID. Please login again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAmbassador();
    }, [ambassadorId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/leads/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    loan_requirement: parseFloat(formData.loan_requirement),
                    referral_code: referralCode
                }),
            });

            if (!res.ok) throw new Error('Failed to submit lead');

            // Redirect back to dashboard
            router.push(`/ambassador/dashboard/${ambassadorId}`);
        } catch (err) {
            setError('Failed to create lead. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-lg shadow-sm">
                <div className="flex items-center mb-6">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 mr-4">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900">Add New Lead</h2>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Student Name</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                name="student_name"
                                required
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md p-2 border"
                                placeholder="Student Full Name"
                                value={formData.student_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email Address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                name="contact_email"
                                required
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md p-2 border"
                                placeholder="student@example.com"
                                value={formData.contact_email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                name="contact_phone"
                                required
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md p-2 border"
                                placeholder="+91 9876543210"
                                value={formData.contact_phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Course & University</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BookOpen className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                name="course_and_university"
                                required
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md p-2 border"
                                placeholder="MBA at University of Oxford"
                                value={formData.course_and_university}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Loan Requirement (₹)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="number"
                                name="loan_requirement"
                                required
                                min="0"
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md p-2 border"
                                placeholder="2500000"
                                value={formData.loan_requirement}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-700">
                            This lead will be automatically tagged to you (<strong>{referralCode}</strong>).
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${submitting ? 'bg-slate-400' : 'bg-blue-900 hover:bg-blue-800'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Lead'}
                    </button>
                </form>
            </div>
        </div>
    );
}
