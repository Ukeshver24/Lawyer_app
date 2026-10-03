import React from 'react';
import { Search, Gavel, FileText, FileDown, Printer, ArrowRight, ArrowDown } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    { num: 1, icon: <Search size={26}/>, title: "Enter Query", desc: "Keyword, citation, or party name" },
    { num: 2, icon: <Gavel size={26}/>, title: "Instant Match", desc: "Sub-second AI index search" },
    { num: 3, icon: <FileText size={26}/>, title: "Review Headnote", desc: "Read ratio decidendi summary" },
    { num: 4, icon: <FileDown size={26}/>, title: "Examine Text", desc: "Read full text with highlights" },
    { num: 5, icon: <Printer size={26}/>, title: "Download PDF", desc: "Export or print certified copy" }
  ];

  return (
    <section className="py-10 md:py-14 bg-slate-50 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-3">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-xs">Simplified Workflow</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-slate-600 text-sm md:text-base font-normal">From query to certified case citation in five effortless steps.</p>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
           {/* Connecting Line for Desktop */}
           <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0"></div>

           <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 lg:gap-4 relative z-10">
             {steps.map((step, i) => (
               <React.Fragment key={i}>
                 <div className="flex flex-col items-center text-center relative group w-full lg:w-48 bg-white p-6 lg:p-0 rounded-2xl border border-slate-200 lg:border-none shadow-sm lg:shadow-none">
                   
                   {/* Circle Icon */}
                   <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 text-primary-600 flex items-center justify-center mb-4 group-hover:border-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 z-10 relative shadow-md">
                     {step.icon}
                     <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary-600 text-white font-bold rounded-full flex items-center justify-center text-xs shadow-sm">
                       {step.num}
                     </div>
                   </div>

                   {/* Content */}
                   <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-primary-700 transition-colors">{step.title}</h3>
                   <p className="text-slate-500 text-xs font-normal px-1">{step.desc}</p>
                 </div>

                 {/* Arrow */}
                 {i !== steps.length - 1 && (
                   <div className="text-slate-300 lg:mt-[28px]">
                     <ArrowRight size={24} className="hidden lg:block text-slate-400" />
                     <ArrowDown size={24} className="lg:hidden text-slate-400" />
                   </div>
                 )}
               </React.Fragment>
             ))}
           </div>
        </div>

      </div>
    </section>
  );
}


