import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const CURRENT_YEAR = new Date().getFullYear();

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cozy-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex justify-center mb-6">
          <img
            src="/login-hero.jpg"
            alt=""
            aria-hidden="true"
            className="w-48 h-48 object-contain"
          />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-cozy-primary shadow-sm mb-4">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-3xl text-cozy-text tracking-wide">Cozy Reads</h1>
          <p className="text-sm text-cozy-muted mt-1 font-sans">Your private reading sanctuary</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-cozy-card rounded-2xl border border-cozy-border p-8 shadow-sm space-y-5"
        >
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-cozy-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-cozy-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-cozy-accent bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cozy-accent text-white font-medium text-sm hover:bg-[#d97979] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-cozy-muted mt-6">
          © {CURRENT_YEAR} Cozy Reads
        </p>
      </div>
    </div>
  );
}
