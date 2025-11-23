import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Last Updated: November 23, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-gray-700 dark:text-gray-300">

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            1. Introduction
                        </h2>
                        <p>
                            This Privacy Policy explains how PDF Together ("we", "our", or "the Service") collects, uses, and protects your information when you use our Discord Activity. We are committed to protecting your privacy and being transparent about our data practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            2. Information We Collect
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                            2.1 Discord Authentication Data
                        </h3>
                        <p className="mb-2">When you use PDF Together through Discord, we collect:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Discord User ID</li>
                            <li>Discord Username</li>
                            <li>Discord Avatar</li>
                            <li>Discord Discriminator</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                            2.2 Content Data
                        </h3>
                        <p className="mb-2">We store the following content you create:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>PDF files you upload</li>
                            <li>Annotations, highlights, and drawings you create</li>
                            <li>Chat messages sent within the Activity</li>
                            <li>Session metadata (timestamps, room IDs)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                            2.3 Usage Data
                        </h3>
                        <p className="mb-2">We automatically collect:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Connection logs (IP addresses, timestamps)</li>
                            <li>Feature usage statistics</li>
                            <li>Error logs and diagnostics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            3. How We Use Your Information
                        </h2>
                        <p className="mb-2">We use collected information to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Provide and maintain the Service</li>
                            <li>Enable real-time collaboration features</li>
                            <li>Store and retrieve your uploaded content</li>
                            <li>Improve and optimize the Service</li>
                            <li>Debug and fix technical issues</li>
                            <li>Prevent abuse and ensure security</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            4. Third-Party Services
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                            4.1 Discord
                        </h3>
                        <p>
                            This Service integrates with Discord and uses Discord's OAuth2 for authentication. Please review Discord's Privacy Policy for information about how Discord handles your data.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                            4.2 Google Gemini AI
                        </h3>
                        <p>
                            When you use AI features (summarization, explanation), your selected text is sent to Google's Gemini API for processing. Please review Google's Privacy Policy for information about how Google handles AI requests.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            5. Data Storage and Security
                        </h2>
                        <p className="mb-2">
                            We implement reasonable security measures to protect your data:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Data is stored in a SQLite database on our servers</li>
                            <li>WebSocket connections use secure protocols</li>
                            <li>Access to uploaded content is restricted to authorized users</li>
                            <li>Regular backups are performed to prevent data loss</li>
                        </ul>
                        <p className="mt-3">
                            However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            6. Data Retention
                        </h2>
                        <p>
                            We retain your data as follows:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li><strong>Uploaded PDFs:</strong> Until you delete them or after 90 days of inactivity</li>
                            <li><strong>Annotations:</strong> Stored with the associated PDF</li>
                            <li><strong>Chat messages:</strong> Stored for the duration of the session</li>
                            <li><strong>Logs:</strong> Retained for up to 30 days for debugging purposes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            7. Your Rights
                        </h2>
                        <p className="mb-2">You have the right to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Access your data stored in the Service</li>
                            <li>Delete your uploaded content at any time</li>
                            <li>Request deletion of your account data</li>
                            <li>Opt out of using AI features</li>
                            <li>Stop using the Service at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            8. Children's Privacy
                        </h2>
                        <p>
                            PDF Together is designed for users who meet Discord's minimum age requirements (13+ in most regions, 16+ in Europe). We do not knowingly collect information from children under these age limits.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            9. International Data Transfers
                        </h2>
                        <p>
                            Your data may be transferred to and processed in countries other than your own. By using the Service, you consent to such transfers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            10. Changes to This Policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last Updated" date at the top of this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            11. Contact Us
                        </h2>
                        <p>
                            If you have questions about this Privacy Policy or want to exercise your rights, please contact us through our Discord server or GitHub repository.
                        </p>
                    </section>

                    <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            By using PDF Together, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
