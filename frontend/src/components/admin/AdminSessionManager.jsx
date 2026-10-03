import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSessionModal from './AdminSessionModal';

export default function AdminSessionManager({ children }) {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [isRenewing, setIsRenewing] = useState(false);

  const lastUserActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Clear all admin auth state and redirect to /admin
  const handlePerformLogout = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    const session = localStorage.getItem('adminSession');
    const sessionId = session ? (typeof session === 'string' ? JSON.parse(session).sessionId : session.sessionId) : null;

    try {
      if (token) {
        await fetch('http://localhost:5000/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-admin-session-id': sessionId || ''
          }
        });
      }
    } catch (e) {
      console.warn('Logout API call notice:', e);
    }

    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminSessionExpiresAt');

    setIsModalOpen(false);
    navigate('/admin', { replace: true });
  }, [navigate]);

  // Track User Activity (mouse, keypress, click, scroll, touch)
  // ONLY used to determine if admin is active/inactive near session expiration!
  // DOES NOT auto-extend the 1-hour session.
  useEffect(() => {
    const handleUserActivity = () => {
      lastUserActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, []);

  // Multi-Tab Synchronization via Storage Event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'adminAuth' && e.newValue !== 'true') {
        // Logged out in another tab
        handlePerformLogout();
      } else if (e.key === 'adminSessionExpiresAt') {
        // Renewed in another tab -> close modal if open
        setIsModalOpen(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handlePerformLogout]);

  // Tab Visibility Change (Verify actual server-side session when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('adminToken');
        const session = localStorage.getItem('adminSession');
        let sessionId = null;
        try {
          sessionId = session ? (typeof session === 'string' && session.startsWith('{') ? JSON.parse(session).sessionId : session) : null;
        } catch (e) {}

        if (!token || !sessionId) {
          handlePerformLogout();
          return;
        }

        try {
          const res = await fetch('http://localhost:5000/api/admin/session-status', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-admin-session-id': sessionId
            }
          });
          const data = await res.json();
          if (data.status === 'success' && data.expiresAt) {
            localStorage.setItem('adminSessionExpiresAt', String(data.expiresAt));
          } else {
            handlePerformLogout();
          }
        } catch (e) {
          handlePerformLogout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handlePerformLogout]);

  // Continue Session Handler (Called ONLY when admin clicks Continue Session button)
  const handleContinueSession = async () => {
    setIsRenewing(true);
    const token = localStorage.getItem('adminToken');
    const session = localStorage.getItem('adminSession');
    let sessionId = null;
    try {
      sessionId = session ? (typeof session === 'string' && session.startsWith('{') ? JSON.parse(session).sessionId : session) : null;
    } catch (e) {}

    if (!token || !sessionId) {
      setIsRenewing(false);
      handlePerformLogout();
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/renew-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-admin-session-id': sessionId
        }
      });
      const data = await res.json();
      setIsRenewing(false);

      if (data.status === 'success' && data.session && data.session.expiresAt) {
        localStorage.setItem('adminSessionExpiresAt', String(data.session.expiresAt));
        setIsModalOpen(false);
      } else {
        handlePerformLogout();
      }
    } catch (e) {
      setIsRenewing(false);
      handlePerformLogout();
    }
  };

  // Main 1-Second Timer Loop checking Session Expiration
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const expiresAtStr = localStorage.getItem('adminSessionExpiresAt');
      if (!expiresAtStr) return;

      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      const remainingMs = expiresAt - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      const warningWindowSec = 20;

      if (remainingMs <= 0) {
        // Session fully expired -> Auto Logout
        handlePerformLogout();
      } else if (remainingSec <= warningWindowSec) {
        // Within 20-second warning window
        // Check if admin is active (moved mouse/typed within last 5 mins)
        const isActiveAdmin = (now - lastUserActivityRef.current) < (5 * 60 * 1000);

        if (isActiveAdmin) {
          setIsModalOpen(true);
          setCountdown(remainingSec);
        } else {
          // Admin is INACTIVE -> Auto Logout without waiting for popup!
          handlePerformLogout();
        }
      } else {
        // Session normal (> 20s remaining)
        if (isModalOpen) setIsModalOpen(false);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handlePerformLogout, isModalOpen]);

  return (
    <>
      {children}
      <AdminSessionModal
        isOpen={isModalOpen}
        countdown={countdown}
        onContinue={handleContinueSession}
        onLeave={() => handlePerformLogout()}
        isRenewing={isRenewing}
      />
    </>
  );
}
