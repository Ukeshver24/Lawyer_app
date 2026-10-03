import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldCheck, Scale, ExternalLink, Filter, Calendar, FileText, CheckCircle, Bookmark, BookmarkCheck, Download, Check } from 'lucide-react';
import KeywordSearchForm from './KeywordSearchForm';
import SectionSearchForm from './SectionSearchForm';
import CitationSearchForm from './CitationSearchForm';
import PartySearchForm from './PartySearchForm';
import TopicSearchForm from './TopicSearchForm';
import PhraseSearchForm from './PhraseSearchForm';

export default function SearchPage({ type = 'keyword' }) {
  const navigate = useNavigate();

  // Form States
  const [keywordQuery, setKeywordQuery] = useState('');
  const [actQuery, setActQuery] = useState('');
  const [sectionQuery, setSectionQuery] = useState('');
  const [citationQuery, setCitationQuery] = useState('');
  const [partyQuery, setPartyQuery] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [phraseQuery, setPhraseQuery] = useState('');

  // Results State
  const [hasSearched, setHasSearched] = useState(true); // Default show sample results
  const [toastMessage, setToastMessage] = useState('');

  // Persisted Saved Cases
  const [savedCaseIds, setSavedCaseIds] = useState(() => {
    try {
      const saved = localStorage.getItem('digi_saved_cases');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  const handleToggleSaveCase = (item, e) => {
    if (e) e.stopPropagation();
    const caseId = String(item.id);
    let updated;
    if (savedCaseIds.includes(caseId)) {
      updated = savedCaseIds.filter(id => id !== caseId);
      showToast(`Removed "${item.title.substring(0, 30)}..." from saved cases`);
    } else {
      updated = [...savedCaseIds, caseId];
      showToast(`Saved "${item.title.substring(0, 30)}..." to your research library`);
    }
    setSavedCaseIds(updated);
    try {
      localStorage.setItem('digi_saved_cases', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleDownloadCase = (item, e) => {
    if (e) e.stopPropagation();
    const docContent = `
================================================================================
DIGI LAW REPORTER - OFFICIAL VERIFIED JUDGMENT RECORD
================================================================================

TITLE: ${item.title}
COURT: ${item.court}
YEAR: ${item.year}
CITATION: ${item.citation}
CASE NO: ${item.caseNumber}
STATUS: ${item.status}

--------------------------------------------------------------------------------
HEADNOTE & SUMMARY
--------------------------------------------------------------------------------
${item.summary}

================================================================================
VERIFIED BY DIGI LAW REPORTER DIGITAL LEGAL DIGEST
================================================================================
`;
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = item.title.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Judgment_${sanitizedTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded judgment text record successfully`);
  };

  // Mock Database of Precedent Cases
  const MOCK_CASES = [
    {
      id: "1",
      title: "State of Tamil Nadu vs. Ramesh Kumar & Ors.",
      caseNumber: "Criminal Appeal No. 1428 of 2024",
      court: "Supreme Court of India",
      year: "2024",
      type: "Criminal Appeal",
      status: "Disposed - Allowed",
      citation: "2024 INSC 512 | (2024) 4 SCC 321",
      summary: "Landmark ruling on procedural safeguards under Section 482 CrPC and scope of quashing FIR when dispute is predominantly commercial or civil in nature.",
      searchTypes: ["keyword", "section", "party", "topic"]
    },
    {
      id: "2",
      title: "S. Ramesh vs. Union of India & Anr.",
      caseNumber: "Writ Petition (Civil) No. 892 of 2023",
      court: "Supreme Court of India",
      year: "2023",
      type: "Writ Petition",
      status: "Disposed - Order Passed",
      citation: "2023 INSC 810 | AIR 2023 SC 4102",
      summary: "Constitutional Bench judgment examining the right to privacy under Article 21 and statutory limits on data surveillance mechanism.",
      searchTypes: ["keyword", "section", "party", "topic", "citation"]
    },
    {
      id: "3",
      title: "Ramesh Babu & Co. vs. Commissioner of Income Tax",
      caseNumber: "Civil Appeal No. 3411 of 2024",
      court: "Delhi High Court",
      year: "2024",
      type: "Tax Appeal",
      status: "Allowed",
      citation: "2024 DHC 1982 | 412 ITR 210",
      summary: "Interpretation of Section 148 notices issued post 2021 amendments under Income Tax Act and applicability of executive notifications.",
      searchTypes: ["section", "party", "citation", "phrase"]
    },
    {
      id: "4",
      title: "K.S. Puttaswamy & Ors. vs. Union of India",
      caseNumber: "Writ Petition (Civil) No. 494 of 2012",
      court: "Supreme Court of India",
      year: "2017",
      type: "Constitutional Bench",
      status: "Disposed - Unanimous",
      citation: "(2017) 10 SCC 1 | 2017 INSC 782",
      summary: "Nine-judge bench affirmation holding Right to Privacy as a fundamental right intrinsically guaranteed under Article 21 of the Constitution.",
      searchTypes: ["keyword", "section", "topic", "phrase", "citation"]
    },
    {
      id: "5",
      title: "M/s Reliance Infrastructure Ltd. vs. State of Maharashtra",
      caseNumber: "Arbitration Petition No. 204 of 2023",
      court: "Bombay High Court",
      year: "2023",
      type: "Arbitration Appeal",
      status: "Disposed - Award Upheld",
      citation: "2023 BHC 4109 | 2023 (6) MHLJ 89",
      summary: "Scope of judicial interference under Section 34 of Arbitration & Conciliation Act 1996 regarding patent illegality in commercial awards.",
      searchTypes: ["section", "topic", "phrase", "citation"]
    }
  ];

  // Configure Form Metadata based on `type`
  const getSearchConfig = () => {
    switch (type) {
      case 'section':
        return {
          title: "Find by Act & Section",
          description: "Search cases using a specific Act and Section.",
          component: (
            <SectionSearchForm
              act={actQuery}
              setAct={setActQuery}
              section={sectionQuery}
              setSection={setSectionQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
      case 'citation':
        return {
          title: "Find by Citation",
          description: "Search judgments using official reporter citations.",
          component: (
            <CitationSearchForm
              citation={citationQuery}
              setCitation={setCitationQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
      case 'party':
        return {
          title: "Find by Party Name",
          description: "Filter proceedings by petitioner or respondent name.",
          component: (
            <PartySearchForm
              party={partyQuery}
              setParty={setPartyQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
      case 'topic':
        return {
          title: "Find by Topic",
          description: "Browse precedent rulings categorized by legal domain.",
          component: (
            <TopicSearchForm
              topic={topicQuery}
              setTopic={setTopicQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
      case 'phrase':
        return {
          title: "Words & Phrases",
          description: "Search judicial definitions and legal terminology.",
          component: (
            <PhraseSearchForm
              phrase={phraseQuery}
              setPhrase={setPhraseQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
      case 'keyword':
      default:
        return {
          title: "Keyword Search",
          description: "Search cases and legal content using relevant keywords.",
          component: (
            <KeywordSearchForm
              query={keywordQuery}
              setQuery={setKeywordQuery}
              onSearch={(e) => { e.preventDefault(); setHasSearched(true); }}
            />
          )
        };
    }
  };

  const config = getSearchConfig();

  return (
    <div className="flex-1 w-full bg-slate-50 py-6 md:py-8 px-4 sm:px-6 lg:px-8 font-jakarta">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Button to Return to Legal Research Dashboard */}
        <div>
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-700 hover:text-primary-600 hover:border-primary-300 font-bold text-xs md:text-sm shadow-sm transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Research Dashboard</span>
          </button>
        </div>

        {/* Search Header & Form Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-10 shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {config.title}
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-normal">
              {config.description}
            </p>
          </div>

          {/* Form Rendered Dynamically */}
          <div className="pt-2">
            {config.component}
          </div>
        </div>

        {/* Search Results Section */}
        {hasSearched && (
          <div className="space-y-6 pt-4 max-w-4xl mx-auto">
            {/* Results Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary-600 shrink-0" />
                <span className="text-sm font-bold text-slate-900">
                  Search Results ({MOCK_CASES.length} Verified Judgments Found)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter size={14} />
                <span>Sorted by Supreme Court Authority</span>
              </div>
            </div>

            {/* Mock Case Cards List */}
            <div className="space-y-4">
              {MOCK_CASES.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-300 space-y-4 group"
                >
                  {/* Top Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-50 text-primary-700 font-extrabold px-3 py-1 rounded-full border border-primary-100 uppercase text-[11px]">
                        {item.court}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
                        {item.type}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md font-bold text-[11px] border border-emerald-100 flex items-center gap-1">
                        <CheckCircle size={12} /> {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-semibold text-slate-500">
                      <Calendar size={14} />
                      <span>{item.year}</span>
                    </div>
                  </div>

                  {/* Case Title */}
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-500 mt-1">
                      {item.caseNumber}
                    </p>
                  </div>

                  {/* Citation & Summary */}
                  <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-primary-700">
                      <FileText size={15} />
                      <span>Citation: {item.citation}</span>
                    </div>
                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Bottom Action Row */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">Official Registry Verified</span>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Save Case Button */}
                      <button
                        onClick={(e) => handleToggleSaveCase(item, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          savedCaseIds.includes(String(item.id))
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title="Save Case"
                      >
                        {savedCaseIds.includes(String(item.id)) ? (
                          <>
                            <BookmarkCheck size={14} className="text-emerald-600" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark size={14} />
                            <span>Save Case</span>
                          </>
                        )}
                      </button>

                      {/* Download Case Button */}
                      <button
                        onClick={(e) => handleDownloadCase(item, e)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        title="Download Case Judgment"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>

                      {/* View Case Button */}
                      <button
                        onClick={() => navigate(`/judgment/${item.id}`)}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs md:text-sm transition-all shadow-sm hover:shadow-primary-500/25 flex items-center gap-1.5 active:scale-95"
                      >
                        <span>View Case</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
