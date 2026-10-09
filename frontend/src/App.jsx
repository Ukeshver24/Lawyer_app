import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// High-Tech Route-Based Code Splitting
// Public & Subscriber Pages (Lazy loaded for instant initial render)
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Search = lazy(() => import('./pages/Search'));
const Judgment = lazy(() => import('./pages/Judgment'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const KeywordSearch = lazy(() => import('./pages/KeywordSearch'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ChildSafety = lazy(() => import('./pages/ChildSafety'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

// Admin Pages (Isolated into separate admin chunk - zero impact on public visitors)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminResetPassword = lazy(() => import('./pages/admin/AdminResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCases = lazy(() => import('./pages/admin/AdminCases'));
const AdminCaseForm = lazy(() => import('./pages/admin/AdminCaseForm'));
const AdminCaseDetail = lazy(() => import('./pages/admin/AdminCaseDetail'));
const AdminDraftCases = lazy(() => import('./pages/admin/AdminDraftCases'));
const AdminPublishedCases = lazy(() => import('./pages/admin/AdminPublishedCases'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const MobileApp = lazy(() => import('./mobile/MobileApp'));

// High-Speed Lightweight Suspense Loader
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px] w-full py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500 tracking-wider">Loading...</span>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isMobilePort = window.location.port === '5174';

  // Automatically scroll to top on page navigation without scroll locking
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (isMobilePort) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MobileApp />
      </Suspense>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const hideFooter = isAuthPage || location.pathname.startsWith('/search') || location.pathname.startsWith('/admin');
  const hideHeader = location.pathname.startsWith('/admin') || location.pathname.startsWith('/search/results');

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen bg-[#FAFBFF] text-slate-900 font-sans relative selection:bg-primary-200 selection:text-primary-900 flex flex-col print:bg-white w-full max-w-full ${isAdminRoute ? '' : 'overflow-x-hidden'}`}>
      {/* Hardware-Accelerated Lightweight Background & Grid (0ms GPU overhead) */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 90% 40%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 30% 90%, rgba(99, 102, 241, 0.07) 0%, transparent 45%),
            radial-gradient(#94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 32px 32px'
        }}
      />
      
      <div className="relative z-10 flex flex-col flex-1 min-h-full">
        {!hideHeader && <Header />}
        
        <main className="flex-1 w-full flex flex-col">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/child-safety" element={<ChildSafety />} />
              <Route path="/childsafety" element={<ChildSafety />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* Protected User Routes (Requires Login) */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/search/keyword" element={<ProtectedRoute><KeywordSearch /></ProtectedRoute>} />
              <Route path="/search/results" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
              <Route path="/judgment/:id" element={<ProtectedRoute><Judgment /></ProtectedRoute>} />
              
              {/* Admin Auth */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/reset-password" element={<AdminResetPassword />} />
              
              {/* Admin Dashboard Routes */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/cases" element={<AdminCases />} />
                <Route path="/admin/cases/add" element={<AdminCaseForm />} />
                <Route path="/admin/cases/edit/:id" element={<AdminCaseForm />} />
                <Route path="/admin/cases/draft" element={<AdminDraftCases />} />
                <Route path="/admin/cases/published" element={<AdminPublishedCases />} />
                <Route path="/admin/cases/:id/edit" element={<AdminCaseForm />} />
                <Route path="/admin/cases/:id" element={<AdminCaseDetail />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUsers />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/manage-admin" element={<AdminManagement />} />
              </Route>
            </Routes>
          </Suspense>
        </main>

        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}
export default App;
