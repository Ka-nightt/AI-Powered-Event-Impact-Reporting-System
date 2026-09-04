import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const BG_IMAGE = 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?auto=format&fit=crop&w=1920&q=80';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${BG_IMAGE})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/60 to-ink/80" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center text-white">
            <BarChart3 size={18} />
          </div>
          <span className="font-display font-bold text-lg text-white">Event Impact Reporting</span>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-xl shadow-xl p-8">
          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">Log in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate">Email</label>
              <input
                type="email"
                required
                autoFocus
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate">Password</label>
              <input
                type="password"
                required
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
              {submitting ? 'Logging in…' : 'Log in'}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
