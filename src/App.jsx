import { lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabase';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { applyTheme, getInitialTheme } from './lib/theme';

applyTheme(getInitialTheme());

// Dev-only preview with in-memory data: /?demo=1. Compiled out of production builds.
const DemoShell = import.meta.env.DEV ? lazy(() => import('./dev/DemoShell')) : null;
const showDemo = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');

export default function App() {
  const { user, signOut } = useAuth();

  if (import.meta.env.DEV && showDemo) {
    return (
      <Suspense fallback={null}>
        <DemoShell />
      </Suspense>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-cozy-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-cozy-card border border-cozy-border rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-cozy-accent-ink border border-red-100 dark:border-red-900 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="font-serif text-2xl text-cozy-text">Configuration Needed</h2>
          <p className="text-sm text-cozy-muted leading-relaxed">
            Cozy Reads needs your Supabase project keys to connect. Please add your environment variables in your Vercel Project Settings.
          </p>
          <div className="bg-cozy-bg rounded-xl p-3 text-left font-mono text-xs text-cozy-text space-y-1 border border-cozy-primary">
            <p>VITE_SUPABASE_URL</p>
            <p>VITE_SUPABASE_ANON_KEY</p>
          </div>
          <p className="text-xs text-cozy-muted">
            Go to <strong>Vercel &gt; Settings &gt; Environment Variables</strong>, add these two values, and redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-cozy-bg flex items-center justify-center" role="status" aria-label="Loading…">
        <div className="w-8 h-8 rounded-full border-2 border-cozy-primary border-t-cozy-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard user={user} onSignOut={signOut} />;
}
