import React, { useState } from 'react';
import { Search, ShieldCheck, FileText, FileDown, Zap, Network, CheckCircle2, ArrowRight, Sparkles, ChevronRight, Layers } from 'lucide-react';

export default function Features() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      icon: <Search size={22} />,
      title: "Advanced Legal Search",
      subtitle: "Full-Text Boolean & Ratio Decidendi Extraction",
      desc: "Search over 2.4 million case laws using legal keywords, statutory provisions, ratio decidendi, and precedent arguments with sub-second accuracy.",
      badge: "AI-POWERED SEARCH",
      highlights: [
        "Boolean operator support (AND, OR, NOT)",
        "Instant ratio decidendi text highlighting",
        "Multi-statute and section filtering"
      ],
      previewStats: { label: "Indexed Records", value: "2,400,000+" },
      previewColor: "from-blue-600 to-indigo-700"
    },
    {
      id: 1,
      icon: <ShieldCheck size={22} />,
      title: "100% Verified Judgments",
      subtitle: "Court-Certified Case Laws Direct from Registries",
      desc: "Every judgment in our repository is cross-referenced with official Supreme Court of India and State High Court registry records for absolute courtroom authority.",
      badge: "COURT CERTIFIED",
      highlights: [
        "Direct registry data synchronization",
        "Zero hallucination guarantee",
        "Official bench composition verification"
      ],
      previewStats: { label: "Registry Authenticity", value: "100% Verified" },
      previewColor: "from-emerald-600 to-teal-700"
    },
    {
      id: 2,
      icon: <FileText size={22} />,
      title: "Structured Headnotes",
      subtitle: "Point-by-Point Key Takeaways & Summaries",
      desc: "Digest complex 100-page judgments in minutes. Our headnotes break down the facts, issues framed, ratio decidendi, and disposition in clean structured points.",
      badge: "EXECUTIVE SUMMARIES",
      highlights: [
        "Structured facts, issues, and rulings",
        "Key precedent citation lists",
        "Rapid briefing for advocates & judges"
      ],
      previewStats: { label: "Avg Briefing Time", value: "< 2 Minutes" },
      previewColor: "from-sky-600 to-blue-800"
    },
    {
      id: 3,
      icon: <FileDown size={22} />,
      title: "Original PDF Downloads",
      subtitle: "High-Resolution Certified Printable Copies",
      desc: "Download and print original court-formatted PDF documents with certified page layouts ready for immediate submission before judicial benches.",
      badge: "PRINT READY PDF",
      highlights: [
        "Certified original court layout",
        "One-click high-res PDF generation",
        "Watermark-free official copies"
      ],
      previewStats: { label: "Export Format", value: "Certified PDF" },
      previewColor: "from-indigo-600 to-purple-800"
    },
    {
      id: 4,
      icon: <Zap size={22} />,
      title: "Sub-Second Query Engine",
      subtitle: "Tailored for Demanding Legal Professionals",
      desc: "Built on high-performance vector indexing architecture, delivering search responses in under 50 milliseconds even under high concurrent loads.",
      badge: "ULTRA LOW LATENCY",
      highlights: [
        "42ms average response time",
        "Distributed cloud infrastructure",
        "Instant auto-complete suggestions"
      ],
      previewStats: { label: "Response Speed", value: "42ms Latency" },
      previewColor: "from-amber-600 to-orange-700"
    },
    {
      id: 5,
      icon: <Network size={22} />,
      title: "Subject-Wise Classification",
      subtitle: "Systematic Indexing Across 50+ Legal Domains",
      desc: "Effortlessly browse cases organized by Constitutional Law, Criminal Codes (IPC/BNSS), Corporate Law, Income Tax, IPR, and Arbitration.",
      badge: "50+ CATEGORIES",
      highlights: [
        "Constitutional & Fundamental Rights",
        "New Criminal Codes (BNSS / BNS / BSA)",
        "Commercial & Corporate Insolvency"
      ],
      previewStats: { label: "Legal Taxonomy", value: "50+ Categories" },
      previewColor: "from-violet-600 to-purple-800"
    }
  ];

  const current = features[activeFeature];

  return (
    <section className="relative pt-8 md:pt-10 pb-10 md:pb-12 border-b border-slate-200 overflow-hidden bg-slate-50">
      
      {/* Subtle Supreme Court / Legal Environment Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url('/subtle_legal_bg.jpg')" }}
      ></div>

      {/* Light White/Blue-Gray Overlay for Maximum Readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-50/90 via-slate-50/95 to-slate-50/90 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.85)_100%)] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 md:mb-10 text-center max-w-3xl mx-auto space-y-3">
          <span className="text-primary-600 font-extrabold tracking-widest uppercase text-xs px-3.5 py-1 bg-primary-50 border border-primary-100 rounded-full inline-block">
            Why Choose Digi Law Reporter
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Built for Unrivaled Legal Intelligence
          </h2>
          <p className="text-slate-600 text-sm md:text-base font-normal">
            Designed specifically for advocates, judges, corporate legal teams, and law researchers.
          </p>
        </div>

        {/* Interactive Split Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Left Column: Feature Selection List (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
            {features.map((f, idx) => {
              const isActive = activeFeature === idx;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(idx)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group border ${
                    isActive 
                      ? 'bg-white border-primary-300 shadow-lg' 
                      : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        isActive 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600'
                      }`}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <h4 className={`text-base font-bold transition-colors ${
                        isActive ? 'text-primary-700' : 'text-slate-800 group-hover:text-slate-900'
                      }`}>
                        {f.title}
                      </h4>
                      <p className="text-slate-500 text-xs truncate max-w-[210px] font-normal">
                        {f.subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight 
                    size={18} 
                    className={`transition-all ${
                      isActive 
                        ? 'text-primary-600 translate-x-1' 
                        : 'text-slate-300 group-hover:text-slate-400'
                    }`} 
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Interactive Card Showcase (7 Columns) */}
          <div className="lg:col-span-7 flex">
            <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden">
              
              {/* Top Colored Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${current.previewColor}`}></div>

              <div>
                {/* Header Badge & Stat */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <span className="text-xs font-black tracking-widest text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full uppercase">
                    {current.badge}
                  </span>
                  <div className="text-right">
                    <span className="block text-xs text-slate-400 font-medium">{current.previewStats.label}</span>
                    <span className="text-sm font-extrabold text-slate-900">{current.previewStats.value}</span>
                  </div>
                </div>

                {/* Main Feature Title & Subtitle */}
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 leading-snug">
                  {current.title}
                </h3>
                <p className="text-primary-600 font-bold text-sm mb-4">
                  {current.subtitle}
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
                  {current.desc}
                </p>

                {/* Highlights List */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-6">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-2">Key Capability Highlights</span>
                  {current.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs md:text-sm font-semibold text-slate-800">
                      <CheckCircle2 size={16} className="text-primary-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Indicator */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={14} className="text-[#D4AF37]" /> Click any feature on the left to explore
                </span>
                <span className="font-bold text-primary-600">Feature {activeFeature + 1} of 6</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}




