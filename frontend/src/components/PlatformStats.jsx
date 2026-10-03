import React from 'react';
import { Search, BookOpen, Users, Landmark, Calendar, Folder, CheckCircle2 } from 'lucide-react';

export default function PlatformStats() {
  const leftColumnCapabilities = [
    {
      icon: <Search size={20} />,
      title: "Keyword Search",
      desc: "Query legal terms, statutory sections, ratio decidendi, and precedent arguments with sub-second accuracy across millions of judgments.",
      tag: "FULL-TEXT INDEX",
      featurePill: "Boolean Search (AND, OR, NOT)"
    },
    {
      icon: <BookOpen size={20} />,
      title: "Citation Search",
      desc: "Instantly lookup official SCC, INSC, AIR, SCALE, and State High Court reporter citations with exact volume and page matching.",
      tag: "EXACT CITATION",
      featurePill: "SCC, INSC, AIR, SCALE & High Courts"
    },
    {
      icon: <Users size={20} />,
      title: "Party Name Search",
      desc: "Filter proceedings by Petitioner name, Respondent name, Senior Advocate appearances, or specific judicial bench compositions.",
      tag: "BENCH & COUNSEL",
      featurePill: "Petitioner vs Respondent & Counsel"
    }
  ];

  const rightColumnCapabilities = [
    {
      icon: <Landmark size={20} />,
      title: "Court Filtering",
      desc: "Narrow down search results to the Supreme Court of India, all 28 State High Courts, NCLAT, NGT, and specialized appellate tribunals.",
      tag: "28+ HIGH COURTS",
      featurePill: "Supreme Court & All State High Courts"
    },
    {
      icon: <Calendar size={20} />,
      title: "Year Range Filter",
      desc: "Segment case law decisions across specific decades, landmark eras (1800–2026), or custom date ranges for historical analysis.",
      tag: "1800 - 2026 ERAS",
      featurePill: "Landmark Decadal Era Segmentation"
    },
    {
      icon: <Folder size={20} />,
      title: "Topic Indexing",
      desc: "Systematically pre-categorized by Constitutional Law, Criminal Code (IPC/BNSS), Corporate Acts, Tax, and Intellectual Property.",
      tag: "50+ SUBJECTS",
      featurePill: "Constitutional, Criminal, Corporate & Tax"
    }
  ];

  return (
    <section className="relative pt-4 md:pt-6 pb-8 md:pb-10 border-b border-slate-200 overflow-hidden bg-slate-50 font-jakarta">
      
      {/* Subtle Supreme Court / Legal Environment Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url('/subtle_legal_bg.jpg')" }}
      ></div>

      {/* Light White/Blue-Gray Radial Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-50/90 via-slate-50/95 to-slate-50/90 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-5 md:mb-6 text-center max-w-3xl mx-auto space-y-2">
          <span className="text-primary-600 font-extrabold tracking-widest uppercase text-xs px-3.5 py-1 bg-white border border-primary-100 rounded-full inline-block shadow-2xs">
            Search Capabilities
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight font-cinzel">
            Precision Research Tools
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            Multiple search vectors designed for exact legal discovery and courtroom preparation.
          </p>
        </div>

        {/* 2 Side-by-Side Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-6xl mx-auto">
          
          {/* Left Column */}
          <div className="space-y-5 sm:space-y-6">
            {leftColumnCapabilities.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-primary-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon Badge & Feature Tag */}
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#D4AF37] group-hover:text-[#0A1128] transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-primary-700 bg-primary-50 border border-primary-100 px-3 py-0.5 rounded-full uppercase">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 group-hover:text-primary-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mb-4 font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Feature Pill */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-primary-600 shrink-0" />
                  <span>{item.featurePill}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-5 sm:space-y-6">
            {rightColumnCapabilities.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-primary-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon Badge & Feature Tag */}
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0A1128] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-700 bg-slate-100 border border-slate-200 px-3 py-0.5 rounded-full uppercase">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 group-hover:text-primary-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mb-4 font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Feature Pill */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-primary-600 shrink-0" />
                  <span>{item.featurePill}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}








