import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bookmark, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Lock, 
  Scale, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Settings
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [savedCases, setSavedCases] = useState([]);
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'account'
  const [loading, setLoading] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Delete Account Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const navigate = useNavigate();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.replace(/^Adv\.?\s+/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Helper to format DOB into human-friendly format (e.g. 24 Jul 2007)
  const formatDob = (dobStr) => {
    if (!dobStr) return '';
    try {
      const s = String(dobStr).trim();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y, m, d] = s.slice(0, 10).split('-');
        const monthIdx = parseInt(m, 10) - 1;
        const dayNum = parseInt(d, 10);
        return `${dayNum} ${monthNames[monthIdx] || m} ${y}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
        const [d, m, y] = s.split('/');
        const monthIdx = parseInt(m, 10) - 1;
        const dayNum = parseInt(d, 10);
        return `${dayNum} ${monthNames[monthIdx] || m} ${y}`;
      }
      return dobStr;
    } catch {
      return dobStr;
    }
  };

  // Initial Load & Session Validation
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      setUser(null);
      setLoading(false);
      setLoadingCases(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
      const identifier = parsedUser.mobile || parsedUser.id || parsedUser.email;

      if (identifier) {
        // 1. Fetch fresh user profile directly from PostgreSQL 18
        fetch(`${API_BASE_URL}/auth/profile/${encodeURIComponent(identifier)}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success' && data.data) {
              setProfileData(data.data);
            } else {
              setProfileData(parsedUser);
            }
          })
          .catch(err => {
            console.error('Failed to fetch profile from PostgreSQL:', err);
            setProfileData(parsedUser);
          })
          .finally(() => setLoading(false));

        // 2. Fetch user's saved cases directly from PostgreSQL 18
        fetch(`${API_BASE_URL}/auth/saved-cases/${encodeURIComponent(identifier)}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success' && Array.isArray(data.data)) {
              setSavedCases(data.data);
            } else {
              setSavedCases([]);
            }
          })
          .catch(err => {
            console.error('Failed to fetch saved cases from PostgreSQL:', err);
            setSavedCases([]);
          })
          .finally(() => setLoadingCases(false));
      } else {
        setLoading(false);
        setLoadingCases(false);
      }
    } catch (e) {
      console.error('Invalid user session data', e);
      setUser(null);
      setLoading(false);
      setLoadingCases(false);
    }
  }, []);

  // Quick Logout (Temporary device session sign-out)
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  // Permanent Delete Account from Database
  const handlePermanentDeleteAccount = async () => {
    const identifier = user?.mobile || user?.id || user?.email;
    if (!identifier) return;

    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/account/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setShowDeleteModal(false);
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        showToast('Your account has been permanently deleted from the database.');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setDeleteError(data.message || 'Failed to delete account. Please try again.');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setDeleteError('Connection error. Could not delete account from database.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Remove Bookmark & sync strictly with PostgreSQL database
  const handleRemoveBookmark = async (caseItem, e) => {
    if (e) e.stopPropagation();
    if (!caseItem) return;

    const caseIdToRemove = String(caseItem.id || caseItem.case_id);
    const identifier = user?.mobile || user?.id || user?.email;
    if (!identifier) return;

    setRemovingId(caseIdToRemove);
    const updatedCases = savedCases.filter(c => String(c.id || c.case_id) !== caseIdToRemove);
    setSavedCases(updatedCases);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/saved-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: String(identifier),
          cases: updatedCases
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Judgment removed from your saved bookmarks.');
      }
    } catch (err) {
      console.error('Failed to sync updated bookmarks with database:', err);
      showToast('Could not sync removal with database.');
    } finally {
      setRemovingId(null);
    }
  };

  // Helper to sanitize and extract clean canonical citation string
  const cleanCitationString = (str) => {
    if (!str || typeof str !== 'string') return '';
    let s = str.trim();
    if (s.startsWith('{') || s.startsWith('[')) return '';
    // If it has "#2026 INSC 666", extract what follows '#'
    if (s.includes('#')) {
      const parts = s.split('#');
      const after = parts[parts.length - 1].trim();
      if (after) return after;
    }
    return s;
  };

  // Format Citation display string without ever leaking raw JSON or awkward prefixes
  const getCitationDisplay = (c) => {
    if (!c) return 'Authentic Precedent';

    // 1. Direct string fields
    if (typeof c.citation === 'string' && c.citation.trim() && !c.citation.trim().startsWith('{')) {
      const cln = cleanCitationString(c.citation);
      if (cln) return cln;
    }
    if (typeof c.citations_string === 'string' && c.citations_string.trim()) {
      const cln = cleanCitationString(c.citations_string);
      if (cln) return cln;
    }

    // 2. Parse citations array/object
    let raw = c.citations;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          raw = JSON.parse(trimmed);
        } catch (e) {
          // not json
        }
      } else {
        const cln = cleanCitationString(trimmed);
        if (cln) return cln;
      }
    }

    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0];
      if (typeof first === 'string') {
        const cln = cleanCitationString(first);
        if (cln) return cln;
      }
      if (typeof first === 'object' && first !== null) {
        if (first.number) {
          const numStr = cleanCitationString(String(first.number));
          if (/INSC|SCC|AIR|SCALE|SCR|DLR/i.test(numStr)) {
            return numStr;
          }
          if (first.year && first.court) {
            return `${first.year} (${first.court}) ${numStr}`;
          }
          return numStr;
        }
        if (first.citation_string) {
          const cln = cleanCitationString(first.citation_string);
          if (cln) return cln;
        }
        if (first.citation) {
          const cln = cleanCitationString(first.citation);
          if (cln) return cln;
        }
        if (first.equivalentText) {
          const cln = cleanCitationString(first.equivalentText);
          if (cln) return cln;
        }
        if (first.year && first.court) return `${first.year} ${first.court}`;
      }
    } else if (typeof raw === 'object' && raw !== null) {
      if (raw.citation_string) return cleanCitationString(raw.citation_string) || raw.citation_string;
      if (raw.number) return cleanCitationString(String(raw.number)) || String(raw.number);
      if (raw.citation) return cleanCitationString(raw.citation) || raw.citation;
    }

    if (c.case_number) return c.case_number;
    return 'Authentic Precedent';
  };

  // Format decision / judgment date nicely (e.g. 2026-06-30 -> 30 Jun 2026)
  const formatJudgmentDate = (dateVal) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    const s = String(dateVal);
    return s.includes('T') ? s.split('T')[0] : s;
  };

  // Strip simple HTML tags from headnote or text snippets
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  // If user is not logged in, display clean "Sign In Required" card
  if (!loading && !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 w-full font-jakarta my-auto min-h-[calc(100vh-3.5rem)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-7 text-center"
        >
          <div className="w-14 h-14 bg-primary-50 text-primary-600 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1.5 font-jakarta tracking-tight">
            Sign In Required
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 max-w-xs mx-auto">
            Please log in with your registered mobile number and 4-digit MPIN to access your subscriber profile and saved case bookmarks.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98] shadow-md hover:shadow-primary-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <User size={15} />
            <span>Go to Login</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    );
  }

  const activeUser = profileData || user || {};

  return (
    <div className="flex-1 w-full bg-[#FAFBFF] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-jakarta">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-18 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2"
            >
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Profile Header & Tab Navigation Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden"
        >
          {/* Top Identity Row */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5 text-center sm:text-left">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-600 via-primary-600 to-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm shadow-blue-500/20 ring-3 ring-blue-50 tracking-wider">
                  {getInitials(activeUser.name)}
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-2xs" title="Verified Subscriber">
                  <ShieldCheck size={10} />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize tracking-tight font-jakarta">
                    {activeUser.name || 'Subscriber Practitioner'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <ShieldCheck size={10} className="text-emerald-600" />
                    Verified Practitioner
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500 font-medium">
                  {activeUser.mobile && (
                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <Phone size={11} className="text-slate-400" />
                      +91 {activeUser.mobile}
                    </span>
                  )}
                  {activeUser.dob && (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <Calendar size={11} className="text-slate-400" />
                      DOB: <strong className="text-slate-700 font-semibold">{formatDob(activeUser.dob)}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Session Log Out & Permanent Account Deletion */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Sign out of your session on this device"
              >
                <LogOut size={12} className="text-slate-500" />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Permanently delete your registered account and bookmarks"
              >
                <Trash2 size={12} className="text-red-500" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 sm:px-5 bg-slate-50/70 border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'border-primary-600 text-primary-600 bg-white/70 rounded-t-lg font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bookmark size={14} />
              <span>Saved Judgments</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'bookmarks' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {savedCases.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'border-primary-600 text-primary-600 bg-white/70 rounded-t-lg font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings size={14} />
              <span>Account & Settings</span>
            </button>
          </div>
        </motion.div>

        {/* 2. TAB CONTENT: SAVED JUDGMENTS LIBRARY */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-3.5">
            
            {/* Section Header Bar */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-jakarta">
                  Saved Judgments ({savedCases.length})
                </h2>
                <p className="text-[11px] text-slate-500 font-normal">
                  Authentic precedent bookmarks saved to your database profile
                </p>
              </div>

              {savedCases.length > 0 && (
                <Link
                  to="/search"
                  className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Search More</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {/* Bookmarks Stream */}
            {loadingCases ? (
              <div className="space-y-3">
                {[1, 2].map((idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 animate-pulse space-y-2.5">
                    <div className="h-3.5 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : savedCases.length === 0 ? (
              /* Compact Empty State */
              <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200/90 text-center shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 font-jakarta">
                  No Saved Judgments Yet
                </h3>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3.5 leading-relaxed">
                  Bookmark Supreme Court and High Court precedents while researching to access them instantly from your profile.
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                >
                  <Search size={13} />
                  <span>Search Precedents Now</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              /* Rich Full-Width Precedent Cards Stream */
              <div className="space-y-3">
                {savedCases.map((c) => {
                  const caseId = c.id || c.case_id;
                  const citationText = getCitationDisplay(c);
                  const courtText = c.court || c.court_name || 'Supreme Court of India';
                  const formattedDate = formatJudgmentDate(c.judgment_date || c.judgmentDate || c.year);
                  const cleanSummary = stripHtml(c.head_note || c.summary);

                  return (
                    <motion.div
                      key={caseId}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="bg-white rounded-xl p-3.5 sm:p-4.5 border border-slate-200/90 hover:border-primary-400 hover:shadow-sm transition-all group"
                    >
                      {/* Top Header Row: Citation + Court Tag + Decision Date + Trash */}
                      <div className="flex items-center justify-between gap-2.5 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200/80 tracking-wide">
                            <Scale size={11} className="text-blue-500 shrink-0" />
                            <span>{citationText}</span>
                          </span>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {courtText}
                          </span>

                          {formattedDate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-normal bg-slate-50 text-slate-500 border border-slate-200/70">
                              <Calendar size={11} className="text-slate-400 shrink-0" />
                              <span>Decided: <strong className="text-slate-700 font-semibold">{formattedDate}</strong></span>
                            </span>
                          )}
                        </div>

                        {/* Remove Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveBookmark(c, e)}
                          disabled={removingId === String(caseId)}
                          className="shrink-0 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Remove from saved bookmarks"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Full Case Title */}
                      <Link to={`/judgment/${caseId}`}>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-snug my-1.5 font-jakarta">
                          {c.title || c.case_number || 'Precedent Judgment'}
                        </h3>
                      </Link>

                      {/* Snippet / Headnote if available */}
                      {cleanSummary && (
                        <div className="bg-slate-50/80 rounded-lg p-2.5 sm:p-3 border border-slate-100/90 text-[11px] sm:text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                          <span className="font-semibold text-slate-800">Headnote Excerpt: </span>
                          {cleanSummary}
                        </div>
                      )}

                      {/* Bottom Action Footer */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Synced with PostgreSQL Database
                        </span>

                        <Link
                          to={`/judgment/${caseId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-all shadow-2xs group/btn cursor-pointer"
                        >
                          <span>View Full Judgment</span>
                          <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* 3. TAB CONTENT: ACCOUNT & SETTINGS */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            
            {/* Practitioner Profile Details Card */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 font-jakarta">
                <User size={15} className="text-primary-600" />
                <span>Practitioner Profile Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">Full Name</span>
                  <span className="font-semibold text-slate-800 text-xs sm:text-sm capitalize">{activeUser.name || 'Advocate'}</span>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">Registered Mobile</span>
                  <span className="font-semibold text-slate-800 text-xs sm:text-sm">+91 {activeUser.mobile}</span>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{formatDob(activeUser.dob) || 'Not Provided'}</span>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">Saved Precedents</span>
                  <span className="font-semibold text-slate-800">{savedCases.length} Judgments Bookmarked</span>
                </div>
              </div>
            </div>

            {/* Session & Security Card */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2 font-jakarta">
                <Lock size={15} className="text-primary-600" />
                <span>Session & Security</span>
              </h2>
              <p className="text-[11px] text-slate-500 mb-3">
                Manage your active session and authentication credentials.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Fast 4-Digit MPIN</h4>
                  <p className="text-[11px] text-slate-500">
                    Protected with registered mobile number and date of birth verification.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <LogOut size={12} className="text-slate-500" />
                  <span>Log Out Session</span>
                </button>
              </div>
            </div>

            {/* Danger Zone: Permanent Account Deletion */}
            <div className="bg-red-50/40 rounded-xl p-4 sm:p-5 border border-red-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-sm font-bold text-red-700 flex items-center gap-1.5 mb-1 font-jakarta">
                    <AlertTriangle size={15} className="text-red-600" />
                    <span>Danger Zone: Permanent Account Deletion</span>
                  </h2>
                  <p className="text-[11px] text-red-600/90 max-w-lg leading-relaxed">
                    Permanently delete your registered account and wipe all {savedCases.length} bookmarked judgments from PostgreSQL. This cannot be undone.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  <Trash2 size={12} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Permanent Delete Account Confirmation Popup Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="p-5 pb-3 flex items-start justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Delete Account Permanently?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Irreversible database removal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !deletingAccount && setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-3.5">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete your account registered with mobile{' '}
                  <strong className="text-slate-900 font-semibold">+91 {activeUser.mobile}</strong>?
                </p>
                
                <div className="bg-red-50/90 border border-red-200 rounded-xl p-3.5 text-xs text-red-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-red-800">
                    <AlertTriangle size={14} className="text-red-600 shrink-0" />
                    <span>Permanent Database Erase Warning:</span>
                  </p>
                  <ul className="list-disc list-inside pl-1 text-[11px] text-red-700 space-y-1 leading-normal">
                    <li>Your practitioner profile and mobile number credentials will be erased.</li>
                    <li>All <strong>{savedCases.length} bookmarked judgments</strong> will be permanently wiped from PostgreSQL.</li>
                    <li>This action cannot be undone.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Need temporary sign out?</strong> Use the <strong>Log Out</strong> button instead to simply end your current device session.
                </div>

                {deleteError && (
                  <div className="bg-red-100 border border-red-300 text-red-800 p-2.5 rounded-xl text-xs font-semibold">
                    {deleteError}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/70 border border-slate-200 bg-white transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel / Keep Account
                </button>

                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={handlePermanentDeleteAccount}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm hover:shadow-red-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                >
                  {deletingAccount ? (
                    <span>Deleting from DB...</span>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
