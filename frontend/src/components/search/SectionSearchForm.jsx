import React from 'react';
import { Search, BookOpen } from 'lucide-react';

export default function SectionSearchForm({ act, setAct, section, setSection, onSearch }) {
  const actsList = [
    "Constitution of India",
    "Code of Criminal Procedure, 1973 (CrPC) / BNSS 2023",
    "Indian Penal Code, 1860 (IPC) / BNS 2023",
    "Code of Civil Procedure, 1908 (CPC)",
    "Indian Evidence Act, 1872 / BSA 2023",
    "Arbitration and Conciliation Act, 1996",
    "Companies Act, 2013",
    "Insolvency and Bankruptcy Code, 2016 (IBC)",
    "Income Tax Act, 1961",
    "Negotiable Instruments Act, 1881",
    "Motor Vehicles Act, 1988",
    "Consumer Protection Act, 2019"
  ];

  return (
    <form onSubmit={onSearch} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-2">
          Act
        </label>
        <select
          value={act}
          onChange={(e) => setAct(e.target.value)}
          className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm md:text-base shadow-sm cursor-pointer"
        >
          <option value="">[ Select Act ]</option>
          {actsList.map((a, idx) => (
            <option key={idx} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-800 mb-2">
          Section / Article
        </label>
        <div className="relative">
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="[ Enter Section or Article ] e.g. Article 21, Section 138, Section 482"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm md:text-base shadow-sm"
          />
          <BookOpen size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-primary-500/25 flex items-center justify-center gap-2 text-sm md:text-base active:scale-[0.99]"
      >
        <Search size={18} />
        <span>Search</span>
      </button>
    </form>
  );
}
