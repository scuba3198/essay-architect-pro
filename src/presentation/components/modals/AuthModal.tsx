import type { User } from '@supabase/supabase-js';
import { ArrowRight, Loader2, Lock, LogIn, Mail, UserPlus, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { generateSecureToken } from '../../../infrastructure/security/crypto-utils';
import { registerSession } from '../../../application/session/sessionManager';
import { supabase } from '../../../infrastructure/db/supabase';

type AuthMode = 'login' | 'signup' | 'forgot_password' | 'update_password';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: AuthMode;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Note: Turnstile bot protection is only used for anonymous AI requests.
      // Login/signup uses Supabase's built-in email verification and rate limiting for security.
      // This prevents network blocking issues (corporate firewalls, etc.) from preventing authentication.

      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage(
          'Sign up successful! Please check your email (including spam folder) for a verification link.',
        );
        setMode('login');
      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Register session for session management
        const sessionToken =
          data.session?.access_token?.substring(0, 32) || generateSecureToken(16);
        await registerSession(data.user.id, sessionToken);

        if (onAuthSuccess) onAuthSuccess(data.user);
        onClose();
      } else if (mode === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setMessage(
          'Password reset link sent! Please check your email (including spam folder) and click the link to reset your password.',
        );
      } else if (mode === 'update_password') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });
        if (updateError) throw updateError;
        setMessage('Password updated successfully! You will be redirected shortly.');
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
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const message =
        err instanceof Error ? err.message : 'An error occurred during authentication.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot_password':
        return 'Reset Password';
      case 'update_password':
        return 'Update Password';
      default:
        return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Log in to access your premium features.';
      case 'signup':
        return 'Sign up to start your architect journey.';
      case 'forgot_password':
        return 'Enter your email to receive a reset link.';
      case 'update_password':
        return 'Enter your new password below.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-stone-900/95 overflow-y-auto animate-in fade-in duration-300">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-sm w-full p-8 relative my-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors z-10"
          >
            <X size={24} strokeWidth={3} />
          </button>

          <div className="text-center mb-8">
            <div className="bg-stone-900 text-white w-12 h-12 flex items-center justify-center font-serif font-black text-2xl mx-auto mb-4">
              E
            </div>
            <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight italic">
              {getTitle()}
            </h2>
            <p className="text-xs text-stone-500 mt-2 font-medium">{getDescription()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                    size={18}
                  />
                  <input
                    id="auth-fullname"
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
                <label
                  htmlFor="auth-email"
                  className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                    size={18}
                  />
                  <input
                    id="auth-email"
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
                <div className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest flex justify-between items-center">
                  <label htmlFor="auth-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[9px] text-stone-500 hover:text-stone-900 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                    size={18}
                  />
                  <input
                    id="auth-password"
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
                <label
                  htmlFor="auth-confirm"
                  className="text-[10px] font-black uppercase text-stone-400 mb-1 block tracking-widest"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                    size={18}
                  />
                  <input
                    id="auth-confirm"
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
                <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-wider">
                  {error}
                </p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3">
                <p className="text-[10px] text-green-600 font-bold leading-tight uppercase tracking-wider">
                  {message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-900 text-white py-4 font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-stone-900 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Login'}
                  {mode === 'signup' && 'Sign Up'}
                  {mode === 'forgot_password' && 'Send Reset Link'}
                  {mode === 'update_password' && 'Update Password'}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            {mode !== 'update_password' && (
              <>
                <p className="text-xs text-stone-500 font-medium mb-4">
                  {mode === 'login'
                    ? "Don't have an account?"
                    : mode === 'signup'
                      ? 'Already have an account?'
                      : 'Remembered your password?'}
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
