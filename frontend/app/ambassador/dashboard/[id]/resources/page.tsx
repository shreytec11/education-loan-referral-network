"use client";

import { use } from 'react';
import { FileText, MessageCircle, Download, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResourcesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const scripts = [
        {
            title: "WhatsApp Message for Class Group",
            content: "Hey everyone! 👋 If anyone is looking for an education loan for their studies, I can help you get the best rates from top banks (SBI, HDFC, etc.) through Campus Finance. It's completely digital and faster than going to the bank directly. DM me for more info or apply here: [YOUR_LINK]"
        },
        {
            title: "LinkedIn/Twitter Post",
            content: "Excited to share that I'm partnering with Campus Finance to help students secure hassle-free education loans! 🎓💸\n\n✅ 100% Digital Process\n✅ Best Interest Rates\n✅ Quick Sanction\n\nIf you're planning for higher studies, check this out: [YOUR_LINK] #EducationLoan #StudyAbroad #Finance"
        },
        {
            title: "Quick Pitch to Friends",
            content: "Bro, don't run around banks for a loan. I can get your application processed online directly with top lenders. Just use my link and the team will contact you."
        }
    ];

    const faqs = [
        {
            q: "Is there any processing fee?",
            a: "No, applying through Campus Finance is completely free for students."
        },
        {
            q: "Which banks are available?",
            a: "We partner with major public and private banks including SBI, BOB, HDFC, ICICI, and NBFCs like HDFC Credila and Avanse."
        },
        {
            q: "How long does sanction take?",
            a: "It depends on the bank, but our digital process usually speeds it up by 3-5 days compared to offline applications."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center">
                    <Link href={`/ambassador/dashboard/${id}`} className="mr-4 text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Ambassador Resources</h1>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Marketing Scripts */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <MessageCircle className="h-6 w-6 text-indigo-600 mr-2" />
                            <h2 className="text-xl font-semibold text-gray-800">Pitch Scripts</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Copy and paste these messages for your social networks.</p>

                        <div className="space-y-6">
                            {scripts.map((script, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-2">{script.title}</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{script.content}</p>
                                    <button
                                        className="mt-3 text-xs text-indigo-600 font-medium hover:text-indigo-800"
                                        onClick={() => navigator.clipboard.writeText(script.content)}
                                    >
                                        Click to Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Process Guide */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <FileText className="h-6 w-6 text-green-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800">How it Works</h2>
                            </div>
                            <ol className="list-decimal list-inside space-y-3 text-gray-600">
                                <li><strong>Share your Link:</strong> Send your unique referral link to students.</li>
                                <li><strong>Student Applies:</strong> They fill out a basic form using your link.</li>
                                <li><strong>Verification:</strong> Our team verifies the loan requirement.</li>
                                <li><strong>Sanction:</strong> Loan gets sanctioned and disbursed.</li>
                                <li><strong>You Earn:</strong> You receive commission on the disbursed amount!</li>
                            </ol>
                        </div>

                        {/* FAQs */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <HelpCircle className="h-6 w-6 text-orange-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800">Common FAQs</h2>
                            </div>
                            <div className="space-y-4">
                                {faqs.map((item, idx) => (
                                    <div key={idx}>
                                        <p className="text-sm font-medium text-gray-900">{item.q}</p>
                                        <p className="text-sm text-gray-600 mt-1">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Downloads */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <Download className="h-6 w-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800">Assets</h2>
                            </div>
                            <div className="space-y-3">
                                <button disabled className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50">
                                    <span>Marketing Poster (PDF)</span>
                                    <Download className="h-4 w-4" />
                                </button>
                                <button disabled className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50">
                                    <span>Instagram Story Template</span>
                                    <Download className="h-4 w-4" />
                                </button>
                                <p className="text-xs text-gray-400 text-center mt-2">Downloads coming soon!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
