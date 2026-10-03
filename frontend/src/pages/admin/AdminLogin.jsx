import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, ArrowRight, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  // Recognize existing valid 1-hour session within the 1-hour lifetime
  React.useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const sessionId = localStorage.getItem('adminSessionId');
    const isAuth = localStorage.getItem('adminAuth') === 'true';

    if (isAuth && token) {
      fetch('http://localhost:5000/api/admin/session-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-session-id': sessionId || ''
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.authenticated) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminSessionId');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminRole');
        }
      })
      .catch(() => {});
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanInput = email.trim().toLowerCase();

    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanInput, username: cleanInput, password })
      });
      const data = await res.json();
      
      if (data.status === 'success' && data.user) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminToken', data.token || 'admin-jwt-token');
        localStorage.setItem('adminSessionId', data.session?.sessionId || '');
        if (data.session?.expiresAt) {
          localStorage.setItem('adminSessionExpiresAt', String(data.session.expiresAt));
        } else {
          localStorage.setItem('adminSessionExpiresAt', String(Date.now() + 3600 * 1000));
        }
        localStorage.setItem('adminSession', JSON.stringify(data.session || {}));
        localStorage.setItem('adminRole', data.user.role || 'MAIN_ADMIN');
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setLoading(false);
        navigate('/admin/dashboard');
        return;
      } else {
        setError(data.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('Unable to connect to authentication server. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      setForgotLoading(false);

      if (data.status === 'success' || res.ok) {
        setForgotMessage(data.message || 'If an account is eligible for password reset, a password reset link has been sent.');
      } else {
        setForgotError(data.message || 'Unable to process password reset request.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotMessage('If an account is eligible for password reset, a password reset link has been sent.');
    }
  };

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
          
          {/* Top Section with Logo */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <img 
              src="/logo/digital_law_reporter.png" 
              alt="Digital Law Reporter" 
              className="h-12 object-contain mb-3"
            />
            <h1 className="text-xl font-bold text-slate-800 mb-1">Admin Portal</h1>
            <p className="text-xs text-slate-500">Secure access to Digi Law Reporter</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-medium shadow-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Admin Username / Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Admin Username / Email</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium text-sm"
                    placeholder="mainadmin or admin@digilawreporter.in"
                  />
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Password Header with Forgot Password Link */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotMessage(''); setForgotError(''); }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 pr-11 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium text-sm"
                    placeholder="••••••••"
                  />
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-70 disabled:hover:bg-blue-600 text-sm cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Secure Login'} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

        </div>
        
        <div className="text-center mt-6 text-[13px] text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Digi Law Reporter. All rights reserved.
        </div>
      </motion.div>

      {/* Forgot Password Modal (Main Admin Only) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 z-50"
          >
            <button 
              onClick={() => { setShowForgotModal(false); setForgotMessage(''); setForgotError(''); }}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Forgot Admin Password</h2>
                <p className="text-xs text-slate-500">Main Admin Verification</p>
              </div>
            </div>

            {forgotMessage ? (
              <div className="space-y-4 my-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm leading-relaxed font-medium">
                  {forgotMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 mt-4">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Main Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@digilawreporter.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 font-semibold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'Verifying...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}

