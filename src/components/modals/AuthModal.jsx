import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AuthModal = ({ onClose, onAuthSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                alert("Sign up successful! Please check your email for verification.");
                setMode('login');
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                if (onAuthSuccess) onAuthSuccess(data.user);
                onClose();
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-stone-900/95 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-sm w-full p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors">
                    <X size={24} strokeWidth={3} />
                </button>

                <div className="text-center mb-8">
                    <div className="bg-stone-900 text-white w-12 h-12 flex items-center justify-center font-serif font-black text-2xl mx-auto mb-4">
                        E
                    </div>
                    <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight italic">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-2 font-medium">
                        {mode === 'login' ? 'Log in to access your premium features.' : 'Sign up to start your architect journey.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-white border-2 border-stone-900 p-3 pl-10 text-sm outline-none focus:bg-yellow-50 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white border-2 border-stone-900 p-3 pl-10 text-sm outline-none focus:bg-yellow-50 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3">
                            <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-stone-900 text-white py-4 font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-stone-900 transition-all flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                {mode === 'login' ? 'Login' : 'Sign Up'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-stone-200 text-center">
                    <p className="text-xs text-stone-500 font-medium mb-4">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors"
                    >
                        {mode === 'login' ? (
                            <>
                                <UserPlus size={14} /> Create Account
                            </>
                        ) : (
                            <>
                                <LogIn size={14} /> Log In Instead
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
