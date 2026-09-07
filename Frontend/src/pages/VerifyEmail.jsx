import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        let isMounted = true;
        let hasVerified = false; // Add this flag

        const verifyToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                if (isMounted) {
                    setStatus('error');
                    setMessage('No verification token found. Please check your email link.');
                }
                return;
            }

            // Prevent multiple calls
            if (hasVerified) return;
            hasVerified = true;

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/verify-email?token=${token}`);

                if (isMounted) {
                    setStatus('success');
                    setMessage(response.data.message);
                }
            } catch (err) {
                if (isMounted) {
                    setStatus('error');
                    setMessage(err.response?.data?.message || 'Verification failed or link expired.');
                }
            }
        };

        verifyToken();
        return () => { isMounted = false; };
    }, [searchParams]);
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Decorative Elements to match Login */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl text-center">

                {/* Brand Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white italic tracking-tighter" style={{ fontFamily: 'serif' }}>
                        MoraHMS
                    </h1>
                    <div className="h-1 w-10 bg-white/40 mx-auto my-3 rounded-full"></div>
                </div>

                {/* State: Verifying */}
                {status === 'verifying' && (
                    <div className="space-y-6 animate-pulse">
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 text-white animate-spin" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Verifying Account...</h2>
                        <p className="text-white/70 text-sm">Please wait while we secure your clinical access.</p>
                    </div>
                )}

                {/* State: Success */}
                {status === 'success' && (
                    <div className="space-y-6 animate-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="bg-emerald-500/20 p-4 rounded-full">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Complete!</h2>
                        <p className="text-white/70 text-sm leading-relaxed">
                            {message}
                        </p>
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl group"
                        >
                            Proceed to Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}

                {/* State: Error */}
                {status === 'error' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-center">
                            <div className="bg-rose-500/20 p-4 rounded-full">
                                <XCircle className="w-16 h-16 text-rose-400" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Oops!</h2>
                        <p className="text-white/70 text-sm leading-relaxed">
                            {message}
                        </p>
                        <div className="pt-4 space-y-3">
                            <Link
                                to="/login"
                                className="block w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all"
                            >
                                Back to Login
                            </Link>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                                Contact Support if the issue persists
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-10">
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">AMT Hospital Systems</p>
                </div>
            </div>
        </div>
    );
}