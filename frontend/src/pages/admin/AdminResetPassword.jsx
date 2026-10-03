import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validatingToken, setValidatingToken] = useState(true);

  React.useEffect(() => {
    if (!token) {
      setError('This password reset link is invalid or has expired.');
      setValidatingToken(false);
      return;
    }

    fetch(`http://localhost:5000/api/admin/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        setValidatingToken(false);
        if (data.status !== 'success') {
          setError(data.message || 'This password reset link has expired (valid for 3 minutes only).');
        }
      })
      .catch(() => {
        setValidatingToken(false);
        setError('This password reset link is invalid or has expired.');
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError('This password reset link is invalid or has expired.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      setLoading(false);

      if (data.status === 'success' || res.ok) {
        setSuccessMessage(data.message || 'Password reset successfully. You can now sign in with your new password.');
      } else {
        setError(data.message || 'This password reset link is invalid or has expired.');
      }
    } catch (err) {
      setLoading(false);
      setError('This password reset link is invalid or has expired.');
    }
  };

  if (validatingToken) {
    return (
      <div className="h-[100dvh] bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">Verifying Password Reset Security Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/60 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/60 blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
          
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <img 
              src="/logo/digital_law_reporter.png" 
              alt="Digital Law Reporter" 
              className="h-12 object-contain mb-3"
            />
            <h1 className="text-xl font-bold text-slate-800 mb-1">Reset Admin Password</h1>
            <p className="text-xs text-slate-500">Set a new password for Main Admin account</p>
          </div>

          {successMessage ? (
            <div className="space-y-5 text-center">
              <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600" />
                <p className="text-sm font-semibold leading-relaxed">
                  {successMessage}
                </p>
              </div>
              
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
              >
                Sign In Now <ArrowRight size={18} />
              </button>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs space-y-3 text-center">
              <div className="flex flex-col items-center gap-2 font-bold text-red-800">
                <AlertCircle size={32} className="text-red-600" />
                <span className="text-sm">Password Reset Link Expired</span>
              </div>
              <p className="text-red-600 leading-relaxed text-xs">
                {error} Password reset links are strictly valid for 3 minutes for security.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin?forgot=true')}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  Request New Reset Link <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 pr-11 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                  />
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 pr-11 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                  />
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-70 text-sm cursor-pointer"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <div className="text-center pt-2">
                <Link to="/admin" className="text-xs font-bold text-slate-500 hover:text-blue-600">
                  Return to Admin Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
