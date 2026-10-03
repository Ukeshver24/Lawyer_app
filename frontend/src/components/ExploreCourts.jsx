import React from 'react';
import { Landmark, Scale, Building, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExploreCourts() {
  const navigate = useNavigate();

  const courts = [
    {
      icon: <Landmark size={32} className="text-primary-600" />,
      title: "Supreme Court of India",
      desc: "Comprehensive archive of Supreme Court judgments from 1800 to present with official reporter citations.",
      query: "Supreme Court"
    },
    {
      icon: <Scale size={32} className="text-primary-600" />,
      title: "State High Courts",
      desc: "Judgments from Delhi, Bombay, Allahabad, Madras, Calcutta, and all 25 High Courts.",
      query: "High Court"
    },
    {
      icon: <Building size={32} className="text-primary-600" />,
      title: "Tribunals & Commissions",
      desc: "NCLT, NCLAT, ITAT, CESTAT, Consumer Commissions, and Specialized Appellate Tribunals.",
      query: "Tribunal"
    }
  ];

  return (
    <section className="py-10 md:py-14 bg-slate-50 relative overflow-hidden border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="mb-14 text-center max-w-3xl mx-auto space-y-3">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-xs">Jurisdiction Coverage</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Explore Judicial Repositories</h2>
          <p className="text-slate-600 text-sm md:text-base font-normal">Direct indexing across all levels of the Indian Judicial System.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courts.map((court, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/search?q=${encodeURIComponent(court.query)}`)}
              className="flex flex-col p-8 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-105 transition-all">
                <div className="group-hover:text-white">{court.icon}</div>
              </div>
              
              <h3 className="text-slate-900 font-bold text-xl mb-2 group-hover:text-primary-700 transition-colors">{court.title}</h3>
              <p className="text-slate-600 text-xs md:text-sm font-normal mb-8 leading-relaxed flex-1">
                {court.desc}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-primary-600 font-bold text-xs group-hover:text-primary-800 transition-colors">
                <span>Browse Repository</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>

            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}


