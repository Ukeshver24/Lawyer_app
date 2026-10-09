import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UniversalLegalDocument from '../components/UniversalLegalDocument';
import { downloadCaseAsPDF, printCaseAsPDF } from '../utils/pdfExporter';
import { downloadCaseAsDOCX } from '../utils/docxExporter';
import { API_BASE_URL } from '../config/api';
import { 
  Search, ChevronDown, Download, FileText, Bookmark, BookmarkCheck, 
  Printer, Share2, Filter, Copy, Check, ZoomIn, ZoomOut, Scale, Landmark,
  LayoutDashboard, Volume2, VolumeX, Highlighter, Mail, X, ExternalLink,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, SlidersHorizontal,
  FolderBookmark, Sparkles, CheckCircle2, AlertTriangle, Eye,
  Play, Pause, RotateCcw, Square, ArrowLeft
} from 'lucide-react';

// Authentic Social Media Brand SVG Icons
const WhatsappIcon = () => (
  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M12.031 0C5.398 0 0 5.397 0 12.03c0 2.124.553 4.197 1.606 6.02L.057 24l6.163-1.616A11.968 11.968 0 0012.03 24c6.633 0 12.031-5.397 12.031-12.03C24.062 5.397 18.664 0 12.031 0zm.001 22.013c-1.805 0-3.573-.485-5.113-1.402l-.367-.218-3.797.995 1.012-3.7-.239-.38a9.972 9.972 0 01-1.529-5.278c.002-5.523 4.495-10.016 10.021-10.016 5.524 0 10.017 4.493 10.018 10.016 0 5.524-4.494 10.017-10.006 10.017zm5.492-7.502c-.301-.151-1.782-.879-2.057-.979-.276-.1-.476-.151-.676.151-.201.301-.777.979-.952 1.18-.175.201-.351.226-.652.075-1.83-.919-3.037-1.637-4.244-3.71-.321-.552.321-.512.919-1.706.1-.201.05-.376-.025-.527-.075-.151-.676-1.63-0.927-2.233-.244-.587-.492-.507-.676-.517-.175-.01-.376-.01-.577-.01-.201 0-.526.075-.802.376-.276.301-1.053 1.028-1.053 2.508s1.078 2.908 1.228 3.109c.15.201 2.122 3.241 5.14 4.547.718.31 1.279.495 1.716.634.721.23 1.377.197 1.896.12.577-.086 1.782-.727 2.033-1.429.251-.702.251-1.304.175-1.43-.075-.125-.276-.201-.577-.352z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
  </svg>
);

// Highlighting Utility (Safe HTML Injection)
const getHighlightedSnippet = (snippet, keyword) => {
  if (!snippet) return { __html: '' };
  if (!keyword) return { __html: snippet };
  
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const highlighted = snippet.replace(regex, '<mark class="bg-yellow-200 text-slate-900 px-1 rounded font-bold">$1</mark>');

  return { __html: highlighted };
};

// Normalizes text by removing single line breaks but keeping double line breaks
const processDocumentText = (text) => {
  if (!text) return '';
  let normalized = text.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\n\n+/g, '___PARAGRAPH___');
  normalized = normalized.replace(/\n/g, ' ');
  normalized = normalized.replace(/___PARAGRAPH___/g, '\n\n');
  return normalized;
};

const getHighlightedFullText = (text, keyword, isHighlightEnabled = true) => {
  if (!text) return { __html: '' };
  const processedText = processDocumentText(text);
  if (!keyword || !isHighlightEnabled) return { __html: processedText };
  
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const highlighted = processedText.replace(regex, '<mark class="bg-yellow-300 text-slate-950 px-1 py-0.5 rounded font-bold shadow-2xs">$1</mark>');
  
  return { __html: highlighted };
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [fontSize, setFontSize] = useState(15); // Default font size in px
  const [isCaseDetailsModalOpen, setIsCaseDetailsModalOpen] = useState(false);
  
  // Mobile View Navigation Tab State ('results' | 'judgment' | 'filters')
  const [mobileTab, setMobileTab] = useState('results');
  
  // Filter States
  const [selectedCourtFilter, setSelectedCourtFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startYear, setStartYear] = useState(1800);
  const [endYear, setEndYear] = useState(2026);
  const [searchWithinResults, setSearchWithinResults] = useState('');
  const [searchWithinDoc, setSearchWithinDoc] = useState('');
  const [showDocSearch, setShowDocSearch] = useState(false);

  // UI Interactive States
  const [toastMessage, setToastMessage] = useState('');
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareMenuRef = useRef(null);
  const downloadMenuRef = useRef(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isHighlightingEnabled, setIsHighlightingEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  // Close share menu popover on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setIsShareMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsShareMenuOpen(false);
      }
    };

    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isShareMenuOpen]);

  const handleShareClick = (platform) => {
    if (!selectedCase) return;
    const currentUrl = window.location.href;
    const title = selectedCase.title || 'Legal Precedent - Digi Law Reporter';
    const textToShare = `${title}\n${currentUrl}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'email':
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${currentUrl}`)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'copy':
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(currentUrl).then(() => {
            setCopySuccess(true);
            showToast("Link copied to clipboard!");
            setTimeout(() => setCopySuccess(false), 2500);
          }).catch(() => {
            fallbackCopyTextToClipboard(currentUrl);
          });
        } else {
          fallbackCopyTextToClipboard(currentUrl);
        }
        break;
      default:
        break;
    }
    setIsShareMenuOpen(false);
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  // Get storage key scoped strictly to current logged-in user
  const getUserSavedCasesStorageKey = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const identifier = u.id || u.username || u.email || u.name;
        if (identifier) {
          return `digi_saved_cases_full_${identifier.toString().toLowerCase().trim()}`;
        }
      }
    } catch (e) {}
    return 'digi_saved_cases_full_guest';
  };

  // Helper to get logged in user's mobile/id identifier
  const getUserIdentifier = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.mobile || u.id || u.username || u.email;
      }
    } catch (e) {}
    return null;
  };

  // Persisted Saved Cases in LocalStorage & Backend (Strictly User-Scoped)
  const [savedCases, setSavedCases] = useState(() => {
    try {
      const key = getUserSavedCasesStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
  });

  // Re-sync savedCases from Backend API & LocalStorage if user account switches
  useEffect(() => {
    const syncSavedCases = async () => {
      const key = getUserSavedCasesStorageKey();
      const localSaved = localStorage.getItem(key);
      if (localSaved) {
        setSavedCases(JSON.parse(localSaved));
      }

      const identifier = getUserIdentifier();
      if (identifier) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/saved-cases/${encodeURIComponent(identifier)}`);
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
            setSavedCases(data.data);
            localStorage.setItem(key, JSON.stringify(data.data));
          }
        } catch (err) {}
      }
    };
    syncSavedCases();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Toggle Save Case / Bookmark for Future Use
  const handleToggleSaveCase = async (caseItem, e) => {
    if (e) e.stopPropagation();
    if (!caseItem) return;

    const exists = savedCases.some(c => String(c.id) === String(caseItem.id));
    let updated;

    if (exists) {
      updated = savedCases.filter(c => String(c.id) !== String(caseItem.id));
      showToast(`Removed "${(caseItem.title || 'Case').substring(0, 30)}..." from your saved bookmarks`);
    } else {
      updated = [...savedCases, caseItem];
      showToast(`Saved "${(caseItem.title || 'Case').substring(0, 30)}..." to your account bookmarks for future use!`);
    }

    setSavedCases(updated);
    const key = getUserSavedCasesStorageKey();
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {}

    // Post to backend database for logged-in user
    const identifier = getUserIdentifier();
    if (identifier) {
      try {
        await fetch(`${API_BASE_URL}/auth/saved-cases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, cases: updated })
        });
      } catch (err) {}
    }
  };

  // Audio Text to Speech Reader with Popup Widget Controls
  const startSpeech = (rate = speechRate) => {
    if (!selectedCase) return;
    if (!('speechSynthesis' in window)) {
      showToast("Text-to-Speech is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const textToRead = `${selectedCase.title || ''}. Judgment of ${selectedCase.court_name || selectedCase.court || 'Supreme Court of India'}. ${selectedCase.head_note || ''}. ${selectedCase.content || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead.substring(0, 3000));
    utterance.rate = rate;
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
    setIsAudioWidgetOpen(true);
  };

  const handleToggleAudio = () => {
    if (!selectedCase) return;
    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        showToast("Audio resumed");
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
        showToast("Audio paused");
      }
    } else {
      startSpeech();
      showToast("Playing Judgment Audio...");
    }
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsAudioWidgetOpen(false);
  };

  const handleRestartAudio = () => {
    startSpeech();
    showToast("Restarting Audio from beginning...");
  };

  const handleChangeRate = (newRate) => {
    setSpeechRate(newRate);
    if (isSpeaking) {
      startSpeech(newRate);
    }
  };

  // Download Case directly as PDF document file using DLR PDF Exporter
  const handleDownloadCase = (caseItem, e) => {
    if (e) e.stopPropagation();
    if (!caseItem) return;
    downloadCaseAsPDF(caseItem, 'printable-judgment-document', showToast);
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const activeTabCode = searchParams.get('tab') || 'keyword';
        const searchUrl = query && query.trim()
          ? `${API_BASE_URL}/public/search?keyword=${encodeURIComponent(query.trim())}&tab=${encodeURIComponent(activeTabCode)}`
          : `${API_BASE_URL}/public/search?tab=${encodeURIComponent(activeTabCode)}`;

        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const normalized = data.data.map(c => ({
            ...c,
            id: c.id,
            title: c.title || c.case_number || c.caseNumber || 'Untitled Legal Precedent',
            case_number: c.case_number || c.caseNumber || '',
            caseNumber: c.caseNumber || c.case_number || '',
            court_name: c.court_name || c.court || 'Supreme Court of India',
            court: c.court || c.court_name || 'Supreme Court of India',
            judgment_date: c.judgment_date || c.judgmentDate || '',
            judgmentDate: c.judgmentDate || c.judgment_date || '',
            head_note: c.head_note || c.summary || c.headNote || '',
            summary: c.summary || c.head_note || c.headNote || '',
            content: c.content || c.judgment_text || c.judgmentText || '',
            judgment_text: c.judgment_text || c.content || c.judgmentText || '',
            petitioner_name: c.petitioner_name || c.petitioner || '',
            respondent_name: c.respondent_name || c.respondent || '',
            citation: Array.isArray(c.citations) && c.citations.length > 0 
              ? (c.citations[0].number && /INSC|SCC|AIR|SCALE|SCR|DLR/i.test(c.citations[0].number) 
                  ? c.citations[0].number 
                  : (c.citations[0].number ? `${c.citations[0].year || ''} DLR (${c.citations[0].court || 'SC'}) #${c.citations[0].number}` : (c.citations[0].year && c.citations[0].court ? `${c.citations[0].year} ${c.citations[0].court}` : 'Authentic Precedent')))
              : (typeof c.citations === 'string' ? c.citations : (c.citation || ''))
          }));

          setResults(normalized);
          setSelectedCase(normalized[0]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
      }
      
      setResults([]);
      setSelectedCase(null);
      setLoading(false);
    };

    fetchResults();
  }, [query, searchParams]);

  // Compute Categories & Courts
  const categoryCounts = useMemo(() => {
    const counts = { ALL: results.length, Judgments: 0 };
    results.forEach(r => {
      const cat = r.category || 'Judgments';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [results]);

  const courtCounts = useMemo(() => {
    const counts = {};
    results.forEach(r => {
      const court = r.court_name || 'Supreme Court of India';
      counts[court] = (counts[court] || 0) + 1;
    });
    return counts;
  }, [results]);

  // Filtered Results Calculation
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL' && (item.category || 'Judgments') !== selectedCategory) return false;
      
      // Court filter
      if (selectedCourtFilter !== 'ALL') {
        const itemCourt = (item.court_name || item.court || '').toLowerCase();
        if (!itemCourt.includes(selectedCourtFilter.toLowerCase())) return false;
      }

      // Year range filter
      const itemYr = parseInt(item.year || (item.judgment_date ? new Date(item.judgment_date).getFullYear() : 0), 10);
      if (itemYr && (itemYr < startYear || itemYr > endYear)) return false;

      // Search within search results input
      if (searchWithinResults.trim()) {
        const q = searchWithinResults.toLowerCase();
        const full = `${item.title || ''} ${item.citation || ''} ${item.content || ''} ${item.head_note || ''} ${item.case_number || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [results, selectedCategory, selectedCourtFilter, startYear, endYear, searchWithinResults]);

  // Current selected case index & navigation handlers
  const currentIndex = useMemo(() => {
    if (!selectedCase) return -1;
    return filteredResults.findIndex(r => String(r.id) === String(selectedCase.id));
  }, [filteredResults, selectedCase]);

  const handleNavFirst = () => { if (filteredResults.length > 0) setSelectedCase(filteredResults[0]); };
  const handleNavPrev = () => { if (currentIndex > 0) setSelectedCase(filteredResults[currentIndex - 1]); };
  const handleNavNext = () => { if (currentIndex >= 0 && currentIndex < filteredResults.length - 1) setSelectedCase(filteredResults[currentIndex + 1]); };
  const handleNavLast = () => { if (filteredResults.length > 0) setSelectedCase(filteredResults[filteredResults.length - 1]); };

  const handleCopyCitation = (citation) => {
    if (!citation) return;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    showToast("Citation & judgment title copied to clipboard!");
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const activeHighlightQuery = searchWithinDoc.trim() ? searchWithinDoc : query;

  return (
    <div className="flex flex-col w-full h-screen h-[100dvh] bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. TOP GLOBAL WORKSPACE HEADER BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border-b border-slate-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 shadow-md no-print">
        
        {/* Left: Brand Badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Scale size={18} className="text-white" />
            </div>
            <div>
              <span className="font-cinzel text-sm font-bold tracking-wider text-white">DIGI <span className="text-blue-400">LAW</span></span>
              <span className="text-[10px] block font-mono text-slate-400 -mt-1 tracking-widest uppercase">Reporter</span>
            </div>
          </div>
        </div>

        {/* Center: Search within search results box */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={searchWithinResults}
              onChange={(e) => setSearchWithinResults(e.target.value)}
              placeholder="Search within Search Results..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchWithinResults ? (
              <X 
                size={13} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-white"
                onClick={() => setSearchWithinResults('')}
              />
            ) : (
              <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Right: Back Button, Dashboard Button & Saved Cases Library Button */}
        <div className="flex items-center gap-2">
          
          {/* Back Button to Keyword Search */}
          <button
            onClick={() => {
              const tab = searchParams.get('tab') || 'keyword';
              const q = searchParams.get('q') || '';
              navigate(`/search/keyword?tab=${tab}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Return to Keyword Search Page"
          >
            <ArrowLeft size={14} className="text-blue-400" />
            <span>Back</span>
          </button>

          {/* Dashboard Button next to Saved Cases */}
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Return to Legal Research Dashboard"
          >
            <LayoutDashboard size={14} className="text-blue-400" />
            <span>Dashboard</span>
          </button>

          {/* Saved Cases Button */}
          <button
            onClick={() => setIsSavedDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="View Saved Cases Library"
          >
            <FolderBookmark size={15} />
            <span>Saved Cases</span>
            {savedCases.length > 0 && (
              <span className="bg-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {savedCases.length}
              </span>
            )}
          </button>

        </div>

      </div>

      {/* MOBILE MODE SWITCHER TABS (lg:hidden - Desktop View Unchanged) */}
      <div className="lg:hidden bg-[#0B1727] text-white flex items-center justify-around px-2 py-1.5 border-b border-slate-700 shrink-0 no-print">
        <button
          type="button"
          onClick={() => setMobileTab('results')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'results' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Search size={13} />
          <span>Results ({filteredResults.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('judgment')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'judgment' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          <FileText size={13} />
          <span>Judgment View</span>
          {selectedCase && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('filters')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'filters' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>Filters</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE-PANE LEGAL RESEARCH WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full h-[calc(100vh-49px)] overflow-hidden bg-slate-200">
        
        {/* PANE 1: FILTERS SIDEBAR (Left Column) */}
        <div className={`w-full lg:w-64 bg-slate-900 text-slate-200 border-b lg:border-b-0 lg:border-r border-slate-700 shrink-0 no-print ${mobileTab === 'filters' ? 'flex flex-col flex-1 h-full' : 'hidden lg:flex lg:flex-col'}`}>
          
          {/* Category Tabs */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-blue-400" /> Filter Options
            </span>
            <button 
              onClick={() => { setSelectedCategory('ALL'); setSelectedCourtFilter('ALL'); setSearchWithinResults(''); }}
              className="text-[10px] font-bold text-blue-400 hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Categories List */}
          <div className="p-2 space-y-1 border-b border-slate-800">
            <div className="text-[10px] font-extrabold text-slate-400 px-2 py-1 uppercase tracking-wider">
              Document Types
            </div>
            
            {[
              { id: 'Judgments', label: 'Judgments', count: results.length }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Courts Select Dropdown */}
          <div className="p-3 space-y-1.5 border-b border-slate-800">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Courts & Jurisdiction
            </label>
            <div className="relative">
              <select
                value={selectedCourtFilter}
                onChange={(e) => setSelectedCourtFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 font-medium pr-8 shadow-xs"
              >
                <option value="ALL">All Courts ({results.length})</option>
                {Object.entries(courtCounts).map(([court, count], idx) => (
                  <option key={idx} value={court}>
                    {court} ({count})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Year Range Filter - Pushed to Bottom */}
          <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Filter Years:</span>
              <span className="text-blue-400 font-mono">{startYear} to {endYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                min="1800"
                max="2026"
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-white"
              />
              <span>-</span>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                min="1800"
                max="2026"
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-white"
              />
            </div>
          </div>

        </div>

        {/* PANE 2: RESULT LIST (Middle Column) */}
        <div className={`w-full lg:w-[380px] bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-300 shrink-0 z-10 no-print ${mobileTab === 'results' ? 'flex flex-col flex-1 h-full' : 'hidden lg:flex lg:flex-col lg:h-full'}`}>
          
          {/* Result List Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-300 bg-white shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Result List
              </span>
              <span className="bg-slate-200 text-slate-700 font-mono font-bold text-[10px] px-1.5 py-0.2 rounded">
                {filteredResults.length}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Sort by:</span>
              <select className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600">
                <option>Relevance</option>
                <option>Latest Date</option>
                <option>Court Name</option>
              </select>
            </div>
          </div>

          {/* Scrollable Result Item Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200 bg-white" data-lenis-prevent>
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching database...</span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No judgments matching filter criteria.
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = selectedCase?.id === item.id;
                const isSaved = savedCases.some(c => String(c.id) === String(item.id));

                return (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setSelectedCase(item);
                      if (window.innerWidth < 1024) {
                        setMobileTab('judgment');
                      }
                    }}
                    className={`p-3 cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'bg-blue-50/90 border-l-4 border-l-blue-700 shadow-2xs' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Top Row: Case Title & Check Save Badge */}
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className={`font-bold text-xs leading-snug ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {index + 1}. {item.title}
                      </span>
                      {isSaved && (
                        <span className="bg-emerald-100 text-emerald-800 p-0.5 rounded shrink-0" title="Saved Case">
                          <CheckCircle2 size={12} />
                        </span>
                      )}
                    </div>
                    
                    {/* Citation, Date & Act/Section Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1.5">
                      {item.citation && (
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {item.citation}
                        </span>
                      )}
                      {item.judgment_date && (
                        <span className="text-slate-500 text-[10px] font-medium">
                          {new Date(item.judgment_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                      {(item.act || item.section) && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {item.act ? (item.section ? `${item.act} • ${item.section}` : item.act) : item.section}
                        </span>
                      )}
                    </div>

                    {/* Highlighted Snippet */}
                    <div 
                      className="text-[11px] text-slate-600 leading-normal line-clamp-2 mb-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 font-sans"
                      dangerouslySetInnerHTML={getHighlightedSnippet(item.content || item.head_note, query)}
                    />

                    {/* Court Badge & Mobile Direct Actions (lg:hidden) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Landmark size={11} className="text-blue-600" /> {item.court_name || 'Supreme Court of India'}
                      </span>

                      {/* Mobile-Only Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCase(item);
                          setMobileTab('judgment');
                        }}
                        className="lg:hidden w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-2xs cursor-pointer mt-1 sm:mt-0"
                      >
                        <FileText size={12} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* PANE 3: CASE DETAILS WORKSPACE & TOOLBAR (Right Column) */}
        <div id="case-details-workspace" className={`flex-1 min-h-0 bg-slate-200 relative z-0 h-full overflow-hidden ${mobileTab === 'judgment' ? 'flex flex-col flex-1 h-full' : 'hidden lg:flex lg:flex-col'}`}>
          
          {selectedCase ? (
            <>
              {/* CASE DETAILS ACTION TOOLBAR BAR */}
              <div className="bg-[#1E4D6E] text-white px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1 sm:gap-2 shrink-0 shadow-md z-10 no-print">
                
                {/* Navigation Pill (|< < Pencil > >|) - Hidden on mobile view only */}
                <div className="hidden sm:flex items-center bg-[#153852] rounded-full px-2 py-0.5 gap-1 border border-blue-400/30">
                  <button 
                    onClick={handleNavFirst} 
                    disabled={currentIndex <= 0}
                    className="p-1 hover:text-yellow-300 disabled:opacity-40 transition-colors cursor-pointer" 
                    title="First Case (|<)"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button 
                    onClick={handleNavPrev} 
                    disabled={currentIndex <= 0}
                    className="p-1 hover:text-yellow-300 disabled:opacity-40 transition-colors cursor-pointer" 
                    title="Previous Case (<)"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  {/* Highlighter Pencil Toggle */}
                  <button 
                    onClick={() => setIsHighlightingEnabled(!isHighlightingEnabled)} 
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${isHighlightingEnabled ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'}`} 
                    title="Toggle Keyword Highlighter"
                  >
                    <Highlighter size={13} />
                  </button>

                  <button 
                    onClick={handleNavNext} 
                    disabled={currentIndex < 0 || currentIndex >= filteredResults.length - 1}
                    className="p-1 hover:text-yellow-300 disabled:opacity-40 transition-colors cursor-pointer" 
                    title="Next Case (>)"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={handleNavLast} 
                    disabled={currentIndex < 0 || currentIndex >= filteredResults.length - 1}
                    className="p-1 hover:text-yellow-300 disabled:opacity-40 transition-colors cursor-pointer" 
                    title="Last Case (>|)"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>

                {/* Right Action Icons (Centered Font Size & Right-Aligned Print/Download/Share/Audio on Mobile) */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-1 sm:gap-2">
                  
                  {/* Left Mobile Group: Copy, Save/Bookmark, Search */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* 1. Copy Icon */}
                    <button 
                      onClick={() => handleCopyCitation(`${selectedCase.title}\nCitation: ${selectedCase.citation || 'N/A'}\nCourt: ${selectedCase.court_name || ''}`)}
                      className="p-1.5 hover:bg-blue-800/80 rounded transition-colors text-white cursor-pointer"
                      title="Copy Citation & Judgment Title"
                    >
                      {copiedCitation ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>

                    {/* 2. Save Case / Bookmark Icon */}
                    <button 
                      onClick={(e) => handleToggleSaveCase(selectedCase, e)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        savedCases.some(c => String(c.id) === String(selectedCase.id))
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'hover:bg-blue-800/80 text-white'
                      }`}
                      title={savedCases.some(c => String(c.id) === String(selectedCase.id)) ? "Saved Case (Click to remove)" : "Save Case / Bookmark"}
                    >
                      {savedCases.some(c => String(c.id) === String(selectedCase.id)) ? (
                        <BookmarkCheck size={16} className="text-emerald-200" />
                      ) : (
                        <Bookmark size={16} />
                      )}
                    </button>

                    {/* 3. Search inside Judgment Document */}
                    <div className="relative flex items-center">
                      <button 
                        onClick={() => setShowDocSearch(!showDocSearch)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${showDocSearch ? 'bg-blue-800 text-yellow-300' : 'hover:bg-blue-800/80 text-white'}`}
                        title="Find / Search in Judgment Text"
                      >
                        <Search size={16} />
                      </button>

                      {showDocSearch && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 top-9 bg-slate-900 border border-slate-700 p-1.5 rounded-lg shadow-xl flex items-center gap-1 z-50 w-44 sm:w-[240px]">
                          <input
                            type="text"
                            value={searchWithinDoc}
                            onChange={(e) => setSearchWithinDoc(e.target.value)}
                            placeholder="Search text..."
                            className="bg-slate-800 text-white text-[11px] px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-blue-500 flex-1 min-w-0 placeholder:text-[10px]"
                            autoFocus
                          />
                          <X size={14} className="text-slate-400 cursor-pointer hover:text-white shrink-0 p-0.5" onClick={() => setShowDocSearch(false)} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Mobile Group: Font Size Toggle (A+/A-) */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center bg-[#153852] rounded px-1.5 py-0.5 border border-blue-400/30 text-xs font-mono font-bold">
                      <button 
                        onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                        className="px-1 hover:text-yellow-300 transition-colors cursor-pointer"
                        title="Decrease Font Size"
                      >
                        A-
                      </button>
                      <span className="px-1 text-[11px] text-blue-200">{fontSize}px</span>
                      <button 
                        onClick={() => setFontSize(prev => Math.min(32, prev + 1))}
                        className="px-1 hover:text-yellow-300 transition-colors cursor-pointer"
                        title="Increase Font Size"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Right Mobile Group: Print, Download, Share, Audio */}
                  <div className="flex items-center gap-1 sm:gap-2 justify-end">
                    {/* 6. Print Icon */}
                    <button 
                      onClick={() => printCaseAsPDF(selectedCase, 'printable-judgment-document', showToast)}
                      className="p-1.5 hover:bg-blue-800/80 rounded transition-colors text-white cursor-pointer"
                      title="Print Official Legal Document"
                      aria-label="Print document"
                    >
                      <Printer size={16} />
                    </button>

                    {/* 7. Download PDF Icon */}
                    <button 
                      onClick={() => downloadCaseAsPDF(selectedCase, 'printable-judgment-document', showToast)}
                      className="p-1.5 hover:bg-blue-800/80 rounded transition-colors text-white cursor-pointer"
                      title="Download Judgment PDF Document"
                      aria-label="Download PDF document"
                    >
                      <Download size={16} />
                    </button>

                    {/* 8. Share Case with Popover Menu */}
                    <div className="relative flex items-center" ref={shareMenuRef}>
                      <button 
                        onClick={() => setIsShareMenuOpen(prev => !prev)}
                        className={`p-1.5 rounded transition-colors text-white cursor-pointer ${isShareMenuOpen ? 'bg-blue-800 text-yellow-300' : 'hover:bg-blue-800/80'}`}
                        title="Share Document"
                        aria-label="Share document"
                        aria-expanded={isShareMenuOpen}
                        aria-haspopup="true"
                      >
                        <Share2 size={16} />
                      </button>

                      {/* Share Popover Menu */}
                      {isShareMenuOpen && (
                        <div 
                          role="menu"
                          aria-label="Share options"
                          className="absolute right-0 top-9 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 min-w-[190px] text-xs font-sans space-y-1 animate-in fade-in zoom-in-95"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                            Share Document
                          </div>

                          {/* WhatsApp */}
                          <button
                            role="menuitem"
                            aria-label="Share on WhatsApp"
                            onClick={() => handleShareClick('whatsapp')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                          >
                            <WhatsappIcon />
                            <span>WhatsApp</span>
                          </button>

                          {/* LinkedIn */}
                          <button
                            role="menuitem"
                            aria-label="Share on LinkedIn"
                            onClick={() => handleShareClick('linkedin')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                          >
                            <LinkedInIcon />
                            <span>LinkedIn</span>
                          </button>

                          {/* X / Twitter */}
                          <button
                            role="menuitem"
                            aria-label="Share on X (Twitter)"
                            onClick={() => handleShareClick('twitter')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                          >
                            <TwitterXIcon />
                            <span>X / Twitter</span>
                          </button>

                          {/* Email */}
                          <button
                            role="menuitem"
                            aria-label="Share via Email"
                            onClick={() => handleShareClick('email')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                          >
                            <Mail size={15} className="text-sky-400 shrink-0" />
                            <span>Email</span>
                          </button>

                          <div className="border-t border-slate-800 my-1"></div>

                          {/* Copy Link */}
                          <button
                            role="menuitem"
                            aria-label="Copy document link"
                            onClick={() => handleShareClick('copy')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                          >
                            {copySuccess ? <Check size={15} className="text-emerald-400 shrink-0" /> : <Copy size={15} className="text-yellow-400 shrink-0" />}
                            <span>{copySuccess ? 'Link copied' : 'Copy Link'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 9. Audio Speaker Text-to-Speech Icon */}
                    <button 
                      onClick={handleToggleAudio}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${isSpeaking ? 'bg-yellow-400 text-slate-950 font-bold animate-pulse' : 'hover:bg-blue-800/80 text-white'}`}
                      title="Listen to Audio Judgment (Text-to-Speech)"
                    >
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                </div>
              </div>

              {/* Universal DLR Legal Document Viewer Container */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-slate-100/80 select-text space-y-4 print:p-0 print:bg-white print:overflow-visible" 
                data-lenis-prevent
              >
                <UniversalLegalDocument 
                  doc={selectedCase}
                  fontSize={fontSize}
                  searchQuery={activeHighlightQuery}
                  isHighlightingEnabled={isHighlightingEnabled}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto my-auto">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-200 shadow-sm">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900">No Case Found</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No published legal precedent was found in the database matching <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{query || 'your search'}</span>.
                </p>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="px-5 py-2 bg-[#0B1727] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                Back to Search Portal
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SAVED CASES BOOKMARKS DRAWER */}
      {/* ========================================================================= */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white text-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderBookmark className="text-yellow-400" size={18} />
                <h2 className="font-bold text-sm">Saved Cases Library ({savedCases.length})</h2>
              </div>
              <X size={18} className="cursor-pointer hover:text-yellow-300" onClick={() => setIsSavedDrawerOpen(false)} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 divide-y divide-slate-100" data-lenis-prevent>
              {savedCases.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Bookmark size={40} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No saved cases yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Click the bookmark icon on any judgment to save it to your account for future reference.
                  </p>
                </div>
              ) : (
                savedCases.map((item, idx) => (
                  <div key={idx} className="py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span 
                        onClick={() => { setSelectedCase(item); setIsSavedDrawerOpen(false); }}
                        className="font-bold text-xs text-blue-900 hover:underline cursor-pointer leading-snug"
                      >
                        {item.title}
                      </span>
                      <button 
                        onClick={(e) => handleToggleSaveCase(item, e)}
                        className="text-slate-400 hover:text-red-600 text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    {item.citation && (
                      <div className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block">
                        {item.citation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button 
                onClick={() => setIsSavedDrawerOpen(false)}
                className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Close Library
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SOCIAL MEDIA & EMAIL SHARE MODAL (WhatsApp, Twitter/X, LinkedIn, Email) */}
      {/* ========================================================================= */}
      {isShareModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="text-blue-600" size={18} />
                <h3 className="font-bold text-sm">Share Judgment Record</h3>
              </div>
              <X size={16} className="cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => setIsShareModalOpen(false)} />
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Share <span className="font-bold text-slate-900">"{selectedCase.title}"</span> across social media platforms or direct link:
            </div>

            {/* Social Media & Email Share Buttons (4 Platforms: WhatsApp, Twitter/X, LinkedIn, Email) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Digi Law Reporter Judgment:\n${selectedCase.title}\nCitation: ${selectedCase.citation || ''}\nLink: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <WhatsappIcon />
                <span>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this judgment on Digi Law Reporter: ${selectedCase.title}`)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0F1419] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <TwitterXIcon />
                <span>Twitter / X</span>
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>

              {/* Direct Email */}
              <button
                onClick={() => { setIsShareModalOpen(false); setIsEmailModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Mail size={15} />
                <span>Email</span>
              </button>

            </div>

            {/* Copy Direct Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded border border-slate-300 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Direct link copied to clipboard!");
                  setIsShareModalOpen(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded text-xs shrink-0 cursor-pointer"
              >
                Copy Link
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EMAIL DIRECT SHARE MODAL */}
      {/* ========================================================================= */}
      {isEmailModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="text-blue-600" size={18} />
                <h3 className="font-bold text-sm">Send Judgment via Email</h3>
              </div>
              <X size={16} className="cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => setIsEmailModalOpen(false)} />
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}&su=${encodeURIComponent(`Legal Judgment: ${selectedCase.title}`)}&body=${encodeURIComponent(`Hi,\n\nPlease find the details of the judgment from Digi Law Reporter:\n\nTitle: ${selectedCase.title}\nCitation: ${selectedCase.citation || 'N/A'}\nCourt: ${selectedCase.court_name || ''}\n\nSummary:\n${selectedCase.head_note || ''}\n\nRead full judgment online: ${window.location.href}`)}`;
                window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                showToast(`Opening Gmail composer...`);
                setIsEmailModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="lawyer@firm.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Case Preview:</div>
                <div className="truncate font-semibold">{selectedCase.title}</div>
                <div className="font-mono text-[11px] text-blue-700">{selectedCase.citation}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs shadow-md cursor-pointer"
                >
                  Send Email
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CASE DETAILS MODAL POPUP (Matching exact Screenshots 2 & 3) */}
      {isCaseDetailsModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-50 text-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base md:text-lg text-slate-900">
                Case Details
              </h3>
              <button
                onClick={() => setIsCaseDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body (4 Cards matching Screenshots 2 & 3) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans text-slate-900" data-lenis-prevent>
              
              {/* CARD 1: COURT, JUDGMENT DATE, CASE NUMBER, CITATION */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* COURT */}
                  <div className="md:col-span-8 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      COURT
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed uppercase">
                      {selectedCase.court_name || selectedCase.court || 'IN THE SUPREME COURT OF INDIA'}
                      {selectedCase.bench && ` ${selectedCase.bench}`}
                    </div>
                  </div>

                  {/* JUDGMENT DATE */}
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      JUDGMENT DATE
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                      {selectedCase.judgment_date 
                        ? (new Date(selectedCase.judgment_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }))
                        : (selectedCase.date || '—')}
                    </div>
                  </div>
                </div>

                {/* CASE NUMBER */}
                {selectedCase.case_number && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      CASE NUMBER
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed">
                      {selectedCase.case_number}
                    </div>
                  </div>
                )}

                {/* CITATION */}
                {selectedCase.citation && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      CITATION
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm font-mono">
                      {selectedCase.citation}
                    </div>
                  </div>
                )}

                {/* ACT & SECTION */}
                {(selectedCase.act || selectedCase.section) && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      ACT & SECTION
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                      {selectedCase.act && <span>{selectedCase.act}</span>}
                      {selectedCase.act && selectedCase.section && <span className="text-slate-400 mx-2">—</span>}
                      {selectedCase.section && <span className="text-emerald-700 font-semibold">{selectedCase.section}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: PETITIONER & RESPONDENT */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                {/* PETITIONER */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    PETITIONER
                  </span>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">
                    {selectedCase.petitioner_name || selectedCase.petitioner || selectedCase.title?.split(' vs ')[0] || selectedCase.title}
                  </div>
                </div>

                <div className="border-t border-slate-100"></div>

                {/* RESPONDENT */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    RESPONDENT
                  </span>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">
                    {selectedCase.respondent_name || selectedCase.respondent || selectedCase.title?.split(' vs ')[1] || '—'}
                  </div>
                </div>
              </div>

              {/* CARD 3: HEAD NOTE */}
              {selectedCase.head_note && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Head Note
                    </h3>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                    <div 
                      className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed font-sans"
                      dangerouslySetInnerHTML={getHighlightedFullText(selectedCase.head_note, activeHighlightQuery, isHighlightingEnabled)}
                    />
                  </div>
                </div>
              )}

              {/* CARD 4: FULL JUDGMENT */}
              {selectedCase.content && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block"></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Full Judgment
                    </h3>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                    <div 
                      className="whitespace-pre-line text-xs sm:text-sm text-slate-900 font-sans leading-relaxed text-justify"
                      dangerouslySetInnerHTML={getHighlightedFullText(selectedCase.content, activeHighlightQuery, isHighlightingEnabled)}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsCaseDetailsModalOpen(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 px-5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Audio Control Widget Popup */}
      {isAudioWidgetOpen && selectedCase && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4 max-w-xs w-full backdrop-blur-md animate-in slide-in-from-bottom-5 font-sans no-print">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
              <span className="font-bold text-xs text-slate-200">
                {isPaused ? 'Audio Paused' : 'Playing Judgment Audio'}
              </span>
            </div>
            <button 
              onClick={handleStopAudio}
              className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              title="Close Audio Control"
            >
              <X size={15} />
            </button>
          </div>

          {/* Case Title */}
          <div className="text-xs font-semibold text-slate-300 line-clamp-1 mb-3">
            {selectedCase.title}
          </div>

          {/* Controls: Play/Pause, Repeat, Stop, Speed */}
          <div className="flex items-center justify-between gap-2">
            
            <div className="flex items-center gap-2">
              {/* Play / Pause Button */}
              <button
                onClick={handleToggleAudio}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
                title={isPaused ? "Play Audio" : "Pause Audio"}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>

              {/* Repeat / Restart Button */}
              <button
                onClick={handleRestartAudio}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-700"
                title="Repeat / Restart from Beginning"
              >
                <RotateCcw size={15} />
              </button>

              {/* Stop Button */}
              <button
                onClick={handleStopAudio}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-red-500/30"
                title="Stop Audio"
              >
                <Square size={14} />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-[10px] font-bold">
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleChangeRate(rate)}
                  className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${speechRate === rate ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {rate}x
                </button>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 no-print">
          <Sparkles size={16} className="text-yellow-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
