import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, Users, ChevronDown, AlertCircle } from 'lucide-react';

const TAB_KEY_MAP = {
  keyword: 'Keyword Search',
  section: 'Title or Act',
  citation: 'Find By Citation',
  party: 'Find By Party Name'
};

const REVERSE_TAB_MAP = {
  'Keyword Search': 'keyword',
  'Title or Act': 'section',
  'Find By Citation': 'citation',
  'Find By Party Name': 'party'
};



export default function KeywordSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const tabParam = searchParams.get('tab') || 'keyword';

  const TABS = [
    'Keyword Search', 
    'Title or Act', 
    'Find By Citation', 
    'Find By Party Name'
  ];

  const initialTabName = TAB_KEY_MAP[tabParam] || 'Keyword Search';
  const [activeTab, setActiveTab] = useState(initialTabName);

  // Form Fields State & Validation State
  const [validationError, setValidationError] = useState('');
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [sectionTerm, setSectionTerm] = useState('');
  
  // Composite Citation Builder State (Fixed DLR Journal)
  const [citeYear, setCiteYear] = useState('2026');
  const [citeMonth, setCiteMonth] = useState('');
  const citeJournal = 'DLR';
  const [citeCourt, setCiteCourt] = useState('SC');
  const [citeNumber, setCiteNumber] = useState('');
  const [citeEquivalent, setCiteEquivalent] = useState('');

  // Find By Party Name State, Dynamic Courts & Dynamic Party Names
  const [partyCourt, setPartyCourt] = useState('');
  const [partyKeyword, setPartyKeyword] = useState('');
  const [publishedCasesData, setPublishedCasesData] = useState([]);
  const [backendCourtsList, setBackendCourtsList] = useState([]);

  // Fetch published cases and courts automatically from backend
  useEffect(() => {
    const fetchCasesData = async () => {
      try {
        const [casesRes, courtsRes] = await Promise.all([
          fetch('http://localhost:5000/api/public/search?tab=all'),
          fetch('http://localhost:5000/api/public/courts')
        ]);
        const casesJson = await casesRes.json();
        if (casesJson.success && Array.isArray(casesJson.data) && casesJson.data.length > 0) {
          setPublishedCasesData(casesJson.data);
        }
        const courtsJson = await courtsRes.json();
        if (courtsJson.success && Array.isArray(courtsJson.data) && courtsJson.data.length > 0) {
          setBackendCourtsList(courtsJson.data);
        }
      } catch (err) {}
    };
    fetchCasesData();
  }, []);

  // Compute Courts dynamically ONLY from case records in database (Strictly unique, no duplicates, no hardcoded extras)
  const dynamicCourts = useMemo(() => {
    const courtMap = new Map(); // lowercase -> original display string

    // 1. From published cases data in DB
    (publishedCasesData || []).forEach(c => {
      const courtName = (c.court_name || c.court || '').trim();
      if (courtName && !courtMap.has(courtName.toLowerCase())) {
        courtMap.set(courtName.toLowerCase(), courtName);
      }
    });

    // 2. From backend courts API (which queries cases table in DB)
    (backendCourtsList || []).forEach(c => {
      if (c && typeof c === 'string') {
        const courtName = c.trim();
        if (courtName && courtName !== 'SC' && !courtMap.has(courtName.toLowerCase())) {
          courtMap.set(courtName.toLowerCase(), courtName);
        }
      }
    });

    return Array.from(courtMap.values()).sort((a, b) => a.localeCompare(b));
  }, [publishedCasesData, backendCourtsList]);

  // Compute Party Names (Petitioner & Respondent / Appellant) from database for instant autocompletion
  const availablePartyNames = useMemo(() => {
    let cases = publishedCasesData;
    if (partyCourt) {
      cases = cases.filter(c => (c.court_name || c.court || '').toLowerCase() === partyCourt.toLowerCase());
    }

    const parties = [];
    cases.forEach(c => {
      if (c.petitioner || c.petitioner_name) parties.push((c.petitioner || c.petitioner_name).trim());
      if (c.respondent || c.respondent_name) parties.push((c.respondent || c.respondent_name).trim());
    });

    return Array.from(new Set(parties)).filter(Boolean);
  }, [publishedCasesData, partyCourt]);

  // Sync tab from URL if present
  useEffect(() => {
    if (tabParam && TAB_KEY_MAP[tabParam]) {
      setActiveTab(TAB_KEY_MAP[tabParam]);
    }
  }, [tabParam]);

  // Sync search term from URL query if present
  useEffect(() => {
    if (queryParam) {
      setSearchTerm(queryParam);
      setPartyKeyword(queryParam);
      setSectionTerm(queryParam);
    }
  }, [queryParam]);

  // Tab click switches search option view and clears validation
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setValidationError('');
    const code = REVERSE_TAB_MAP[tab] || 'keyword';
    setSearchParams({ tab: code, ...(queryParam ? { q: queryParam } : {}) });
  };

  // Navigates directly to the 3-Pane Legal Search Workspace Results Page (/search/results)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    let activeVal = '';
    let emptyErrorMessage = 'Please enter search details before searching.';

    if (activeTab === 'Keyword Search') {
      activeVal = searchTerm.trim();
      emptyErrorMessage = 'Please enter a Keyword search term before searching.';
    } else if (activeTab === 'Title or Act') {
      activeVal = sectionTerm.trim();
      emptyErrorMessage = 'Please enter a Title, Act name, or Section before searching.';
    } else if (activeTab === 'Find By Citation') {
      const numPart = citeNumber ? citeNumber.trim() : '';
      const eqPart = citeEquivalent ? citeEquivalent.trim() : '';
      if (!numPart && !eqPart) {
        setValidationError('Please enter a Citation Number or Equivalent text before searching.');
        return;
      }
      const yearPart = citeYear ? citeYear.trim() : '';
      const monthPart = citeMonth ? `(${citeMonth.trim()})` : '';
      const journalPart = 'DLR';
      const courtPart = citeCourt ? `(${citeCourt.trim()})` : '';
      const numFormatted = numPart ? `#${numPart}` : '';
      const eqFormatted = eqPart ? `: ${eqPart}` : '';

      activeVal = `citation:${yearPart} ${monthPart} ${journalPart} ${courtPart} ${numFormatted} ${eqFormatted}`.replace(/\s+/g, ' ').trim();
    } else if (activeTab === 'Find By Party Name') {
      activeVal = partyKeyword.trim();
      emptyErrorMessage = 'Please enter a Party Name or Case Title before searching.';
    }

    const finalQuery = activeVal.trim();
    if (!finalQuery) {
      setValidationError(emptyErrorMessage);
      return;
    }

    setValidationError('');
    const tabCode = REVERSE_TAB_MAP[activeTab] || 'keyword';

    // Direct Navigation to Full 3-Pane Workspace Page
    navigate(`/search/results?q=${encodeURIComponent(finalQuery)}&tab=${tabCode}`);
  };

  return (
    <div className="flex flex-col w-full flex-1 bg-slate-50 font-sans relative z-10">
      
      {/* 1. Top Header (Dark Theme - RESEARCH+) */}
      <div className="bg-slate-900 w-full pt-6 md:pt-8 pb-6 md:pb-7 px-4 sm:px-6 relative z-20 shadow-md">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-light tracking-wide text-slate-300 font-cinzel">
                RE<span className="text-primary-500 font-semibold">SEARCH+</span>
              </h1>
              <span className="text-slate-400 border-l border-slate-700 pl-3 text-xs tracking-wider uppercase font-medium">
                {activeTab}
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              <p className="text-xs">Use the <span className="font-semibold text-white">Advanced Search options</span> below to refine your research.</p>
            </div>
          </div>

          {/* Special UI Layout for "Find By Citation" (Centered, Compact Box) */}
          {activeTab === 'Find By Citation' && (
            <div className="bg-white border border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-lg text-slate-900 max-w-lg mx-auto space-y-2.5">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="bg-slate-900 text-white font-extrabold px-2 py-0.5 rounded text-[10px]">DLR</span>
                  <span className="text-xs font-bold text-slate-800">Digital Law Reporter</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Citation Search <span className="text-red-500">*</span></span>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-2.5">
                <div className="text-[10px] font-semibold text-slate-500">
                  Add New Citation
                </div>

                {/* Composite Line Input Container */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-1 text-xs font-mono shadow-2xs">
                  <input
                    type="text"
                    value={citeYear}
                    onChange={(e) => setCiteYear(e.target.value)}
                    placeholder="YYYY"
                    className="w-11 text-center bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-900 font-bold px-0.5 py-0.5 outline-none placeholder:text-slate-400 text-xs"
                  />

                  <span className="font-bold text-slate-400 text-xs">(</span>
                  <input
                    type="text"
                    value={citeMonth}
                    onChange={(e) => setCiteMonth(e.target.value)}
                    placeholder="MM"
                    className="w-8 text-center bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-900 font-bold px-0.5 py-0.5 outline-none placeholder:text-slate-400 text-xs"
                  />
                  <span className="font-bold text-slate-400 text-xs">)</span>

                  <span className="font-extrabold text-slate-900 px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                    DLR
                  </span>

                  <span className="font-bold text-slate-400 text-xs">(</span>
                  <input
                    type="text"
                    value={citeCourt}
                    onChange={(e) => setCiteCourt(e.target.value)}
                    placeholder="SC"
                    className="w-9 text-center bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-900 font-bold uppercase px-0.5 py-0.5 outline-none placeholder:text-slate-400 text-xs"
                  />
                  <span className="font-bold text-slate-400 text-xs">)</span>

                  <input
                    type="text"
                    value={citeNumber}
                    onChange={(e) => {
                      setCiteNumber(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="#"
                    className="w-9 text-center bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-900 font-bold px-0.5 py-0.5 outline-none placeholder:text-slate-400 text-xs"
                  />

                  <span className="font-bold text-slate-400 px-0.5 text-xs">:</span>

                  <input
                    type="text"
                    value={citeEquivalent}
                    onChange={(e) => {
                      setCiteEquivalent(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="Equivalent text"
                    className="flex-1 min-w-[120px] bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-900 font-medium px-1 py-0.5 outline-none placeholder:text-slate-400 text-xs font-sans"
                  />
                </div>

                {validationError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="flex justify-end pt-0.5">
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-md transition-colors shadow-xs flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer active:scale-95"
                  >
                    <Search size={13} />
                    <span>Get Citation</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* Special UI Layout for "Find By Party Name" (Single Clean Box with Dynamic Backend Courts) */}
          {activeTab === 'Find By Party Name' && (
            <div className="bg-[#0D1B2A]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-900 max-w-lg mx-auto">
              
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Search by Party Name</span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    {dynamicCourts.length > 0 
                      ? `${dynamicCourts.length} ${dynamicCourts.length === 1 ? 'Court Available' : 'Courts Available'}` 
                      : 'All Courts'}
                  </span>
                </h3>

                {/* Court Dropdown (Strictly From Database Cases) */}
                <div className="relative">
                  <select
                    value={partyCourt}
                    onChange={(e) => {
                      setPartyCourt(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer pr-8 shadow-2xs transition-colors"
                  >
                    <option value="">All Courts</option>
                    {dynamicCourts.map((courtName) => (
                      <option key={courtName} value={courtName} className="bg-white font-semibold text-slate-900">
                        {courtName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const searchVal = partyKeyword.trim();
                    if (!searchVal && !partyCourt) {
                      setValidationError('Please select a Court or enter a Party Name before searching.');
                      return;
                    }
                    let finalQuery = searchVal;
                    if (partyCourt) {
                      finalQuery = searchVal ? `${partyCourt}: ${searchVal}` : `${partyCourt}:`;
                    }
                    setValidationError('');
                    navigate(`/search/results?q=${encodeURIComponent(finalQuery)}&tab=party`);
                  }} 
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        list="party-suggestions-list"
                        autoComplete="off"
                        value={partyKeyword}
                        onChange={(e) => {
                          setPartyKeyword(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="Type Party Name / Case Title (e.g. SHAURYA, CBI)"
                        className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white font-medium shadow-2xs transition-colors ${
                          validationError ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
                        }`}
                      />
                      <datalist id="party-suggestions-list">
                        {availablePartyNames.map((name, idx) => (
                          <option key={idx} value={name} />
                        ))}
                      </datalist>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#0B1727] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer active:scale-95"
                    >
                      <Search size={13} />
                      <span>Find Case</span>
                    </button>
                  </div>

                  {validationError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </form>
              </div>

            </div>
          )}

          {/* Standard Search Form Inputs (Clean single input without dropdowns) */}
          {activeTab !== 'Find By Citation' && activeTab !== 'Find By Party Name' && (
            <div className="w-full max-w-2xl mx-auto space-y-2">
              <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
                
                {activeTab === 'Keyword Search' && (
                  <div className={`flex-1 flex w-full bg-white rounded-md border overflow-hidden shadow-sm transition-colors ${
                    validationError ? 'border-rose-500' : 'border-slate-300'
                  }`}>
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder="Enter Search Term (e.g. Article 21, natural justice, arbitration)" 
                      className="w-full bg-transparent text-slate-900 px-3.5 py-2 focus:outline-none text-xs sm:text-sm font-medium"
                    />
                  </div>
                )}

                {activeTab === 'Title or Act' && (
                  <div className={`flex-1 flex w-full bg-white rounded-md border overflow-hidden shadow-sm transition-colors ${
                    validationError ? 'border-rose-500' : 'border-slate-300'
                  }`}>
                    <input 
                      type="text" 
                      value={sectionTerm}
                      onChange={(e) => {
                        setSectionTerm(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder="Enter Title, Act Name, or Section (e.g. IPC, Companies Act 2013, Section 482)" 
                      className="w-full bg-transparent text-slate-900 px-3.5 py-2 focus:outline-none text-xs sm:text-sm font-medium"
                    />
                  </div>
                )}


                <button 
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2 rounded-md transition-colors shadow-md flex items-center justify-center gap-1.5 text-xs shrink-0 active:scale-95 cursor-pointer"
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>

              </form>

              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold bg-rose-950/80 border border-rose-800 px-3.5 py-1.5 rounded-md animate-in fade-in max-w-2xl mx-auto">
                  <AlertCircle size={14} className="shrink-0 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 2. Top Sub-Navigation Menu Tabs */}
      <div className="bg-[#E8EAEF] border-b border-slate-300 relative z-20 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-nowrap overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-r border-slate-300/60
                ${activeTab === tab 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* 3. Welcome Guidelines Container */}
      <div className="w-full flex-1 relative z-10 p-6 flex flex-col items-center justify-center text-slate-500 text-center">
        <div className="max-w-md bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Search size={36} className="mx-auto text-primary-600 stroke-[1.5]" />
          <h2 className="text-sm font-bold text-slate-800">Legal Search Portal</h2>
          <p className="text-xs text-slate-500">
            Enter your search terms above and click <span className="font-semibold text-slate-800">Search</span> or <span className="font-semibold text-slate-800">Get Citation</span> to open the full 3-Pane Legal Search Workspace.
          </p>
        </div>
      </div>

    </div>
  );
}
