import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // NOTE: there's no email/reset backend wired up yet - this just
    // acknowledges the request. Wire this up to a real
    // POST /api/auth/forgot-password + email service when you're ready.
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest text-brand-600 uppercase font-medium">Impact</p>
          <h1 className="font-display text-2xl font-bold text-ink mt-1">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you reset instructions.</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <p className="text-sm text-slate">
              If an account exists for <span className="font-medium">{email}</span>, you'll receive reset
              instructions shortly.
            </p>
          ) : (
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
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                Send reset link
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
