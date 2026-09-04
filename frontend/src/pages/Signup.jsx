import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
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
          <span className="font-display font-bold text-lg text-white">
            Event Impact Reporting
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-xl shadow-xl p-8">
          <h1 className="font-display text-2xl font-bold text-ink">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Start tracking events and generating impact reports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate">
                Full name
              </label>
              <input
                required
                autoFocus
                className="input mt-1"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate">Email</label>
              <input
                type="email"
                required
                className="input mt-1"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input mt-1"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate">
                Confirm password
              </label>
              <input
                type="password"
                required
                className="input mt-1"
                value={form.confirm_password}
                onChange={(e) => update("confirm_password", e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-600 font-medium hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
