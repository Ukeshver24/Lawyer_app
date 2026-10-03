import React from 'react';
import { User, GraduationCap, Search, Building2, Scale } from 'lucide-react';

export default function WhoCanBenefit() {
  const topTargets = [
    { icon: <User size={24}/>, title: "Advocates & Litigators", desc: "Build unassailable courtroom arguments with cited precedents." },
    { icon: <GraduationCap size={24}/>, title: "Law Students & Scholars", desc: "Access authentic academic case materials & ratio decidendi summaries." },
    { icon: <Search size={24}/>, title: "Legal Researchers", desc: "Execute multi-criteria searches with sub-second retrieval times." }
  ];

  const bottomTargets = [
    { icon: <Building2 size={24}/>, title: "Corporate Legal Teams", desc: "Track tribunal rulings and regulatory compliance precedents." },
    { icon: <Scale size={24}/>, title: "Judicial Officers", desc: "Reference verified legal records and cross-jurisdictional rulings." }
  ];

  return (
    <section className="py-10 md:py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-14 text-center max-w-3xl mx-auto space-y-3">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-xs">Target Community</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Who Benefits From Digi Law Reporter?</h2>
          <p className="text-slate-600 text-sm md:text-base font-normal">Empowering legal professionals across the entire spectrum of practice.</p>
        </div>
        
        <div className="flex flex-col gap-6">
          
          {/* Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {topTargets.map((t, i) => (
              <div key={i} className="flex items-start bg-slate-50 border border-slate-200/90 rounded-2xl p-5 hover:border-primary-300 hover:bg-white hover:shadow-md transition-all duration-300 group shadow-sm">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 mr-4 border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                  {t.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-900 font-bold text-base group-hover:text-primary-700 transition-colors">{t.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {bottomTargets.map((t, i) => (
              <div key={i} className="flex items-start bg-slate-50 border border-slate-200/90 rounded-2xl p-5 hover:border-primary-300 hover:bg-white hover:shadow-md transition-all duration-300 group shadow-sm">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 mr-4 border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                  {t.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-900 font-bold text-base group-hover:text-primary-700 transition-colors">{t.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}


