import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const CURRENT_YEAR = new Date().getFullYear();

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setError('');
    setMessage('');
  };

  const handleModeSwitch = (mode) => {
    setIsSignUp(mode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetForm();

    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const data = await signUp(email, password);
        if (data?.session) {
          // Immediately signed in
        } else {
          setMessage('Account created! Please check your email to verify your account, or sign in.');
          setIsSignUp(false);
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      if (isSignUp) {
        setError(err?.message || 'Could not create account. Please try again.');
      } else {
        setError('Incorrect email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cozy-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex justify-center mb-6">
          <img
            src="/login-hero.jpg"
            alt=""
            aria-hidden="true"
            className="w-44 h-44 object-contain dark:hidden"
          />
          <img
            src="/login-hero-dark.jpg"
            alt=""
            aria-hidden="true"
            className="hidden w-44 h-44 object-contain dark:block"
          />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cozy-paper border border-cozy-primary shadow-sm mb-3">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl text-cozy-text tracking-wide">Cozy Reads</h1>
          <p className="text-sm text-cozy-muted mt-1 font-sans">
            {isSignUp ? 'Create your personal reading journal' : 'Your private reading sanctuary'}
          </p>
        </div>

        <div className="bg-cozy-card rounded-2xl border border-cozy-border p-8 shadow-sm">
          {/* Tab selector */}
          <div className="flex rounded-xl bg-cozy-bg p-1 border border-cozy-primary mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                !isSignUp
                  ? 'bg-cozy-paper text-cozy-text shadow-sm'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                isSignUp
                  ? 'bg-cozy-paper text-cozy-text shadow-sm'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-medium text-cozy-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition"
                placeholder="reader@example.com"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-medium text-cozy-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label htmlFor="confirm-password" className="block text-xs font-medium text-cozy-text">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-cozy-accent bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-xs text-[#2e6b48] bg-[#edf7f0] border border-[#c4e6ce] dark:text-green-200 dark:bg-green-950/40 dark:border-green-900 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-cozy-accent text-white font-medium text-sm hover:bg-[#d97979] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isSignUp
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </button>

            <div className="pt-2 text-center">
              {isSignUp ? (
                <p className="text-xs text-cozy-muted">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch(false)}
                    className="text-cozy-accent font-medium hover:underline focus:outline-none"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-xs text-cozy-muted">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch(true)}
                    className="text-cozy-accent font-medium hover:underline focus:outline-none"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-cozy-muted mt-6">
          © {CURRENT_YEAR} Cozy Reads
        </p>
      </div>
    </div>
  );
}
