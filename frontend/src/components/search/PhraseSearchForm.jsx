import React from 'react';
import { Search, Type } from 'lucide-react';

export default function PhraseSearchForm({ phrase, setPhrase, onSearch }) {
  return (
    <form onSubmit={onSearch} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-2">
          Enter Words or Phrase
        </label>
        <div className="relative">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter a legal word or phrase (e.g. Ratio Decidendi, Mens Rea, Audi Alteram Partem)"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm md:text-base shadow-sm"
          />
          <Type size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
