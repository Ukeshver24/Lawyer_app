import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('user');

  const handleHeroAction = () => {
    if (isLoggedIn) {
      navigate('/search');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative py-12 md:py-16 lg:py-20 border-b border-[#D4AF37]/30 overflow-hidden bg-slate-950 flex items-center justify-center font-jakarta">
      
      {/* Authentic Photo Background of Supreme Court of India */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('/supreme_court_india.jpg')" }}
      ></div>

      {/* Luxury Gradient Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0A1128]/85 via-[#0A1128]/75 to-[#070F1E]/95 backdrop-blur-[1px]"></div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
      ></div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center w-full space-y-8 md:space-y-10">
        
        {/* 1. Header Badge */}
        <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-primary-600/90 border border-primary-400/40 text-white text-xs md:text-sm font-semibold shadow-xl backdrop-blur-md animate-fade-in">
          <ShieldCheck size={16} className="text-white" />
          <span className="tracking-widest uppercase text-[11px] md:text-xs font-bold text-white">SUPREME COURT OF INDIA & HIGH COURTS VERIFIED REPOSITORY</span>
        </div>

        {/* 2. Main Title with Unique Cinzel Font */}
        <div className="flex flex-col items-center space-y-4 md:space-y-6 max-w-5xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-cinzel text-white leading-[1.15] tracking-wide drop-shadow-2xl">
            COMPREHENSIVE <span className="bg-gradient-to-r from-sky-200 via-white to-blue-400 bg-clip-text text-transparent">CASE LAW</span> RESEARCH SIMPLIFIED
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-3xl font-normal leading-relaxed drop-shadow">
            Access over 2.4+ million verified Supreme Court & High Court judgments, ratio decidendi summaries, and official citations.
          </p>
        </div>

        {/* 3. Action Button: Go to Legal Search / Login to Search */}
        <div className="flex justify-center pt-2">
          <button 
            onClick={handleHeroAction}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-9 py-4 rounded-xl text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-primary-500/25 border border-primary-500/30 flex items-center gap-3 active:scale-95 group"
          >
            <User size={20} className="stroke-[2.5]" />
            <span>{isLoggedIn ? "Go to Legal Search" : "Login to Search"}</span>
            <ArrowRight size={20} className="stroke-[2.5]" />
          </button>
        </div>
        
        {/* 4. Executive Platform Stats */}
        <div className="pt-10 border-t border-slate-800/80 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-white">2.4M+</span>
            <span className="text-xs text-slate-300 font-medium">Verbatim Case Laws</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-400">100%</span>
            <span className="text-xs text-slate-300 font-medium">Court Certified Rulings</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-white">28+</span>
            <span className="text-xs text-slate-300 font-medium">High Courts & SC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-300">Sub-second</span>
            <span className="text-xs text-slate-300 font-medium">Search Accuracy</span>
          </div>
        </div>

      </div>
    </div>
  );
}






