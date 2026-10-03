import React, { useState, useEffect } from 'react';
import { 
  Home, Search, Phone, User, Bookmark, Scale, ChevronRight, 
  ArrowLeft, Copy, Share2, Volume2, Download, Printer, 
  Search as SearchIcon, AlertTriangle, Key, BookOpen, Quote, 
  Users, Folder, Type, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { MOCK_CASES } from '../data/adminMockData';

export default function MobileApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'search', 'contact', 'profile'
  const [searchMode, setSearchMode] = useState('keyword'); // 'keyword', 'act', 'citation', 'party', 'topic', 'phrase'
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);
  const [savedCases, setSavedCases] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Initial Splash Screen Timer (1.8 seconds delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    if (!searchQuery.trim()) {
      switch (searchMode) {
        case 'citation':
          setValidationError('⚠️ Please enter a Citation Number or Equivalent text before searching.');
          break;
        case 'party':
          setValidationError('⚠️ Please enter a Party Name or Case Title before searching.');
          break;
        case 'topic':
          setValidationError('⚠️ Please enter a Legal Topic before searching.');
          break;
        case 'phrase':
          setValidationError('⚠️ Please enter a Word or Phrase before searching.');
          break;
        case 'act':
          setValidationError('⚠️ Please enter an Act Name or Section Number before searching.');
          break;
        default:
          setValidationError('⚠️ Please enter a Keyword before searching.');
          break;
      }
      return;
    }
    setActiveTab('search');
  };

  const toggleSaveCase = (caseItem) => {
    if (savedCases.some(c => c.id === caseItem.id)) {
      setSavedCases(savedCases.filter(c => c.id !== caseItem.id));
    } else {
      setSavedCases([...savedCases, caseItem]);
    }
  };

  // 1. Initial Entry Splash Screen (Deep Blue Background, Top Logo, Digi Law Reporter Text)
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#0B1727] text-white flex flex-col items-center justify-between p-6 z-50 select-none">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Top Logo */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 p-0.5 shadow-2xl shadow-blue-500/40 flex items-center justify-center">
            <img 
              src="/logo/digital_law_reporter.png" 
              alt="Digi Law Reporter Logo" 
              className="w-full h-full object-contain p-2 rounded-3xl"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Scale className="w-12 h-12 text-white" />
          </div>

          {/* Name below Logo: Digi Law Reporter */}
          <div className="text-center space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-blue-400">Digi Law </span>
              <span className="text-white">Reporter</span>
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              India's Premier Legal Precedent Portal
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="pb-8 flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Loading Application...</span>
        </div>
      </div>
    );
  }

  // 2. Full Judgment Reader View
  if (selectedCase) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-jakarta">
        {/* Header */}
        <header className="bg-[#0B1727] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
          <button 
            onClick={() => setSelectedCase(null)} 
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <span className="text-xs font-bold text-blue-400 truncate max-w-[200px]">
            {selectedCase.citation || 'Legal Judgment'}
          </span>
          <button 
            onClick={() => toggleSaveCase(selectedCase)} 
            className="text-amber-400 p-1"
          >
            <Bookmark size={18} fill={savedCases.some(c => c.id === selectedCase.id) ? '#F59E0B' : 'none'} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 max-w-2xl mx-auto space-y-4 pb-28">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <span className="inline-block bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
              {selectedCase.court || 'Supreme Court of India'}
            </span>
            <h1 className="text-lg font-black text-slate-900 leading-snug font-cinzel">
              {selectedCase.title}
            </h1>
            <p className="text-xs font-bold text-amber-700">
              {selectedCase.citation} • Dated: {selectedCase.judgmentDate || '2024'}
            </p>
          </div>

          <div 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm leading-relaxed text-slate-800 space-y-3"
            style={{ fontSize: `${fontSize}px` }}
          >
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">
              Headnote Summary & Judgment Text
            </h3>
            <p>{selectedCase.headnote || selectedCase.content || 'Full judgment content and headnotes available in database.'}</p>
          </div>
        </div>

        {/* Mobile Action Toolbar (Font Size Center, Copy/Bookmark Left, Print/Share/Audio Right) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-2 z-40">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${selectedCase.title}\n${selectedCase.citation}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1"
            >
              <Copy size={16} /> {copied ? 'Copied' : ''}
            </button>
          </div>

          {/* Center Font Control Pill */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full px-3 py-1 gap-2">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="text-xs font-black text-slate-700">A-</button>
            <span className="text-[11px] font-bold text-slate-900">{fontSize}px</span>
            <button onClick={() => setFontSize(Math.min(22, fontSize + 1))} className="text-xs font-black text-slate-700">A+</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsPlayingAudio(!isPlayingAudio)} className={`p-2 rounded-xl text-xs ${isPlayingAudio ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Volume2 size={16} />
            </button>
            <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Mobile Application Layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-jakarta">
      {/* Mobile Top Header */}
      <header className="bg-[#0B1727] text-white px-4 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight leading-none">
              <span className="text-blue-400">Digi Law </span>
              <span className="text-white">Reporter</span>
            </h1>
            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Legal Mobile Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <a href="/admin" className="text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg">
            Admin Portal
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-24 space-y-5">
        {/* Tab 1: Home Workspace */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Quick Hero Banner */}
            <div className="bg-gradient-to-br from-[#0B1727] to-[#1E293B] text-white p-5 rounded-2xl shadow-md space-y-3">
              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
                VERIFIED LEGAL PRECEDENTS
              </span>
              <h2 className="text-xl font-extrabold leading-tight font-cinzel">
                Search Authentic Supreme Court & High Court Rulings
              </h2>
              <p className="text-xs text-slate-300">
                Access thousands of headnotes, citations, and full judgments.
              </p>
            </div>

            {/* 6 Search Modes Cards */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Select Search Option
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'keyword', title: 'Keyword Search', icon: Key, color: 'text-blue-600' },
                  { key: 'act', title: 'Title or Act', icon: BookOpen, color: 'text-indigo-600' },
                  { key: 'citation', title: 'Find by Citation', icon: Quote, color: 'text-amber-600' },
                  { key: 'party', title: 'Find by Party Name', icon: Users, color: 'text-emerald-600' },
                  { key: 'topic', title: 'Find by Topic', icon: Folder, color: 'text-purple-600' },
                  { key: 'phrase', title: 'Words & Phrases', icon: Type, color: 'text-rose-600' },
                ].map((mode) => {
                  const IconComp = mode.icon;
                  return (
                    <button
                      key={mode.key}
                      onClick={() => {
                        setSearchMode(mode.key);
                        setActiveTab('search');
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-2 bg-white hover:border-blue-500 shadow-xs transition-all ${searchMode === mode.key ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}
                    >
                      <IconComp size={20} className={mode.color} />
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {mode.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Search Workspace */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Top Back Arrow Button to Home Screen */}
            <div className="flex items-center">
              <button
                onClick={() => setActiveTab('home')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </button>
            </div>
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                  Mode: {searchMode.toUpperCase()} SEARCH
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Enter ${searchMode} search details...`}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <SearchIcon size={18} className="absolute left-3 top-3 text-slate-400" />
              </div>

              {/* Red Alert Validation Badge */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-colors"
              >
                Search Legal Database
              </button>
            </form>

            {/* Results List */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Available Judgments ({MOCK_CASES.length})
              </h3>

              {MOCK_CASES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {c.court || 'Supreme Court of India'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700">{c.citation}</span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {c.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.headnote || c.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-blue-600 font-bold pt-1">
                    <span>View Judgment Details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Contact */}
        {activeTab === 'contact' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 font-cinzel">Law Chambers & Editorial Board</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Digi Law Reporter Legal Research Team & Supreme Court Practice Chambers.
            </p>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-700">
              <p><strong>Location:</strong> Supreme Court Lawyers Block, New Delhi</p>
              <p><strong>Email:</strong> support@digilawreporter.in</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
            </div>
          </div>
        )}

        {/* Tab 4: Profile / Saved Cases */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Advocate / Legal Researcher</h3>
                  <span className="text-xs text-slate-500 font-medium">Standard Account</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase">Bookmarked Cases ({savedCases.length})</h3>
              {savedCases.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No saved cases yet. Tap the bookmark icon on any judgment to save.</p>
              ) : (
                savedCases.map((c) => (
                  <div key={c.id} onClick={() => setSelectedCase(c)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex justify-between items-center">
                    <span>{c.title}</span>
                    <ChevronRight size={14} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-6 flex items-center justify-around shadow-lg z-30">
        {[
          { key: 'home', label: 'Home', icon: Home },
          { key: 'search', label: 'Search', icon: Search },
          { key: 'contact', label: 'Contact', icon: Phone },
          { key: 'profile', label: 'Profile', icon: User },
        ].map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
            >
              <IconComp size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
