import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const CURRENT_YEAR = new Date().getFullYear();

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const resetForm = () => {
    setError('');
    setMessage('');
  };

  const handleModeSwitch = (mode) => {
    setIsSignUp(mode);
    resetForm();
  };

  const handleGoogleSignIn = async () => {
    resetForm();
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || 'Could not connect to Google. Please check your configuration.');
      setGoogleLoading(false);
    }
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
            className="w-44 h-44 object-contain"
          />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-cozy-primary shadow-sm mb-3">
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
                  ? 'bg-white text-cozy-text shadow-sm'
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
                  ? 'bg-white text-cozy-text shadow-sm'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-cozy-primary bg-white text-cozy-text text-sm font-medium hover:bg-cozy-bg flex items-center justify-center gap-3 transition shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading
                ? 'Connecting to Google…'
                : isSignUp
                ? 'Sign up with Google'
                : 'Continue with Google'}
            </span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-cozy-primary opacity-60"></div>
            <span className="absolute bg-cozy-card px-2 text-xs text-cozy-muted font-sans">
              or continue with email
            </span>
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
              <p role="alert" className="text-xs text-cozy-accent bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-xs text-[#2e6b48] bg-[#edf7f0] border border-[#c4e6ce] rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
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
          </form>
        </div>

        <p className="text-center text-xs text-cozy-muted mt-6">
          © {CURRENT_YEAR} Cozy Reads
        </p>
      </div>
    </div>
  );
}
