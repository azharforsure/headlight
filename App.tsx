/// <reference types="vite/client" />
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
const Home = React.lazy(() => import('./pages/Home'));
import { loadDashboardPage } from './pages/loadDashboard';
const Dashboard = React.lazy(loadDashboardPage);
const Agency = React.lazy(() => import('./pages/Agency'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Board = React.lazy(() => import('./pages/Board'));
const Auth = React.lazy(() => import('./pages/Auth'));
const SeoCrawler = React.lazy(() => import('./pages/SeoCrawler'));
import { AuthProvider, useAuth } from './services/AuthContext';
import { ProjectProvider } from './services/ProjectContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();
    if (loading) return <div className="h-screen bg-[#080808] text-white flex items-center justify-center">Loading...</div>;
    if (!session) return <Navigate to="/auth" replace />;
    return <>{children}</>;
};

/**
 * OptionalAuthWrapper: Wraps crawler with auth context but doesn't force login.
 * If logged in → full features (save history, AI, unlimited).
 * If not logged in → limited trial mode (25 pages, no save).
 */
const OptionalAuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const { session } = useAuth();
    if (session) {
        return <ProjectProvider>{children}</ProjectProvider>;
    }
    return <>{children}</>;
};

const OAuthPopupBridge = () => {
    useEffect(() => {
        if (typeof window === 'undefined' || !window.opener) return;

        const params = new URLSearchParams(window.location.search);
        const provider = params.get('provider');
        const code = params.get('code');
        const error = params.get('error');
        const state = params.get('state');

        if (!provider || (!code && !error)) return;

        window.opener.postMessage({
            type: 'headlight-oauth-callback',
            provider,
            code,
            error,
            state
        }, window.location.origin);

        window.close();
    }, []);

    return null;
};

const App: React.FC = () => {
    const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!clerkPublishableKey) {
        return <div className="h-screen bg-[#080808] text-white flex items-center justify-center">Missing Clerk publishable key.</div>;
    }
    const app = (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id'}>
            <AuthProvider>
                <BrowserRouter>
                    <OAuthPopupBridge />
                    <React.Suspense fallback={<div className="h-screen bg-[#080808] text-white flex items-center justify-center">Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/agency" element={<Agency />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/board" element={<Board />} />
                            <Route path="/crawler" element={
                                <OptionalAuthWrapper>
                                    <SeoCrawler />
                                </OptionalAuthWrapper>
                            } />
                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <ProjectProvider>
                                        <Dashboard />
                                    </ProjectProvider>
                                </ProtectedRoute>
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </React.Suspense>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
    return (
        <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl="/auth"
            signUpUrl="/auth?mode=signup"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
        >
            {app}
        </ClerkProvider>
    );
};

export default App;
