import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, ArrowLeft } from 'lucide-react';

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    ...(user ? [{ label: 'Search', path: '/search' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
           
           {/* Left: Original Logo Image */}
           <div className="flex items-center">
             <Link to="/" className="cursor-pointer flex items-center" title="Return to Home">
               <img 
                 src="/logo/digital_law_reporter.png" 
                 alt="Digital Law Reporter" 
                 className="h-10 md:h-12 object-contain" 
               />
             </Link>
           </div>

           {/* Right: Nav Links & Actions */}
           <div className="flex items-center space-x-3 md:space-x-8">
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
               <nav className="hidden md:flex items-center space-x-5 lg:space-x-6">
                 {navItems.map((item) => {
                   const isActive = location.pathname === item.path || 
                     (item.path === '/' && location.pathname === '/') ||
                     (item.path === '/search' && location.pathname.startsWith('/search'));
                   return (
                     <Link
                       key={item.path}
                       to={item.path}
                       className={`relative text-sm transition-colors py-1 border-b-2 ${
                         isActive 
                           ? 'text-primary-700 font-bold border-primary-600' 
                           : 'text-slate-700 font-semibold border-transparent hover:text-primary-600 hover:border-primary-400/30'
                       }`}
                     >
                       {item.label}
                     </Link>
                   );
                 })}
               </nav>
             )}

              {/* Right Action Buttons: Login & User */}
              {!isAuthPage && (
                user ? (
                  <div className="flex items-center">
                    {/* Circular Initial Avatar (Navigates to /profile) */}
                    <Link 
                      to="/profile"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300"
                      title={`Signed in as ${user.name || 'User'} - Click to view profile`}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Link>
                  </div>
                ) : (
                 <div className="flex items-center space-x-3">
                   <Link 
                     to="/login" 
                     className="border border-slate-300 text-slate-800 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50/50 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                   >
                     <User size={15} className="text-primary-600" />
                     <span>Login</span>
                   </Link>
                 </div>
               )
             )}

             {/* Mobile Hamburger Toggle Button */}
             {!isAuthPage && (
               <button
                 type="button"
                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 className="md:hidden p-2 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-slate-100 transition-colors cursor-pointer"
                 aria-label="Toggle Menu"
               >
                 {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
               </button>
             )}
           </div>

        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {!isAuthPage && isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/' && location.pathname === '/') ||
                (item.path === '/search' && location.pathname.startsWith('/search'));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/profile"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <User size={15} />
                <span>My Profile ({user.name ? user.name.split(' ')[0] : 'User'})</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-bold transition-colors"
              >
                <User size={16} />
                <span>Sign In / Register</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
