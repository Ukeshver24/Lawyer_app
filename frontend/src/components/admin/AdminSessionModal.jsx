import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export default function AdminSessionModal({ 
  isOpen, 
  countdown, 
  onContinue, 
  onLeave, 
  isRenewing 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(8,112,184,0.15)] relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Alert Icon */}
          <div className="flex items-center justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-xs">
              <Clock size={28} className="animate-pulse" />
            </div>
          </div>

          {/* Modal Header Title */}
          <div className="text-center mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-1.5">
              Admin Session Expiring
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              Your admin session is about to expire. Would you like to continue working?
            </p>
          </div>

          {/* Dynamic 20-Second Countdown Counter Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tracking-tight mb-1">
              {countdown}s
            </div>
            <p className="text-xs font-bold text-slate-600">
              Automatically logging out in <span className="text-amber-600">{countdown} seconds</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isRenewing}
              onClick={onContinue}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isRenewing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Renewing Session...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Continue Session</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isRenewing}
              onClick={onLeave}
              className="w-full sm:flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <LogOut size={16} className="text-slate-500" />
              <span>Leave Site</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
