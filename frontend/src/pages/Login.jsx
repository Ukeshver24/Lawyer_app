import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, 
  User, 
  Phone, 
  Lock, 
  Calendar, 
  Eye, 
  EyeOff, 
  KeyRound, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function Login({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const paramMode = searchParams.get('mode');
  const [mode, setMode] = useState(paramMode || initialMode || 'login'); // 'login' | 'register' | 'forgot'

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    dob: '',
    mpin: '',
    newMpin: ''
  });

  const [showMpin, setShowMpin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const navigate = useNavigate();

  // Helper to switch modes cleanly
  const switchMode = (newMode) => {
    setError(null);
    setSuccessMsg(null);
    setShowMpin(false);
    setMode(newMode);
  };

  // Format DOB input as DD/MM/YYYY
  const handleDobChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setFormData(prev => ({ ...prev, dob: formatted }));
  };

  // Helper to complete login session & redirect
  const handleAuthSuccess = (userData, message) => {
    localStorage.setItem('user', JSON.stringify(userData));
    window.dispatchEvent(new Event('storage'));
    if (message) setSuccessMsg(message);
    setTimeout(() => {
      navigate('/search');
    }, 400);
  };

  // 1. Submit Login (Mobile + 4-digit MPIN)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanMobile = formData.mobile.trim();
    const cleanMpin = formData.mpin.trim();

    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      return setError('Please enter a valid 10-digit mobile number.');
    }
    if (!cleanMpin || !/^\d{4}$/.test(cleanMpin)) {
      return setError('Please enter your 4-digit MPIN.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, mpin: cleanMpin })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.user) {
        handleAuthSuccess(data.user, 'Login successful! Redirecting...');
      } else {
        setError(data.message || 'Invalid mobile number or MPIN.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Please ensure the backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Registration (Name, Mobile, DOB, 4-digit MPIN)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = formData.name.trim();
    const cleanMobile = formData.mobile.trim();
    const cleanDob = formData.dob.trim();
    const cleanMpin = formData.mpin.trim();

    if (!cleanName) {
      return setError('Please enter your Full Name.');
    }
    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      return setError('Please enter a valid 10-digit mobile number.');
    }
    if (!cleanDob || !/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob)) {
      return setError('Please enter your Date of Birth in DD/MM/YYYY format.');
    }
    if (!cleanMpin || !/^\d{4}$/.test(cleanMpin)) {
      return setError('MPIN must be exactly 4 digits.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          mobile: cleanMobile,
          dob: cleanDob,
          mpin: cleanMpin
        })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.user) {
        handleAuthSuccess(data.user, 'Registration successful! Entering portal...');
      } else {
        setError(data.message || 'Registration failed. Mobile number may already exist.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Connection failed. Please ensure the backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Forgot MPIN (Mobile, DOB -> Set New 4-digit MPIN)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanMobile = formData.mobile.trim();
    const cleanDob = formData.dob.trim();
    const cleanNewMpin = formData.newMpin.trim();

    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      return setError('Please enter your registered 10-digit mobile number.');
    }
    if (!cleanDob || !/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob)) {
      return setError('Please enter your registered DOB in DD/MM/YYYY format.');
    }
    if (!cleanNewMpin || !/^\d{4}$/.test(cleanNewMpin)) {
      return setError('New MPIN must be exactly 4 digits.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          dob: cleanDob,
          newMpin: cleanNewMpin
        })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.user) {
        handleAuthSuccess(data.user, 'MPIN reset successful! Redirecting...');
      } else {
        setError(data.message || 'Verification failed. Please check Mobile Number and Date of Birth.');
      }
    } catch (err) {
      console.error('Reset MPIN error:', err);
      setError('Connection failed. Please ensure the backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 w-full font-jakarta relative my-auto min-h-[calc(100vh-4rem)]">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[410px] sm:max-w-[430px] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden relative my-auto"
      >
        <div className="p-5 sm:p-6">

          {/* Dynamic Header */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="w-11 h-11 bg-primary-50 text-primary-600 border border-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-2xs">
              {mode === 'login' && <LogIn size={22} />}
              {mode === 'register' && <UserPlus size={22} />}
              {mode === 'forgot' && <KeyRound size={22} />}
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-0.5 tracking-tight font-jakarta">
              {mode === 'login' && 'Fast MPIN Access'}
              {mode === 'register' && 'Create Subscriber Account'}
              {mode === 'forgot' && 'Reset 4-Digit MPIN'}
            </h2>
            
            <p className="text-slate-500 text-[11px] sm:text-xs font-normal max-w-xs mx-auto leading-relaxed">
              {mode === 'login' && 'Enter your 10-digit mobile number and 4-digit MPIN.'}
              {mode === 'register' && 'Register your details with DOB & set a 4-digit MPIN.'}
              {mode === 'forgot' && 'Verify Mobile & Date of Birth to set a new 4-digit MPIN.'}
            </p>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 bg-red-50 border-l-4 border-red-500 p-2.5 rounded-r-lg flex items-start gap-2"
              >
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-[11px] sm:text-xs font-semibold leading-tight">{error}</p>
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 bg-emerald-50 border-l-4 border-emerald-500 p-2.5 rounded-r-lg flex items-start gap-2"
              >
                <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-emerald-700 text-[11px] sm:text-xs font-semibold leading-tight">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Animated Forms */}
          <AnimatePresence mode="wait">
            
            {/* MODE 1: LOGIN */}
            {mode === 'login' && (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-3 sm:space-y-3.5"
              >
                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.mobile} 
                      onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-wider placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="10-digit mobile number" 
                    />
                  </div>
                </div>

                {/* 4-Digit MPIN */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
                      4-Digit MPIN
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] sm:text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                    >
                      Forgot MPIN?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type={showMpin ? 'text' : 'password'} 
                      required 
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.mpin} 
                      onChange={e => setFormData({ ...formData, mpin: e.target.value.replace(/\D/g, '').slice(0, 4) })} 
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-widest placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="••••" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowMpin(!showMpin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showMpin ? 'Hide MPIN' : 'Show MPIN'}
                    >
                      {showMpin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.75 sm:py-3 rounded-xl transition-all active:scale-[0.98] shadow-md hover:shadow-primary-500/25 flex justify-center items-center gap-2 mt-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
                >
                  {loading ? 'Authenticating...' : 'Login to Search'}
                  {!loading && <ArrowRight size={15} />}
                </button>

                {/* Switch to Register */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                  <p className="text-slate-600 text-xs">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-primary-600 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-0.5"
                    >
                      Register Now
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* MODE 2: REGISTER */}
            {mode === 'register' && (
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleRegisterSubmit} 
                className="space-y-2.5 sm:space-y-3"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400" 
                      placeholder="e.g. Adv. Rajesh Sharma" 
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.mobile} 
                      onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-wider placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="10-digit mobile number" 
                    />
                  </div>
                </div>

                {/* Date of Birth (DOB) */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      maxLength={10}
                      inputMode="numeric"
                      value={formData.dob} 
                      onChange={handleDobChange} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-wider placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="DD/MM/YYYY" 
                    />
                  </div>
                </div>

                {/* Set 4-Digit MPIN */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Set 4-Digit MPIN
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type={showMpin ? 'text' : 'password'} 
                      required 
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.mpin} 
                      onChange={e => setFormData({ ...formData, mpin: e.target.value.replace(/\D/g, '').slice(0, 4) })} 
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-widest placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="Enter 4-digit MPIN" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowMpin(!showMpin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showMpin ? 'Hide MPIN' : 'Show MPIN'}
                    >
                      {showMpin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.75 sm:py-3 rounded-xl transition-all active:scale-[0.98] shadow-md hover:shadow-primary-500/25 flex justify-center items-center gap-2 mt-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
                >
                  {loading ? 'Creating Account...' : 'Register & Access'}
                  {!loading && <ArrowRight size={15} />}
                </button>

                {/* Switch to Login */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-center">
                  <p className="text-slate-600 text-xs">
                    Already have an MPIN?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-primary-600 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-0.5"
                    >
                      Login with MPIN
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* MODE 3: FORGOT MPIN */}
            {mode === 'forgot' && (
              <motion.form 
                key="forgot-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleForgotSubmit} 
                className="space-y-2.5 sm:space-y-3"
              >
                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.mobile} 
                      onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-wider placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="10-digit mobile number" 
                    />
                  </div>
                </div>

                {/* Date of Birth (DOB) */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registered Date of Birth (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      maxLength={10}
                      inputMode="numeric"
                      value={formData.dob} 
                      onChange={handleDobChange} 
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-wider placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="DD/MM/YYYY" 
                    />
                  </div>
                </div>

                {/* Set New 4-Digit MPIN */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Set New 4-Digit MPIN
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type={showMpin ? 'text' : 'password'} 
                      required 
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.newMpin} 
                      onChange={e => setFormData({ ...formData, newMpin: e.target.value.replace(/\D/g, '').slice(0, 4) })} 
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition-all bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 tracking-widest placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" 
                      placeholder="Enter new 4-digit MPIN" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowMpin(!showMpin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showMpin ? 'Hide MPIN' : 'Show MPIN'}
                    >
                      {showMpin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.75 sm:py-3 rounded-xl transition-all active:scale-[0.98] shadow-md hover:shadow-primary-500/25 flex justify-center items-center gap-2 mt-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
                >
                  {loading ? 'Verifying & Resetting...' : 'Reset MPIN & Login'}
                  {!loading && <RotateCcw size={15} />}
                </button>

                {/* Switch to Login */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-center">
                  <p className="text-slate-600 text-xs">
                    Remembered your MPIN?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-primary-600 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-0.5"
                    >
                      Back to Login
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

          </AnimatePresence>

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Strictly secured with 4-Digit MPIN authentication.</span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
