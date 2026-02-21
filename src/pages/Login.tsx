import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fleet-400">Fleet Management Hub</h1>
          <p className="text-slate-400 mt-1">Rule-based digital fleet oversight</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            {forgot ? 'Forgot Password' : 'Sign In'}
          </h2>
          {forgot ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                setForgot(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-fleet-500 focus:border-transparent"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <p className="text-sm text-slate-500">Password reset link will be sent (mock).</p>
              <button
                type="submit"
                className="w-full py-2 bg-fleet-600 hover:bg-fleet-500 text-white font-medium rounded-lg transition-colors"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setForgot(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-sm"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-fleet-500 focus:border-transparent"
                  placeholder="manager@fleet.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-fleet-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full py-2 bg-fleet-600 hover:bg-fleet-500 text-white font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setForgot(true)}
                className="w-full text-sm text-slate-500 hover:text-fleet-400"
              >
                Forgot Password?
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-slate-600 text-sm mt-4">
          Demo: manager@fleet.com / fleet123
        </p>
      </div>
    </div>
  );
}
