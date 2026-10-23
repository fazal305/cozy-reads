import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, signOut } = useAuth();

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
