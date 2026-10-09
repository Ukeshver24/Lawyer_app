import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, User, Menu, X, ArrowLeft, Home, Search, 
  Info, Phone, Bookmark, ShieldCheck, ChevronRight, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    const updateUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, [location.pathname]);

  // Close drawer automatically on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Legal Search', path: '/search', icon: Search },
    { label: 'About Us', path: '/about', icon: Info },
    { label: 'Contact', path: '/contact', icon: Phone },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            
            {/* Left Section: Mobile Menu Icon & Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Hamburger Toggle Button - Positioned at LEFT CORNER */}
              {!isAuthPage && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 -ml-1 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Open Navigation Drawer"
                >
                  <Menu size={24} className="text-slate-800" />
                </button>
              )}

              {/* Logo */}
              <Link to="/" className="cursor-pointer flex items-center" title="Return to Home">
                <img 
                  src="/logo/digital_law_reporter.png" 
                  alt="Digital Law Reporter" 
                  className="h-9 sm:h-10 md:h-11 object-contain" 
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            {!isAuthPage && (
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path === '/' && location.pathname === '/') ||
                    (item.path === '/search' && location.pathname.startsWith('/search'));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative text-sm transition-colors py-1 border-b-2 font-medium ${
                        isActive 
                          ? 'text-blue-700 font-bold border-blue-600' 
                          : 'text-slate-700 border-transparent hover:text-blue-600 hover:border-blue-400/30'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right: Auth Page Back Button OR User Actions */}
            <div className="flex items-center space-x-2.5 sm:space-x-4">
              {isAuthPage ? (
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                  title="Return to Home Page"
                >
                  <ArrowLeft size={14} className="text-slate-500" />
                  <span>Back to Home</span>
                </Link>
              ) : (
                user ? (
                  <div className="flex items-center gap-2">
                    {/* Circular Initial Avatar (Navigates to /profile) */}
                    <Link 
                      to="/profile"
                      className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300"
                      title={`Signed in as ${user.name || 'User'} - Click to view profile`}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Link>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    className="border border-slate-300 text-slate-800 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50/50 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <User size={15} className="text-blue-600" />
                    <span>Login</span>
                  </Link>
                )
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Left-Side Sliding Navigation Drawer (Mobile) */}
      <AnimatePresence>
        {!isAuthPage && isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden"
            />

            {/* Drawer Panel Sliding From Left */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-[285px] max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between md:hidden overflow-y-auto"
            >
              {/* Drawer Top Header */}
              <div>
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/logo/digital_law_reporter.png" 
                      alt="Digital Law Reporter" 
                      className="h-8 object-contain" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    aria-label="Close Drawer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Profile Card inside Drawer (if logged in) */}
                {user ? (
                  <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs ring-2 ring-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {user.name || 'Advocate'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {user.mobile || user.email || 'Verified Member'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 border-b border-blue-100/50">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Access verified case laws & ratio decidendi
                    </p>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <User size={14} />
                      <span>Sign In / Register</span>
                    </Link>
                  </div>
                )}

                {/* Drawer Navigation List (One by one with icons) */}
                <div className="p-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                    Menu Navigation
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || 
                        (item.path === '/' && location.pathname === '/') ||
                        (item.path === '/search' && location.pathname.startsWith('/search'));

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon 
                              size={19} 
                              className={isActive ? 'text-blue-600' : 'text-slate-500'} 
                            />
                            <span>{item.label}</span>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </Link>
                      );
                    })}

                    {/* Authenticated User Links */}
                    {user && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/profile'
                              ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <User size={19} className="text-slate-500" />
                            <span>My Profile</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-400" />
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </div>

              {/* Drawer Bottom Actions: Logout / Admin Link */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1.5">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={18} />
                      <span>Log Out</span>
                    </div>
                  </button>
                ) : null}

                <Link
                  to="/admin/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-slate-400" />
                    <span>Admin Portal</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="h-14 w-full shrink-0 pointer-events-none opacity-0 print:hidden" aria-hidden="true" />
    </>
  );
}
