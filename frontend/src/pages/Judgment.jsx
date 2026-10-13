import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Check, AlertTriangle, Loader2, 
  Share2, Copy, Mail, FileText, Eye, ExternalLink 
} from 'lucide-react';
import UniversalLegalDocument from '../components/UniversalLegalDocument';
import { downloadCaseAsPDF, printCaseAsPDF, getOriginalPdfUrl } from '../utils/pdfExporter';
import { API_BASE_URL } from '../config/api';

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

export default function Judgment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('pdf'); // 'pdf' or 'web'
  const [autoOpened, setAutoOpened] = useState(false);
  const shareMenuRef = useRef(null);

  const shouldOpenPdfParam = searchParams.get('open_pdf') === '1' || searchParams.get('pdf') === '1';

  // Responsive device detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const screenMobile = window.innerWidth <= 768;
      setIsMobile(userAgentMobile || screenMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (!data) return;
    const currentUrl = window.location.href;
    const title = data.title || 'Legal Precedent - Digi Law Reporter';
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
      case 'email': {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${currentUrl}`)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        break;
      }
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

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const fetchBackendCase = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cases/${id}`);
        const result = await res.json();
        
        if (!isMounted) return;

        if (result.success && result.data) {
          setData(result.data);
          const pdf = getOriginalPdfUrl(result.data);
          if (pdf) {
            setViewMode('pdf');
          } else {
            setViewMode('web');
          }
        } else {
          // If not found in /api/cases/:id, attempt fetching from public search
          const searchRes = await fetch(`${API_BASE_URL}/public/cases/search?q=${encodeURIComponent(id)}`);
          const searchResult = await searchRes.json();
          if (isMounted && searchResult.success && searchResult.data && searchResult.data.length > 0) {
            const matched = searchResult.data.find(c => String(c.id) === String(id)) || searchResult.data[0];
            setData(matched);
            const pdf = getOriginalPdfUrl(matched);
            if (pdf) {
              setViewMode('pdf');
            } else {
              setViewMode('web');
            }
          } else if (isMounted) {
            setError(result.message || 'Case precedent record not found in database.');
          }
        }
      } catch (err) {
        console.error('Error fetching case from backend:', err);
        if (isMounted) {
          setError('Failed to connect to backend server. Please verify backend API.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBackendCase();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Automatic PDF Opening on Mobile / Scanned QR with ?open_pdf=1
  useEffect(() => {
    if (data && shouldOpenPdfParam && !autoOpened) {
      setAutoOpened(true);
      const pdf = getOriginalPdfUrl(data);
      if (pdf) {
        // Automatically open the PDF in mobile or new tab
        const timer = setTimeout(() => {
          window.location.href = pdf;
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [data, shouldOpenPdfParam, autoOpened]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Download Case directly as PDF document file using DLR PDF Exporter
  const handleDownloadCase = () => {
    if (!data) return;
    downloadCaseAsPDF(data, 'printable-judgment-document', showToast);
  };

  if (loading) {
    return (
      <div className="w-full flex-1 py-16 flex flex-col items-center justify-center space-y-4 font-jakarta">
        <Loader2 size={36} className="text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Retrieving official case record from backend...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-6 font-jakarta">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Case Record Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || `No published case precedent matching ID "${id}" exists in the database.`}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Search / Cases
        </button>
      </div>
    );
  }

  const courtName = data.court_name || data.court || 'SUPREME COURT OF INDIA';
  const judgmentDate = data.judgment_date 
    ? new Date(data.judgment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : (data.date || '');

  const getCitationDisplay = (c) => {
    if (c.citation) return c.citation;
    if (c.citations_string) return c.citations_string;
    if (Array.isArray(c.citations) && c.citations.length > 0) {
      const item = c.citations[0];
      if (typeof item === 'string') return item;
      const yr = item.year || c.year || '';
      const mo = item.month ? ` (${item.month})` : '';
      const ct = item.court || 'SC';
      const num = item.number || item.count || item.dlrNumber || '';
      const eq = item.equivalentText ? ` : ${item.equivalentText}` : '';
      return `${yr}${mo} DLR (${ct}) #${num}${eq}`;
    }
    return null;
  };

  const citationText = getCitationDisplay(data);
  const pdfUrl = getOriginalPdfUrl(data);

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 font-jakarta">
      
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Search
        </button>

        {/* View Switcher Tabs (Only if Authentic PDF is available) */}
        {pdfUrl && (
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pdf' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <FileText size={14} /> PDF Document
            </button>
            <button
              onClick={() => setViewMode('web')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'web' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Eye size={14} /> Formatted Text
            </button>
          </div>
        )}
      </div>

      {/* Official Case Verification Banner (High-Impact Mobile / QR Landing) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-blue-900/40 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-400 shadow-inner">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ✓ Official Legal Precedent
              </span>
              {citationText && (
                <span className="text-xs font-semibold text-blue-300">
                  {citationText}
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-1 line-clamp-1">
              {data.case_number || data.title || 'Official Judgment Record'}
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1">
              {courtName} • {judgmentDate}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          {pdfUrl ? (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                title="Open PDF in Full Screen"
              >
                <Eye size={16} className="text-blue-600" /> Open PDF
              </a>
              <button
                onClick={handleDownloadCase}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                title="Download Authentic Judgment PDF"
              >
                <Download size={16} /> Download
              </button>
            </>
          ) : (
            <button
              onClick={handleDownloadCase}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
              title="Download Judgment PDF Document"
            >
              <Download size={16} /> Download PDF
            </button>
          )}

          {/* Print Button */}
          <button 
            onClick={() => printCaseAsPDF(data, 'printable-judgment-document', showToast)}
            className="p-2.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors cursor-pointer shrink-0" 
            title="Print Legal Document"
            aria-label="Print document"
          >
            <Printer size={18} />
          </button>

          {/* Share Button with Popover */}
          <div className="relative" ref={shareMenuRef}>
            <button 
              onClick={() => setIsShareMenuOpen(prev => !prev)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isShareMenuOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/15'
              }`} 
              title="Share Document"
              aria-label="Share document"
              aria-expanded={isShareMenuOpen}
              aria-haspopup="true"
            >
              <Share2 size={18} />
            </button>

            {/* Share Popover Menu */}
            {isShareMenuOpen && (
              <div 
                role="menu"
                aria-label="Share options"
                className="absolute right-0 top-12 bg-slate-900 text-white border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 min-w-[190px] text-xs font-sans space-y-1 animate-in fade-in zoom-in-95"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Share Document
                </div>

                <button
                  role="menuitem"
                  aria-label="Share on WhatsApp"
                  onClick={() => handleShareClick('whatsapp')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors font-medium cursor-pointer text-left"
                >
                  <WhatsappIcon />
                  <span>WhatsApp</span>
                </button>

                <button
                  role="menuitem"
                  aria-label="Share on LinkedIn"
                  onClick={() => handleShareClick('linkedin')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors font-medium cursor-pointer text-left"
                >
                  <LinkedInIcon />
                  <span>LinkedIn</span>
                </button>

                <button
                  role="menuitem"
                  aria-label="Share on X (Twitter)"
                  onClick={() => handleShareClick('twitter')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-medium cursor-pointer text-left"
                >
                  <TwitterXIcon />
                  <span>X / Twitter</span>
                </button>

                <button
                  role="menuitem"
                  aria-label="Share via Email"
                  onClick={() => handleShareClick('email')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-red-400 transition-colors font-medium cursor-pointer text-left"
                >
                  <Mail size={15} className="text-red-400 shrink-0" />
                  <span>Email</span>
                </button>

                <button
                  role="menuitem"
                  aria-label="Copy document link"
                  onClick={() => handleShareClick('copy')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-yellow-400 transition-colors font-medium cursor-pointer text-left border-t border-slate-800/80 mt-1 pt-1.5"
                >
                  {copySuccess ? <Check size={15} className="text-emerald-400 shrink-0" /> : <Copy size={15} className="text-yellow-400 shrink-0" />}
                  <span>{copySuccess ? 'Link copied' : 'Copy Link'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Render Authentic PDF Document or Universal Web Format */}
      {viewMode === 'pdf' && pdfUrl ? (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-8 print:hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Authentic Court PDF Document Viewer
            </span>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              Open Fullscreen <ExternalLink size={13} />
            </a>
          </div>

          {/* Embedded Viewer (Google Docs viewer for 100% Android/iOS cross-platform reliability) */}
          <div className="relative w-full h-[76vh] md:h-[84vh] bg-slate-50">
            <iframe
              src={isMobile ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true` : pdfUrl}
              className="w-full h-full border-0"
              title="Official Judgment PDF"
            />
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>Viewing authentic court copy. Tap below to download or open directly in your device viewer:</span>
            <div className="flex items-center gap-3">
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                Direct PDF Link <ExternalLink size={12} />
              </a>
              <button 
                onClick={handleDownloadCase}
                className="text-slate-900 font-bold hover:underline cursor-pointer"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Universal DLR Legal Document Format */
        <UniversalLegalDocument doc={data} />
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
