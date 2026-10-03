import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, CheckCircle2, Landmark, Award, Scale } from 'lucide-react';
import { MOCK_LAWYER_SETTINGS } from '../data/adminMockData';
import { API_BASE_URL } from '../config/api';

export default function About() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('siteSettings');
    return saved ? JSON.parse(saved) : MOCK_LAWYER_SETTINGS;
  });

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/settings`);
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          setSettings(json.data);
          localStorage.setItem('siteSettings', JSON.stringify(json.data));
        }
      } catch (err) {
        // Fallback to localStorage or mock data
      }
    };
    fetchPublicSettings();

    const handleUpdate = () => {
      const saved = localStorage.getItem('siteSettings');
      if (saved) setSettings(JSON.parse(saved));
    };

    window.addEventListener('siteSettingsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const about = settings.aboutPage || MOCK_LAWYER_SETTINGS.aboutPage;

  const founder = {
    name: about.founder1Name || "Senior Advocate & Founder Name",
    title: about.founder1Title || "Senior Advocate & Managing Founder",
    court: about.founder1Court || "Supreme Court of India",
    experience: about.founder1Experience || "25+ Years Bar Practice",
    barNo: about.founder1BarNo || "Bar Registration No.",
    specialization: Array.isArray(about.founder1Specialization)
      ? about.founder1Specialization
      : (typeof about.founder1Specialization === 'string' && about.founder1Specialization.trim()
          ? about.founder1Specialization.split(',').map(s => s.trim()).filter(Boolean)
          : ["Constitutional Law", "Supreme Court Appeals", "Commercial Writs", "Appellate Litigation"]),
    image: about.founder1Image || null,
    bio: about.founder1Bio || "Founder profile details, legal background, bar accomplishments, and leadership overview will be added here.",
    badge: "FOUNDING PARTNER"
  };

  const team = (about.teamMembers && about.teamMembers.length > 0) 
    ? about.teamMembers.map((m, idx) => ({
        ...m,
        avatarBg: idx % 4 === 0 ? "bg-primary-600" : idx % 4 === 1 ? "bg-indigo-600" : idx % 4 === 2 ? "bg-blue-600" : "bg-slate-800"
      }))
    : MOCK_LAWYER_SETTINGS.aboutPage.teamMembers;

  return (
    <div 
      className="flex-1 w-full font-jakarta min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: "url('/about_bg.jpg')" }}
    >
      
      {/* Senior Founder & Managing Lawyer Showcase */}
      <section className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6 md:mb-8">
          <span className="text-primary-600 font-extrabold tracking-widest uppercase text-[10px] px-3 py-0.5 bg-primary-50 border border-primary-100 rounded-full inline-block">
            LEADERSHIP & LEGAL BAR EXPERIENCE
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-cinzel">
            Senior Advocate & Founder
          </h2>
          <p className="text-slate-600 text-xs md:text-sm">
            Guided by active Supreme Court and High Court litigation practice.
          </p>
        </div>

        {/* Centered Single Founder Card — Modern Executive Partner Layout */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            
            {/* Ambient luxury background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/40 via-blue-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 relative z-10">
              
              {/* Left Column: Portrait with Soft Gold/Navy Aura */}
              <div className="flex flex-col items-center shrink-0 w-full sm:w-auto">
                <div className="relative group/photo">
                  {/* Outer soft gold halo */}
                  <div className="absolute -inset-1.5 bg-gradient-to-b from-amber-300/40 to-blue-600/30 rounded-3xl blur-xs group-hover/photo:blur-sm transition-all duration-300 opacity-70" />
                  
                  {/* Portrait frame */}
                  <div className="relative w-56 sm:w-64 h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-xl flex items-center justify-center">
                    {founder.image ? (
                      <img 
                        src={founder.image} 
                        alt={founder.name} 
                        className="w-full h-full object-cover object-top group-hover/photo:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shadow-inner">
                          <User size={32} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Advocate Profile</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bar Verified Seal below photo */}
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/90 rounded-full text-emerald-800 text-[11px] font-bold shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Bar Verified Practitioner</span>
                </div>
              </div>

              {/* Right Column: Prestigious Legal Credentials & Bio */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                
                {/* Court Tag */}
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Landmark size={14} className="text-primary-600" />
                  <span>{founder.court || 'Supreme Court of India'}</span>
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-cinzel leading-tight">
                    {founder.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-primary-700 tracking-wide uppercase mt-1">
                    {founder.title}
                  </p>
                </div>

                {/* Credential Badges Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  {founder.experience && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1 rounded-lg transition-colors">
                      <Award size={13} className="text-amber-600" />
                      <span>{founder.experience}</span>
                    </span>
                  )}
                  {founder.barNo && (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-bold px-3 py-1 rounded-lg">
                      <ShieldCheck size={13} className="text-blue-600" />
                      <span>{founder.barNo}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-semibold px-3 py-1 rounded-lg">
                    Supreme Court Senior Bar
                  </span>
                </div>

                {/* Editorial Quote Box */}
                {founder.bio && (
                  <div className="p-4 bg-slate-50/80 border-l-4 border-primary-600 rounded-r-2xl border border-slate-200/60 shadow-2xs text-left">
                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                      "{founder.bio}"
                    </p>
                  </div>
                )}

                {/* Practice Specializations */}
                {founder.specialization && founder.specialization.length > 0 && (
                  <div className="pt-2 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">
                      Practice Specializations
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                      {founder.specialization.map((spec, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1 rounded-lg shadow-3xs transition-colors"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* Legal Research & Editorial Team Section */}
      <section className="pt-6 pb-10 md:pt-8 md:pb-12 bg-white/85 backdrop-blur-xs border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
            <span className="text-primary-600 font-extrabold tracking-widest uppercase text-[10px] px-3 py-0.5 bg-primary-50 border border-primary-100 rounded-full inline-block">
              EDITORIAL & RESEARCH BOARD
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-cinzel">
              Legal Research & Editorial Board
            </h2>
            <p className="text-slate-600 text-xs md:text-sm">
              A dedicated team of senior advocates, judicial clerks, and legal researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {team.map((m, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 hover:bg-white hover:border-primary-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Avatar Circle */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${m.avatarBg} text-white font-black text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors leading-tight">
                        {m.name}
                      </h4>
                      <span className="text-[10px] font-bold text-primary-600 block mt-0.5">
                        {m.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] font-semibold mb-2">
                    {m.qual}
                  </p>

                  <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                    <strong className="text-slate-800">Domain Focus:</strong> {m.focus}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">Verified Contributor</span>
                  <ShieldCheck size={13} className="text-primary-600" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
