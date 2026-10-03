import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Smartphone, EyeOff, ShieldBan, LifeBuoy, Search, 
  Mail, Phone, MapPin, AlertTriangle, Shield, Calendar, Clock, UserX, FileText, Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChildSafety() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id^="section-"]');
      const scrollPos = window.scrollY + 140;

      sections.forEach(sec => {
        if (sec instanceof HTMLElement) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sectionsList = [
    { id: 'section-1', title: '1. Scope & Target Age Group' },
    { id: 'section-2', title: '2. Minor Identity Redaction' },
    { id: 'section-3', title: '3. DPDP Act Sec. 9 Compliance' },
    { id: 'section-4', title: '4. App Store & Play Families' },
    { id: 'section-5', title: '5. Zero Tolerance for CSAM' },
    { id: 'section-6', title: '6. Parental & Guardian Rights' },
    { id: 'section-7', title: '7. Absence of Predatory Ads' },
    { id: 'section-8', title: '8. Incident Reporting Helplines' },
    { id: 'section-9', title: '9. Child Safety Officer' },
    { id: 'section-10', title: '10. Academic Guidelines' },
  ];

  const filteredSections = searchQuery.trim()
    ? sectionsList.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sectionsList;

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-slate-800 font-sans pb-20 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Hero Header (Matches Website Luxury Hero & Supreme Court Architecture) */}
      <section className="relative py-14 sm:py-20 border-b border-[#D4AF37]/30 overflow-hidden bg-slate-950 flex items-center justify-center font-sans text-white">
        
        {/* Authentic Photo Background of Supreme Court of India */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: "url('/supreme_court_india.jpg')" }}
        ></div>

        {/* Luxury Gradient Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0A1128]/90 via-[#0A1128]/80 to-[#070F1E]/95 backdrop-blur-[1px]"></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          
          <div className="flex flex-wrap items-center gap-2.5 mb-4 text-xs font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 rounded-full text-[11px] font-mono shadow-xs backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-300" />
              DPDP Act 2023 (Sec. 9) & POCSO Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/25 text-blue-200 border border-blue-400/40 rounded-full text-[11px] font-mono shadow-xs backdrop-blur-md">
              <Smartphone size={14} className="text-blue-300" />
              Google Play Families & App Store Certified
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-700/80 rounded-full text-[11px] backdrop-blur-md">
              Version 2.4.0
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cinzel text-white tracking-tight leading-tight max-w-4xl drop-shadow-2xl">
            CHILD SAFETY & <span className="bg-gradient-to-r from-emerald-200 via-white to-blue-400 bg-clip-text text-transparent">MINOR PROTECTION</span> CHARTER
          </h1>
          
          <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-3xl leading-relaxed drop-shadow">
            Digi Law Reporter enforces rigorous minor identity redactions (POCSO & JJ Act), zero behavioral profiling, and safe digital research environments across our web portal and mobile applications.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-blue-400" />
              <span>Effective Date: <strong>September 28, 2026</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-blue-400" />
              <span>Last Updated: <strong>September 28, 2026</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <UserX size={15} className="text-emerald-400" />
              <span>Zero Minor Profiling & Identity Masking Guaranteed</span>
            </div>
          </div>

        </div>
      </section>

      {/* Summary Highlight Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 relative z-20 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <EyeOff size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1727]">Statutory Minor Redaction</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All judgments involving minors (POCSO / Juvenile cases) are strictly masked and pseudonymized per Supreme Court guidelines.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldBan size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1727]">Zero Minor Tracking & Ads</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                In compliance with DPDP Act Sec. 9, we never undertake behavioral tracking, profiling, or targeted advertisements.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1727]">24/7 Redressal Escalation</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct priority hotline and child safety reporting channel with mandatory 24-hour response and resolution timeline.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 print:hidden">
            <div className="sticky top-24 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Search Child Safety Policy
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords (e.g., POCSO, DPDP)..." 
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold font-cinzel uppercase tracking-wider text-[#0B1727] pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <span className="text-[10px] font-sans font-normal text-slate-400">10 Sections</span>
                </h4>
                
                <nav className="mt-3 space-y-1 text-xs max-h-[58vh] overflow-y-auto pr-1">
                  {filteredSections.map(s => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`block px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                        activeSection === s.id
                          ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600'
                          : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Shield size={15} className="text-emerald-600 shrink-0" />
                  <span>Child Protection Hotline</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  To report any concern regarding minor identity or sensitive material, contact our safety nodal team directly.
                </p>
                <a href="mailto:childsafety@digilawreporter.in" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline">
                  <span>childsafety@digilawreporter.in</span>
                </a>
              </div>

            </div>
          </aside>

          {/* Policy Sections */}
          <article className="lg:col-span-8 space-y-10">

            {/* Section 1 */}
            <section id="section-1" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">01</div>
                <h2 className="text-lg sm:text-xl font-extrabold font-cinzel text-[#0B1727]">Scope, Purpose & Target Age Group</h2>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  <strong>Digi Law Reporter</strong> is a professional digital legal research platform. This Child Safety Policy outlines our institutional safeguards, redaction protocols, and compliance framework under Indian and international child protection laws.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">02</div>
                <h2 className="text-lg sm:text-xl font-extrabold font-cinzel text-[#0B1727]">Statutory Redaction & Masking of Minor Identities</h2>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <p>
                  In compliance with statutory mandates:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <span className="font-bold text-xs text-slate-900 block flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-600" /> POCSO Act, 2012 (Sec. 33(7) & 37)
                    </span>
                    <p className="text-xs text-slate-600">All identifying markers of child victims are permanently replaced with pseudonyms.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <span className="font-bold text-xs text-slate-900 block flex items-center gap-1.5">
                      <Scale size={14} className="text-blue-600" /> Juvenile Justice Act, 2015 (Sec. 74)
                    </span>
                    <p className="text-xs text-slate-600">Strict prohibition against disclosing names or locations of children in conflict with law.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">03</div>
                <h2 className="text-lg sm:text-xl font-extrabold font-cinzel text-[#0B1727]">Section 9 DPDP Act 2023 Compliance</h2>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <ul className="list-disc list-inside space-y-2 pl-2 text-slate-700">
                  <li><strong>Zero Behavioral Tracking:</strong> We do not monitor, track, or profile children.</li>
                  <li><strong>Zero Targeted Ads:</strong> The platform is completely free of third-party advertising networks.</li>
                  <li><strong>No Harmful Data Processing:</strong> We do not conduct processing detrimental to child well-being.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs font-mono">05</div>
                <h2 className="text-lg sm:text-xl font-extrabold font-cinzel text-[#0B1727]">Zero Tolerance for Child Sexual Abuse Material (CSAM)</h2>
              </div>
              <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-xl space-y-2 text-xs">
                <strong className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-red-600" /> Mandatory Statutory Reporting
                </strong>
                <p>
                  Any unlawful content is blocked instantaneously and escalated to the National Cyber Crime Reporting Portal (cybercrime.gov.in) and law enforcement authorities under IT Act Sec. 67B.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">09</div>
                <h2 className="text-lg sm:text-xl font-extrabold font-cinzel text-[#0B1727]">Designated Child Safety & Grievance Officer</h2>
              </div>
              <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-700">
                <p><strong>Child Safety & Grievance Officer:</strong> Digi Law Reporter Chambers & Legal Research Centre</p>
                <p><strong>Chamber Address:</strong> Chamber No. 402, High Court Lawyers Block, Supreme Court Enclave, New Delhi - 110001</p>
                <p><strong>Official Email:</strong> <a href="mailto:childsafety@digilawreporter.in" className="text-emerald-700 font-bold hover:underline">childsafety@digilawreporter.in</a></p>
                <p><strong>Helpline:</strong> +91 98765 43210 (National Childline: 1098)</p>
              </div>
            </section>

          </article>
        </div>
      </main>

    </div>
  );
}
