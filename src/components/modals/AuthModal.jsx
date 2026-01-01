import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AuthModal = ({ onClose, onAuthSuccess, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot_password', 'update_password'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [messsage, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (signUpError) throw signUpError;
                alert("Sign up successful! Please check your email (including spam folder) for verification.");
                setMode('login');
            } else if (mode === 'login') {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                if (onAuthSuccess) onAuthSuccess(data.user);
                onClose();
            } else if (mode === 'forgot_password') {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (resetError) throw resetError;
                setMessage("Password reset link sent! Please check your email and click the link to reset your password.");
            } else if (mode === 'update_password') {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error: updateError } = await supabase.auth.updateUser({
                    password: password
                });
                if (updateError) throw updateError;
                setMessage("Password updated successfully! You will be redirected shortly.");
                setTimeout(() => {
                    setMode('login');
                    onClose();
                    // Implicitly logged in by Supabase after password update usually,
                    // but triggering success might be good.
                    // However, updateUser returns user data too.
                    // Let's grab user and notify success.
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user && onAuthSuccess) onAuthSuccess(user);
                    });
                }, 2000);
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Welcome Back';
            case 'signup': return 'Create Account';
            case 'forgot_password': return 'Reset Password';
            case 'update_password': return 'Update Password';
            default: return 'Authentication';
        }
    };

    const getDescription = () => {
        switch (mode) {
            case 'login': return 'Log in to access your premium features.';
            case 'signup': return 'Sign up to start your architect journey.';
            case 'forgot_password': return 'Enter your email to receive a reset link.';
            case 'update_password': return 'Enter your new password below.';
            default: return '';
        }
    };

    return (
        <div
            className="fixed inset-0 z-[130] bg-stone-900/95 overflow-y-auto animate-in fade-in duration-300"
        >
            <div
                className="flex min-h-full items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-sm w-full p-8 relative my-8">
                    <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors z-10">
                        <X size={24} strokeWidth={3} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="bg-stone-900 text-white w-12 h-12 flex items-center justify-center font-serif font-black text-2xl mx-auto mb-4">
                            E
                        </div>
                        <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight italic">
                            {getTitle()}
                        </h2>
                        <p className="text-xs text-stone-500 mt-2 font-medium">
                            {getDescription()}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest">Full Name</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-white border-2 border-stone-900 p-3 pl-10 text-sm outline-none focus:bg-yellow-50 transition-colors"
                                        required={mode === 'signup'}
                                    />
                                </div>
                            </div>
                        )}

                        {(mode === 'login' || mode === 'signup' || mode === 'forgot_password') && (
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
                        )}

                        {(mode === 'login' || mode === 'signup' || mode === 'update_password') && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest flex justify-between items-center">
                                    <span>Password</span>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => setMode('forgot_password')}
                                            className="text-[9px] text-stone-500 hover:text-stone-900 hover:underline"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </label>
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
                        )}

                        {(mode === 'signup' || mode === 'update_password') && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white border-2 border-stone-900 p-3 pl-10 text-sm outline-none focus:bg-yellow-50 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3">
                                <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        {messsage && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-3">
                                <p className="text-[10px] text-green-600 font-bold leading-tight uppercase tracking-wider">{messsage}</p>
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
                                    {mode === 'login' && 'Login'}
                                    {mode === 'signup' && 'Sign Up'}
                                    {mode === 'forgot_password' && 'Send Reset Link'}
                                    {mode === 'update_password' && 'Update Password'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-stone-200 text-center">
                        {mode !== 'update_password' && (
                            <>
                                <p className="text-xs text-stone-500 font-medium mb-4">
                                    {mode === 'login' ? "Don't have an account?" : (mode === 'signup' ? "Already have an account?" : "Remembered your password?")}
                                </p>
                                <button
                                    onClick={() => {
                                        if (mode === 'login') setMode('signup');
                                        else setMode('login');
                                    }}
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
