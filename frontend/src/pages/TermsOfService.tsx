import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span>Back to Home</span>
                    </button>

                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Terms of Service
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Last Updated: November 23, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-gray-700 dark:text-gray-300">

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing and using PDF Together ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            2. Description of Service
                        </h2>
                        <p>
                            PDF Together is a Discord Activity that provides real-time collaborative PDF reading, annotation, and AI-powered assistance features. The Service allows users to:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Upload and view PDF documents</li>
                            <li>Collaborate with other Discord users in real-time</li>
                            <li>Add annotations, highlights, and drawings</li>
                            <li>Use AI-powered features for document summarization and explanation</li>
                            <li>Chat with other participants</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            3. User Responsibilities
                        </h2>
                        <p className="mb-2">You agree to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Provide accurate information when using the Service</li>
                            <li>Only upload content you have the right to share</li>
                            <li>Not use the Service for any illegal or unauthorized purpose</li>
                            <li>Not upload malicious files or content that violates Discord's Terms of Service</li>
                            <li>Respect other users and maintain a positive environment</li>
                            <li>Not attempt to reverse engineer, decompile, or hack the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            4. Content Ownership and Rights
                        </h2>
                        <p>
                            You retain all rights to the content you upload to PDF Together. By uploading content, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service. We do not claim ownership of your content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            5. AI Features
                        </h2>
                        <p>
                            The Service uses Google's Gemini AI to provide summarization and explanation features. By using AI features, you acknowledge that:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>AI responses may not always be accurate</li>
                            <li>Content sent to AI features may be processed by third-party AI providers</li>
                            <li>You should verify important information independently</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            6. Data Storage and Deletion
                        </h2>
                        <p>
                            Uploaded PDFs and annotations are stored on our servers. You can delete your content at any time through the Service interface. We reserve the right to delete inactive content after a reasonable period.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            7. Limitation of Liability
                        </h2>
                        <p>
                            PDF Together is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to data loss, service interruptions, or inaccurate AI responses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            8. Service Modifications
                        </h2>
                        <p>
                            We reserve the right to modify, suspend, or discontinue the Service at any time without prior notice. We may also update these Terms of Service periodically.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            9. Discord Integration
                        </h2>
                        <p>
                            This Service is a Discord Activity and requires Discord authentication. By using the Service, you also agree to Discord's Terms of Service and Community Guidelines.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            10. Contact Information
                        </h2>
                        <p>
                            If you have questions about these Terms of Service, please contact us through our Discord server or GitHub repository.
                        </p>
                    </section>

                    <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            By using PDF Together, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
