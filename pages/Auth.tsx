import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth as useClerkAuth, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';

import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import VerifyForm from '../components/auth/VerifyForm';
import RecoveryForm from '../components/auth/RecoveryForm';
import { loadDashboardPage } from './loadDashboard';

type ScreenMode =
    | 'login'
    | 'signup'
    | 'signup_verify'
    | 'forgot_request'
    | 'forgot_code'
    | 'forgot_password'
    | 'sso_callback';

type FieldErrors = Record<string, string>;
const AUTH_REQUEST_TIMEOUT_MS = 15000;

const getCurrentOrigin = () => {
    if (typeof window === 'undefined') return 'unknown-origin';
    return window.location.origin;
};

const isTimeoutError = (message: string) => message.toLowerCase().includes('timed out after 15 seconds');

const Auth: React.FC = () => {
    const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    const clerk = useClerk();
    const { isLoaded: authLoaded, isSignedIn } = useClerkAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isLoaded: signInLoaded, signIn } = useSignIn();
    const { isLoaded: signUpLoaded, signUp } = useSignUp();

    const requestedMode = useMemo<ScreenMode>(() => {
        const mode = searchParams.get('mode');
        if (mode === 'signup') return 'signup';
        if (mode === 'forgot') return 'forgot_request';
        if (mode === 'sso-callback') return 'sso_callback';
        return 'login';
    }, [searchParams]);

    const [mode, setMode] = useState<ScreenMode>(requestedMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
    const hasHandledSso = useRef(false);
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    const withTimeout = async <T,>(promise: Promise<T>, action: string): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
            return await Promise.race([
                promise,
                new Promise<T>((_, reject) => {
                    timer = setTimeout(() => {
                        reject(new Error(`${action} timed out after 15 seconds at ${getCurrentOrigin()}. Check your Clerk key, allowed origin, and network connection, then try again.`));
                    }, AUTH_REQUEST_TIMEOUT_MS);
                })
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    };

    const reportAuthError = (action: string, err: any) => {
        const normalizedMessage = normalizeError(err);

        if (import.meta.env.DEV) {
            console.error(`[Auth] ${action} failed`, {
                message: normalizedMessage,
                origin: getCurrentOrigin(),
                authLoaded,
                signInLoaded,
                signUpLoaded,
                clerkLoaded: clerk.loaded,
                hasPublishableKey: Boolean(publishableKey)
            });
        }

        setError(normalizedMessage);
    };

    useEffect(() => {
        if (mode === 'signup_verify' || mode === 'forgot_code' || mode === 'forgot_password') return;
        setMode(requestedMode);
    }, [requestedMode, mode]);

    useEffect(() => {
        if (!authLoaded || !isSignedIn || mode === 'sso_callback') return;
        navigate('/dashboard', { replace: true });
    }, [authLoaded, isSignedIn, mode, navigate]);

    useEffect(() => {
        if (mode !== 'sso_callback') {
            hasHandledSso.current = false;
            return;
        }
        if (!clerk.loaded || !signInLoaded || !signUpLoaded || hasHandledSso.current) return;

        hasHandledSso.current = true;

        const finishToApp = async () => {
            void loadDashboardPage();
            navigate('/dashboard', { replace: true });
        };

        const run = async () => {
            try {
                if (signIn.status === 'complete') {
                    await withTimeout(clerk.setActive({ session: signIn.createdSessionId }), 'Sign-in finalization');
                    await finishToApp();
                    return;
                }

                if (clerk.session) {
                    await finishToApp();
                    return;
                }

                if (signIn.status === 'needs_new_password') {
                    setMode('forgot_password');
                    return;
                }

                setMode('login');
                setSearchParams({});
            } catch (err: any) {
                reportAuthError('sso_callback', err);
                setMode('login');
                setSearchParams({});
            }
        };

        void run();
    }, [mode, clerk, signIn, signUp, signInLoaded, signUpLoaded, navigate, setSearchParams]);

    const setRouteMode = (next: 'login' | 'signup' | 'forgot') => {
        setError(null);
        setFieldErrors(null);
        if (next === 'signup') {
            setMode('signup');
            setSearchParams({ mode: 'signup' });
            return;
        }
        if (next === 'forgot') {
            setMode('forgot_request');
            setSearchParams({ mode: 'forgot' });
            return;
        }
        setMode('login');
        setSearchParams({});
    };

    const finishToApp = async () => {
        void loadDashboardPage();
        navigate('/dashboard', { replace: true });
    };
    const clearFormErrors = () => {
        setError(null);
        setFieldErrors(null);
    };

    const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signInLoaded || !signIn) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        const errors: FieldErrors = {};
        if (!email.trim()) errors.email = 'Email needed.';
        else if (!isValidEmail(email)) errors.email = 'Enter a valid email.';
        if (!password) errors.password = 'Password needed.';
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            const result = await withTimeout(signIn.create({
                identifier: email,
                password
            }), 'Sign in');

            if (result.status === 'complete') {
                await withTimeout(clerk.setActive({ session: result.createdSessionId }), 'Session activation');
                await finishToApp();
                return;
            }

            if (result.status === 'needs_new_password') {
                setMode('forgot_password');
                return;
            }

            setError('Signing in needs an extra step.');
        } catch (err: any) {
            reportAuthError('login', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signUpLoaded || !signUp) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        const errors: FieldErrors = {};
        if (!firstName.trim()) errors.firstName = 'First name needed.';
        if (!lastName.trim()) errors.lastName = 'Last name needed.';
        if (!email.trim()) errors.email = 'Email needed.';
        else if (!isValidEmail(email)) errors.email = 'Enter a valid email.';
        if (!password) errors.password = 'Password needed.';
        else if (password.length < 8) errors.password = 'Password must be 8+ chars.';
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            await withTimeout(signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName
            }), 'Account creation');

            await withTimeout(signUp.prepareEmailAddressVerification({ strategy: 'email_code' }), 'Verification code sending');
            setMode('signup_verify');
        } catch (err: any) {
            reportAuthError('signup', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignupVerify = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!signUpLoaded || !signUp) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        const normalizedCode = verificationCode.replace(/\D/g, '');
        if (normalizedCode.length !== 6) {
            setFieldErrors({ code: 'Enter the 6-digit code.' });
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            const result = await withTimeout(signUp.attemptEmailAddressVerification({ code: normalizedCode }), 'Code verification');
            
            if (result.status === 'complete') {
                await withTimeout(clerk.setActive({ session: result.createdSessionId }), 'Session activation');
                await finishToApp();
                return;
            }

            // Fallback for unexpected status
            setError(`Verification result: ${result.status}. Please check your email.`);
        } catch (err: any) {
            const msg = normalizeError(err);
            if (import.meta.env.DEV) {
                console.error('[Auth] signup_verify failed', {
                    message: msg,
                    origin: getCurrentOrigin(),
                    authLoaded,
                    signUpLoaded,
                    clerkLoaded: clerk.loaded
                });
            }
            if (msg.toLowerCase().includes('already been verified')) {
                // If already verified, try to sign in or just navigate if session exists
                if (clerk.session) {
                    void finishToApp();
                } else {
                    setMode('login');
                    setError('Email already verified. Please sign in.');
                }
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignupResend = async () => {
        if (!signUpLoaded || !signUp || loading) {
            if (!signUpLoaded || !signUp) {
                setError('Authentication is still loading. Try again in a moment.');
            }
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            await withTimeout(signUp.prepareEmailAddressVerification({ strategy: 'email_code' }), 'Resend code');
        } catch (err: any) {
            reportAuthError('signup_resend', err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signInLoaded || !signIn) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        if (!email.trim() || !isValidEmail(email)) {
            setFieldErrors({ email: 'Enter a valid email.' });
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            await withTimeout(signIn.create({ identifier: email }), 'Password reset initialization');
            
            // Find the reset strategy
            const factor = signIn.supportedFirstFactors?.find(
                (f) => f.strategy === 'reset_password_email_code'
            ) as any;
            
            if (factor) {
                await withTimeout(signIn.prepareFirstFactor({ 
                    strategy: 'reset_password_email_code', 
                    emailAddressId: factor.emailAddressId 
                }), 'Reset code sending');
                setMode('forgot_code');
            } else {
                setError('Password reset is not configured for this account.');
            }
        } catch (err: any) {
            reportAuthError('forgot_send', err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerifyCode = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!signInLoaded || !signIn) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        const normalizedCode = resetCode.replace(/\D/g, '');
        if (normalizedCode.length !== 6) {
            setFieldErrors({ code: 'Enter the 6-digit code.' });
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            const result = await withTimeout(signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code: normalizedCode }), 'Reset code verification');
            
            if (result.status === 'needs_new_password') {
                setMode('forgot_password');
            } else if (result.status === 'complete') {
                await withTimeout(clerk.setActive({ session: result.createdSessionId }), 'Session activation');
                await finishToApp();
            } else {
                setError(`Unexpected status: ${result.status}`);
            }
        } catch (err: any) {
            reportAuthError('forgot_verify_code', err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signInLoaded || !signIn) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        if (!newPassword) {
            setFieldErrors({ password: 'Password required.' });
            setError(null);
            return;
        }
        if (newPassword.length < 8) {
            setFieldErrors({ password: 'Must be at least 8 characters.' });
            setError(null);
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            const result = await withTimeout(signIn.resetPassword({ password: newPassword }), 'Password update');
            if (result.status === 'complete') {
                await withTimeout(clerk.setActive({ session: result.createdSessionId }), 'Session activation');
                await finishToApp();
                return;
            }
            setError(`Security reset: ${result.status}. Please try again.`);
        } catch (err: any) {
            reportAuthError('forgot_set_password', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocial = async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_x') => {
        if (!signInLoaded || !signIn) {
            setError('Authentication is still loading. Try again in a moment.');
            return;
        }

        setLoading(true);
        clearFormErrors();
        try {
            await withTimeout(signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: `${window.location.origin}/auth?mode=sso-callback`,
                redirectUrlComplete: `${window.location.origin}/dashboard`
            }), 'Social sign-in redirect');
        } catch (err: any) {
            reportAuthError('social_auth', err);
        } finally {
            setLoading(false);
        }
    };

    if (!clerkEnabled) {
        return (
            <div className="h-screen bg-[#050505] text-gray-800 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-1 h-1 bg-[#F5364E] rounded-full mb-6 animate-pulse" />
                <p className="max-w-xs text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                    System setup required. Please check your environment keys.
                </p>
            </div>
        );
    }

    const showBack = mode === 'signup_verify' || mode === 'forgot_code' || mode === 'forgot_password' || mode === 'forgot_request';

    return (
        <AuthLayout 
            mode={mode} 
            onBack={() => setRouteMode('login')} 
            onSwitch={() => setRouteMode(mode === 'login' ? 'signup' : 'login')}
            showBack={showBack}
        >
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 overflow-hidden"
                >
                    <div className="p-3.5 rounded-xl bg-[#F5364E]/[0.02] border border-[#F5364E]/10 text-[#F5364E] text-[11px] font-bold uppercase tracking-wider flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full bg-[#F5364E]" />
                        {error}
                    </div>
                </motion.div>
            )}

            {mode === 'login' && (
                <LoginForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    loading={loading}
                    onLogin={handleLogin}
                    onForgot={() => setRouteMode('forgot')}
                    onSocial={handleSocial}
                    onSwitch={() => setRouteMode('signup')}
                    errors={fieldErrors}
                />
            )}

            {mode === 'signup' && (
                <SignupForm
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    loading={loading}
                    onSignup={handleSignup}
                    onSocial={handleSocial}
                    onSwitch={() => setRouteMode('login')}
                    errors={fieldErrors}
                />
            )}

            {mode === 'signup_verify' && (
                <VerifyForm
                    email={email}
                    code={verificationCode}
                    setCode={setVerificationCode}
                    loading={loading}
                    onVerify={handleSignupVerify}
                    onResend={handleSignupResend}
                    errors={fieldErrors}
                />
            )}

            {(mode === 'forgot_request' || mode === 'forgot_code' || mode === 'forgot_password') && (
                <RecoveryForm
                    mode={mode}
                    email={email}
                    setEmail={setEmail}
                    code={resetCode}
                    setCode={setResetCode}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    loading={loading}
                    onSendCode={handleForgotSend}
                    onVerifyCode={handleForgotVerifyCode}
                    onSetPassword={handleForgotSetPassword}
                    onSwitch={() => setRouteMode('login')}
                    errors={fieldErrors}
                />
            )}

            {mode === 'sso_callback' && (
                <div className="py-12 text-center space-y-4">
                   <div className="w-8 h-8 border-2 border-white/5 border-t-[#F5364E] rounded-full animate-spin mx-auto" />
                   <p className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">Just a moment...</p>
                </div>
            )}
        </AuthLayout>
    );
};

const normalizeError = (err: any) => {
    const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Something went wrong.';

    if (typeof message === 'string') {
        if (message.toLowerCase().includes('data breach')) return 'Please pick a safer password.';
        if (message.toLowerCase().includes('already been verified')) return 'This account is already verified.';
        if (isTimeoutError(message)) {
            const originMatch = message.match(/at (https?:\/\/[^.\s/]+(?::\d+)?|https?:\/\/[^\s]+)/i);
            const origin = originMatch?.[1] || getCurrentOrigin();
            return `Auth request timed out from ${origin}. Verify \`VITE_CLERK_PUBLISHABLE_KEY\`, add this exact origin to Clerk allowed origins, and check for VPN, ad blockers, or network rules blocking Clerk.`;
        }
    }

    return message;
};

export default Auth;
