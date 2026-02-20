import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, UserPlus, LogIn, Loader, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import { Link } from 'react-router-dom';

export function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email || !password) throw new Error('Please fill in all fields');

      if (isSignUp) {
        const signupData = new URLSearchParams();
        signupData.append('email', email);
        signupData.append('password', password);
        await api.post('/auth/signup', signupData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      }

      const loginData = new URLSearchParams();
      loginData.append('username', email);
      loginData.append('password', password);
      loginData.append('grant_type', 'password');
      const loginResponse = await api.post('/auth/login', loginData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

      if (loginResponse.data) {
        const { access_token } = loginResponse.data;
        setToken(access_token);
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        const userResponse = await api.get('/auth/me');
        if (userResponse.data) {
          setUser(userResponse.data);
          navigate('/ongoing');
        }
      }
    } catch (err) {
      let msg = 'An error occurred';
      if (err.response?.data?.detail) {
        msg = Array.isArray(err.response.data.detail)
          ? err.response.data.detail[0].msg
          : err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4 font-sans">
      {/* Back to home */}
      <Link to="/" className="fixed top-5 left-5 flex items-center gap-2 text-sm text-slate-500 hover:text-midnight transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to home
      </Link>

      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-midnight inline-flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-midnight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isSignUp ? 'Start your learning journey today.' : 'Continue where you left off.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-midnight mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full rounded-xl border border-midnight/10 bg-sage/50 py-2.5 text-sm text-midnight placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 transition"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-midnight mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full rounded-xl border border-midnight/10 bg-sage/50 py-2.5 text-sm text-midnight placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 transition"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={5}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-coral text-white font-semibold py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 shadow-sm mt-2"
            >
              {loading ? (
                <><Loader className="h-4 w-4 animate-spin" />{isSignUp ? 'Creating account…' : 'Signing in…'}</>
              ) : isSignUp ? (
                <><UserPlus className="h-4 w-4" />Create Account</>
              ) : (
                <><LogIn className="h-4 w-4" />Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 pt-1">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="font-semibold text-coral hover:opacity-75 transition-opacity"
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}