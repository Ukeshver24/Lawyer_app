import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Menu, X, Bell, User, ChevronDown, ChevronRight, Plus, FileText, CheckCircle2, Home, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSessionManager from './AdminSessionManager';
import { API_BASE_URL } from '../../config/api';

export default function AdminLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isCasesExpanded, setIsCasesExpanded] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminRole, setAdminRole] = useState(() => localStorage.getItem('adminRole') || 'MAIN_ADMIN');
  const profileRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleAdminRole = (newRole) => {
    localStorage.setItem('adminRole', newRole);
    setAdminRole(newRole);
    if (newRole === 'EXTRA_ADMIN' && location.pathname === '/admin/manage-admin') {
      navigate('/admin/dashboard');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin');
      return;
    }

    const currentRole = localStorage.getItem('adminRole') || 'MAIN_ADMIN';
    if (!localStorage.getItem('adminRole')) {
      localStorage.setItem('adminRole', 'MAIN_ADMIN');
    }
    setAdminRole(currentRole);

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/cases')) {
      setIsCasesExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    const sessionId = localStorage.getItem('adminSessionId');
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-admin-session-id': sessionId || ''
          }
        });
      }
    } catch (e) {}

    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    navigate('/admin');
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsSidebarExpanded(!isSidebarExpanded);
    }
  };

  const isDashboardActive = location.pathname === '/admin/dashboard' || location.pathname === '/admin';
  const isCasesParentActive = location.pathname.startsWith('/admin/cases');
  const isUsersActive = location.pathname.startsWith('/admin/users');
  const isSettingsActive = location.pathname.startsWith('/admin/settings');

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-jakarta text-[#0B1727] relative">
      
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Collapsible Fixed Admin Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 h-screen z-40 bg-white border-r border-slate-200/80 
          flex flex-col shrink-0 transition-all duration-300 ease-in-out
          ${isMobile 
            ? (isMobileOpen ? 'translate-x-0 w-60 z-50 shadow-2xl' : '-translate-x-full w-60 z-50') 
            : (isSidebarExpanded ? 'w-60' : 'w-16')
          }
        `}
      >
        <div className="h-full flex flex-col justify-between overflow-x-hidden">
          
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top of Sidebar: Three Lines Menu Button Only */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-slate-100 shrink-0">
              <button 
                onClick={toggleSidebar}
                className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                title={isSidebarExpanded ? "Collapse Sidebar to Icons" : "Open Sidebar Fully"}
              >
                <Menu size={20} />
              </button>

              {isMobile && (
                <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 lg:hidden">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="py-4 space-y-1.5 px-2 flex-1 overflow-y-auto">
              
              {/* 1. Dashboard */}
              <Link
                to="/admin/dashboard"
                onClick={closeSidebarOnMobile}
                title="Dashboard"
                className={`
                  flex items-center gap-3 h-11 transition-all border-l-3 rounded-r-md
                  ${isSidebarExpanded ? 'px-3.5' : 'justify-center px-0'}
                  ${isDashboardActive 
                    ? 'border-primary-600 text-primary-600 bg-slate-50 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                  }
                `}
              >
                <LayoutDashboard size={20} className={isDashboardActive ? 'text-primary-600' : 'text-slate-500'} />
                {isSidebarExpanded && <span className="text-xs font-semibold tracking-wide">Dashboard</span>}
              </Link>

              {/* 2. Cases Submenu Parent */}
              <div>
                <button
                  onClick={() => {
                    if (!isSidebarExpanded) {
                      setIsSidebarExpanded(true);
                      setIsCasesExpanded(true);
                    } else {
                      setIsCasesExpanded(!isCasesExpanded);
                    }
                  }}
                  title="Cases"
                  className={`
                    w-full flex items-center h-11 transition-all border-l-3 rounded-r-md cursor-pointer
                    ${isSidebarExpanded ? 'justify-between px-3.5' : 'justify-center px-0'}
                    ${isCasesParentActive
                      ? 'border-primary-600 text-primary-600 bg-slate-50 font-bold' 
                      : 'border-transparent text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                    }
                  `}
                >
                  <div className={`flex items-center gap-3 ${!isSidebarExpanded && 'justify-center w-full'}`}>
                    <BookOpen size={20} className={isCasesParentActive ? 'text-primary-600' : 'text-slate-500'} />
                    {isSidebarExpanded && <span className="text-xs font-semibold tracking-wide">Cases</span>}
                  </div>
                  {isSidebarExpanded && (
                    isCasesExpanded ? (
                      <ChevronDown size={14} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )
                  )}
                </button>

                {/* Submenu List */}
                <AnimatePresence>
                  {isCasesExpanded && isSidebarExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-7 pr-2 py-1 space-y-0.5"
                    >
                      <Link
                        to="/admin/cases/add"
                        onClick={closeSidebarOnMobile}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-all rounded-md
                          ${location.pathname === '/admin/cases/add'
                            ? 'text-primary-600 font-bold bg-primary-50'
                            : 'text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                          }
                        `}
                      >
                        <Plus size={13} />
                        <span>Add Case</span>
                      </Link>

                      <Link
                        to="/admin/cases"
                        onClick={closeSidebarOnMobile}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-all rounded-md
                          ${location.pathname === '/admin/cases'
                            ? 'text-primary-600 font-bold bg-primary-50'
                            : 'text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                          }
                        `}
                      >
                        <BookOpen size={13} />
                        <span>All Cases</span>
                      </Link>

                      <Link
                        to="/admin/cases/draft"
                        onClick={closeSidebarOnMobile}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-all rounded-md
                          ${location.pathname === '/admin/cases/draft'
                            ? 'text-primary-600 font-bold bg-primary-50'
                            : 'text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                          }
                        `}
                      >
                        <FileText size={13} />
                        <span>Draft</span>
                      </Link>

                      <Link
                        to="/admin/cases/published"
                        onClick={closeSidebarOnMobile}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-all rounded-md
                          ${location.pathname === '/admin/cases/published'
                            ? 'text-primary-600 font-bold bg-primary-50'
                            : 'text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                          }
                        `}
                      >
                        <CheckCircle2 size={13} />
                        <span>Published</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Users */}
              <Link
                to="/admin/users"
                onClick={closeSidebarOnMobile}
                title="Users"
                className={`
                  flex items-center gap-3 h-11 transition-all border-l-3 rounded-r-md
                  ${isSidebarExpanded ? 'px-3.5' : 'justify-center px-0'}
                  ${isUsersActive 
                    ? 'border-primary-600 text-primary-600 bg-slate-50 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                  }
                `}
              >
                <Users size={20} className={isUsersActive ? 'text-primary-600' : 'text-slate-500'} />
                {isSidebarExpanded && <span className="text-xs font-semibold tracking-wide">Users</span>}
              </Link>

              {/* 4. Settings */}
              <Link
                to="/admin/settings"
                onClick={closeSidebarOnMobile}
                title="Settings"
                className={`
                  flex items-center gap-3 h-11 transition-all border-l-3 rounded-r-md
                  ${isSidebarExpanded ? 'px-3.5' : 'justify-center px-0'}
                  ${isSettingsActive 
                    ? 'border-primary-600 text-primary-600 bg-slate-50 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                  }
                `}
              >
                <Settings size={20} className={isSettingsActive ? 'text-primary-600' : 'text-slate-500'} />
                {isSidebarExpanded && <span className="text-xs font-semibold tracking-wide">Settings</span>}
              </Link>

              {/* 5. Manage Admins (MAIN_ADMIN ONLY) */}
              {adminRole === 'MAIN_ADMIN' && (
                <Link
                  to="/admin/manage-admin"
                  onClick={closeSidebarOnMobile}
                  title="Manage Admins"
                  className={`
                    flex items-center gap-3 h-11 transition-all border-l-3 rounded-r-md
                    ${isSidebarExpanded ? 'px-3.5' : 'justify-center px-0'}
                    ${location.pathname === '/admin/manage-admin'
                      ? 'border-primary-600 text-primary-600 bg-slate-50 font-bold' 
                      : 'border-transparent text-slate-500 hover:text-[#0B1727] hover:bg-slate-50'
                    }
                  `}
                >
                  <Shield size={20} className={location.pathname === '/admin/manage-admin' ? 'text-primary-600' : 'text-slate-500'} />
                  {isSidebarExpanded && <span className="text-xs font-semibold tracking-wide">Manage Admins</span>}
                </Link>
              )}

            </div>
          </div>

          {/* Bottom Action: Logout */}
          <div className="p-3 border-t border-slate-100 shrink-0">
            <button
              onClick={handleLogout}
              title="Logout"
              className={`
                w-full flex items-center gap-3 h-10 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer
                ${isSidebarExpanded ? 'px-3' : 'justify-center px-0'}
              `}
            >
              <LogOut size={20} className="shrink-0" />
              {isSidebarExpanded && <span>Logout</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Body */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
        isMobile ? 'w-full' : (isSidebarExpanded ? 'lg:pl-60' : 'lg:pl-16')
      }`}>
        
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200/70 flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 sticky top-0">
          
          {/* Left: Mobile Navigation Hamburger Toggle & Branding Logo */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer active:scale-95 transition-all"
              title="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <img 
                src="/logo/digital_law_reporter.png" 
                alt="Digital Law Reporter" 
                className="h-8 sm:h-9 object-contain"
              />
            </Link>
          </div>

          {/* Right: Admin User Profile */}
          <div className="flex items-center gap-3">

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 rounded-md hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {adminRole === 'MAIN_ADMIN' ? 'MA' : 'EA'}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-bold text-[#0B1727] leading-tight">
                    {adminRole === 'MAIN_ADMIN' ? 'Main Admin' : 'Extra Admin'}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {adminRole === 'MAIN_ADMIN' ? 'MAIN_ADMIN' : 'EXTRA_ADMIN'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden md:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 text-slate-800 text-xs font-medium space-y-1"
                  >
                    <div className="px-4 py-1.5 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Current Role</p>
                      <p className="font-bold text-slate-900 text-xs flex items-center justify-between mt-0.5">
                        <span>{adminRole === 'MAIN_ADMIN' ? 'Main Admin' : 'Extra Admin'}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${adminRole === 'MAIN_ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {adminRole}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <AdminSessionManager />
          <Outlet />
        </main>

      </div>

    </div>
  );
}
