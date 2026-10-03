import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Scale, Bell, ArrowRight, Search, Key, BookOpen, Quote, Users, FolderTree, Type, 
  Home, User, Phone, CheckCircle, Calendar, FileText, Bookmark, RefreshCw, Mail, MapPin,
  ArrowLeft, Share2, Download, Volume2, BookmarkCheck, SlidersHorizontal, FileX, Sparkles, Check,
  MessageSquare, Send, Globe, Link2, Copy
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'search', 'contact', 'profile'
  const [selectedSearchMode, setSelectedSearchMode] = useState('keyword');

  // Gated Direct Login State (Fresh users start unauthenticated; login required for search/judgment/profile)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Search Inputs & Results & Judgment Reader State
  const [generalQuery, setGeneralQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [selectedJudgment, setSelectedJudgment] = useState(null);
  const [savedCases, setSavedCases] = useState([]);
  const [selectedCourtFilter, setSelectedCourtFilter] = useState('All');
  const [fontSize, setFontSize] = useState(13);

  // Active Toast Feedback State
  const [downloadToast, setDownloadToast] = useState('');
  const [bookmarkToast, setBookmarkToast] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState('');
  const [copyToast, setCopyToast] = useState('');

  // Helper to strip HTML tags and decode entities for clean text previews & PDF rendering
  const stripHtml = (html) => {
    if (!html) return '';
    let text = String(html);

    // Process block tags and line breaks to preserve paragraph structure
    text = text
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|blockquote|tr)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&ndash;/gi, '–')
      .replace(/&mdash;/gi, '—');

    return text.replace(/\n{3,}/g, '\n\n').trim();
  };

  // Helper to format clean authentic legal citations without internal database IDs
  const formatOfficialCitation = (item) => {
    if (!item) return '';
    
    // If citation is a valid string, strip any internal timestamp numbers like #1787047132756
    if (typeof item.citation === 'string' && item.citation.trim()) {
      const cleanCit = item.citation.replace(/#\d{10,}/g, '').trim();
      if (cleanCit) return cleanCit;
    }

    if (Array.isArray(item.citations) && item.citations.length > 0) {
      const c = item.citations[0];
      if (typeof c === 'string' && c.trim()) return c.trim().replace(/#\d{10,}/g, '');
      if (c && (c.number || c.year || c.month)) {
        const yr = c.year || item.year || '2024';
        const mo = c.month ? ` (${parseInt(c.month, 10)})` : '';
        const crt = (c.court || item.court || 'SC').toUpperCase().replace(/SUPREME COURT.*/i, 'SC').replace(/HIGH COURT.*/i, 'HC');
        const num = c.number || '1';
        return `${yr}${mo} DLR (${crt}) ${num}`;
      }
    }

    const yr = item.year || (item.judgment_date ? item.judgment_date.substring(0, 4) : '2024');
    const rawCourt = item.court || item.court_name || 'SC';
    const crt = rawCourt.toUpperCase().replace(/SUPREME COURT.*/i, 'SC').replace(/HIGH COURT.*/i, 'HC');
    return `${yr} DLR (${crt}) 1`;
  };

  // PDF DOWNLOAD HANDLER WITH REAL SCANNABLE QR CODE
  const handleDownloadPDF = async () => {
    if (!selectedJudgment) return;

    setDownloadToast('Generating A4 Legal PDF Document...');

    const caseId = String(selectedJudgment.id || '1');
    const canonicalUrl = `https://www.digilawreporter.in/case/${caseId}`;

    // Generate 100% Authentic Scannable Vector QR Code Data URI
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(canonicalUrl, { 
        margin: 1, 
        width: 160,
        color: { dark: '#0F172A', light: '#FFFFFF' }
      });
    } catch (err) {
      console.error("QR Code Generation Error:", err);
    }

    const docCitation = formatOfficialCitation(selectedJudgment);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${docCitation}</title>
          <style>
            @page { 
              size: A4 portrait; 
              margin: 12mm 15mm 15mm 15mm; 
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Times New Roman', Times, serif !important;
              color: #0f172a;
              font-size: 13px;
              line-height: 1.8;
              text-align: justify !important;
              text-justify: inter-word !important;
            }
            
            p, div, span, blockquote {
              font-family: 'Times New Roman', Times, serif !important;
              text-align: justify !important;
              text-justify: inter-word !important;
            }

            /* Print Table Structure ensuring tfoot reserves height on EVERY printed page */
            table.print-container {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
              padding: 0;
            }

            thead.print-header-space {
              height: 18mm;
            }
            
            tfoot.print-footer-space {
              height: 22mm;
            }

            /* Running Header at Top of Pages */
            .header-fixed {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 14mm;
              background: #ffffff;
              border-bottom: 1.5px solid #0f172a;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              padding-bottom: 4px;
              font-family: 'Times New Roman', Times, serif !important;
              z-index: 9999;
            }
            .header-fixed-left {
              font-size: 13px;
              font-weight: bold;
              text-decoration: underline;
              color: #0f172a;
            }
            .header-fixed-right {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 10px;
              font-weight: 800;
              color: #475569;
              letter-spacing: 0.5px;
            }

            /* Running Footer at Bottom of Pages */
            .footer-fixed {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: 18mm;
              background: #ffffff;
              border-top: 1px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 6px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 9px;
              color: #64748b;
              z-index: 9999;
            }
            .footer-left {
              line-height: 1.4;
            }
            .footer-left .page-num {
              font-weight: bold;
              color: #0f172a;
              margin-top: 2px;
            }
            .footer-center {
              color: #64748b;
            }

            /* Document Content Area */
            .content-body {
              padding-top: 6px;
            }

            /* Court Title */
            .court-title {
              text-align: center !important;
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 18px;
              letter-spacing: 0.5px;
              font-family: 'Times New Roman', Times, serif !important;
            }

            /* Parties Block */
            .parties-container {
              text-align: center !important;
              margin: 18px 0;
              line-height: 1.6;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .party-title {
              font-size: 14px;
              font-weight: bold;
              color: #0f172a;
            }
            .party-role {
              font-size: 11px;
              font-style: italic;
              color: #475569;
              margin-top: 2px;
            }
            .versus-text {
              font-size: 12px;
              font-style: italic;
              color: #64748b;
              margin: 8px 0;
            }

            /* Case Details Line */
            .appeal-details {
              text-align: center !important;
              font-size: 11px;
              font-style: italic;
              color: #334155;
              border-bottom: 1px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 22px;
              font-family: 'Times New Roman', Times, serif !important;
            }

            /* Headnote Shaded Box */
            .headnote-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 14px 18px;
              margin-bottom: 24px;
              text-align: justify !important;
              text-justify: inter-word !important;
              page-break-inside: avoid;
            }
            .headnote-title {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 10px;
              text-align: left !important;
            }
            .headnote-content {
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 12.5px;
              color: #1e293b;
              line-height: 1.75;
              text-align: justify !important;
              text-justify: inter-word !important;
            }

            /* Judgment Section */
            .judgment-heading {
              text-align: center !important;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 1px;
              margin: 24px 0 16px 0;
              page-break-after: avoid;
            }
            .judgment-body {
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 13px;
              color: #0f172a;
              line-height: 1.8;
              text-align: justify !important;
              text-justify: inter-word !important;
            }
            .judgment-body p, .judgment-body div {
              margin-bottom: 1.2em;
              text-align: justify !important;
              text-justify: inter-word !important;
              font-family: 'Times New Roman', Times, serif !important;
            }
          </style>
        </head>
        <body>
          
          <!-- Running Header -->
          <div class="header-fixed">
            <div class="header-fixed-left">${docCitation}</div>
            <div class="header-fixed-right">DIGI LAW REPORTER (DLR)</div>
          </div>

          <!-- Running Footer -->
          <div class="footer-fixed">
            <div class="footer-left">
              <div>${docCitation}</div>
            </div>
            <div class="footer-center">www.digilawreporter.in</div>
            <div class="footer-right">
              ${qrDataUrl ? `<img src="${qrDataUrl}" width="50" height="50" style="display:block; margin: 0 0 0 auto;" />` : ''}
            </div>
          </div>

          <!-- Main Printable Table Container -->
          <table class="print-container">
            <thead class="print-header-space">
              <tr><td>&nbsp;</td></tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="content-body">
                    
                    <!-- Court Title -->
                    ${selectedJudgment.court ? `<div class="court-title">IN THE ${selectedJudgment.court.toUpperCase()}</div>` : ''}

                    <!-- Appellant vs Respondent / Case Title -->
                    <div class="parties-container">
                      ${(selectedJudgment.petitioner_name && selectedJudgment.respondent_name) ? `
                        <div class="party-title">${selectedJudgment.petitioner_name}</div>
                        <div class="party-role">. . . Appellant(s);</div>
                        <div class="versus-text">Versus</div>
                        <div class="party-title">${selectedJudgment.respondent_name}</div>
                        <div class="party-role">. . . Respondent(s).</div>
                      ` : `
                        <div class="party-title">${selectedJudgment.title || selectedJudgment.appellant}</div>
                      `}
                    </div>

                    <!-- Case Appeal Details Line -->
                    ${(selectedJudgment.caseNo || selectedJudgment.decisionDate) ? `
                    <div class="appeal-details">
                      ${selectedJudgment.caseNo ? selectedJudgment.caseNo : ''}${(selectedJudgment.caseNo && selectedJudgment.decisionDate) ? ', ' : ''}${selectedJudgment.decisionDate ? `Decided on ${selectedJudgment.decisionDate}` : ''}
                    </div>` : ''}

                    <!-- HEADNOTE BOX -->
                    ${(selectedJudgment.headnote || selectedJudgment.summary) ? `
                    <div class="headnote-box">
                      <div class="headnote-title">HEADNOTE</div>
                      <div class="headnote-content">${selectedJudgment.headnote || selectedJudgment.summary}</div>
                    </div>` : ''}

                    <!-- JUDGMENT -->
                    ${(selectedJudgment.content || selectedJudgment.summary) ? `
                    <div class="judgment-heading">JUDGMENT</div>
                    <div class="judgment-body">
                      ${selectedJudgment.content || selectedJudgment.summary}
                    </div>` : ''}

                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot class="print-footer-space">
              <tr><td>&nbsp;</td></tr>
            </tfoot>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const filename = `${(selectedJudgment.citation || 'Judgment').replace(/[^a-zA-Z0-9]/g, '_')}_DigiLawReporter.html`;

    // Non-blocking Blob Data Download (Prevents browser thread freeze)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    setDownloadToast('PDF Document Saved to Storage! ✓');
    setTimeout(() => setDownloadToast(''), 3500);
  };

  const handleBackToResults = () => {
    setSelectedJudgment(null);
    setSearchExecuted(true);
    setDownloadToast('');
    if (searchResults.length === 0 && cases.length > 0) {
      setSearchResults(cases);
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  const toggleSaveCase = (caseItem) => {
    if (!caseItem) return;

    const isAlreadySaved = (savedCases || []).some(c => c && String(c.id) === String(caseItem.id));
    let updated;
    if (isAlreadySaved) {
      updated = (savedCases || []).filter(c => c && String(c.id) !== String(caseItem.id));
      setBookmarkToast('Removed from Saved');
    } else {
      updated = [...(savedCases || []), caseItem];
      setBookmarkToast('Saved to Profile');
    }
    setSavedCases(updated);
    setTimeout(() => setBookmarkToast(''), 2000);

    // Sync saved cases array directly to PostgreSQL Database API
    const userMobile = userProfile?.mobile || loginMobile || '9876543210';
    fetch('http://localhost:5000/api/auth/saved-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: userMobile, cases: updated })
    }).catch(err => console.error("Database Saved Cases Sync Error:", err));
  };

  const handleShareClick = async () => {
    if (!selectedJudgment) return;
    const citation = selectedJudgment.citation || 'Official Citation';
    const title = selectedJudgment.title || 'Legal Judgment';
    const shareUrl = window.location.href;
    const shareText = `🏛️ Legal Judgment: ${citation}\n${title}\n\nRead Full Judgment on Digi Law Reporter:\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Legal Ruling: ${citation}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log('Native share cancelled or unsupported, falling back to modal');
      }
    }
    setShowShareModal(true);
  };

  const handleShareOption = (channel) => {
    if (!selectedJudgment) return;

    const citation = selectedJudgment.citation || 'Official Citation';
    const title = selectedJudgment.title || 'Legal Judgment';
    const shareUrl = window.location.href;
    const shareText = `🏛️ Legal Judgment: ${citation}\n${title}\n\nRead Full Judgment on Digi Law Reporter:\n${shareUrl}`;

    const copyToClipboard = (textToCopy) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => {
          fallbackCopyText(textToCopy);
        });
      } else {
        fallbackCopyText(textToCopy);
      }
    };

    const fallbackCopyText = (textToCopy) => {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    };

    if (channel === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank') || (window.location.href = `whatsapp://send?text=${encodeURIComponent(shareText)}`);
    } else if (channel === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(`Legal Ruling: ${citation}`)}&body=${encodeURIComponent(shareText)}`;
    } else if (channel === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this legal ruling: ${citation} - ${title} ${shareUrl}`)}`, '_blank');
    } else if (channel === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (channel === 'copylink') {
      copyToClipboard(shareUrl);
      setCopyToast('link');
      setTimeout(() => setCopyToast(''), 2500);
    } else if (channel === 'copysummary') {
      copyToClipboard(shareText);
      setCopyToast('summary');
      setTimeout(() => setCopyToast(''), 2500);
    }
  };

  // Citation inputs
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [reporter, setReporter] = useState('DLR');
  const [court, setCourt] = useState('');
  const [page, setPage] = useState('');
  const [equivalentText, setEquivalentText] = useState('');

  // Party search inputs
  const [partyQuery, setPartyQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('All Courts');
  const [availableCourts, setAvailableCourts] = useState(['All Courts']);

  const [judgmentHighlightQuery, setJudgmentHighlightQuery] = useState('');

  // Bulletproof Highlighting & HTML rendering helper (Highlights 100% of entire searched term safely)
  const renderJudgmentContent = (content, highlightTerm, baseFontSize) => {
    if (!content) return null;
    const rawHtml = String(content);
    const trimmed = (highlightTerm || '').trim();

    if (!trimmed) {
      return (
        <div 
          className="text-slate-800 font-serif leading-relaxed text-justify space-y-3 judgment-content-body select-text cursor-text"
          style={{ fontSize: `${baseFontSize}px` }}
          dangerouslySetInnerHTML={{ __html: rawHtml }}
        />
      );
    }

    const escapedTerm = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`(${escapedTerm})`, 'gi');

    // Split HTML into tags vs plain text tokens to safely highlight text without breaking HTML tags
    const tokens = rawHtml.split(/(<[^>]+>)/g);
    const highlightedHtml = tokens.map(token => {
      if (token.startsWith('<') && token.endsWith('>')) {
        return token;
      }
      return token.replace(termRegex, '<mark class="bg-yellow-300 text-slate-950 font-extrabold px-1 py-0.5 rounded shadow-2xs">$1</mark>');
    }).join('');

    return (
      <div 
        className="text-slate-800 font-serif leading-relaxed text-justify space-y-3 judgment-content-body select-text cursor-text"
        style={{ fontSize: `${baseFontSize}px` }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  };
  const [cases, setCases] = useState([]);

  const [appLoading, setAppLoading] = useState(false);

  // Fetch Cases from Shared Backend REST API Strictly
  useEffect(() => {
    fetch('http://localhost:5000/api/public/search')
      .then(res => res.json())
      .then(data => {
        const fetchedCases = data.cases || data.data || [];
        const mappedCases = fetchedCases.map(item => ({
          ...item,
          id: String(item.id),
          citation: formatOfficialCitation(item),
          court: item.court_name || item.court || '',
          appellant: item.petitioner_name || item.petitioner || item.appellant || (item.title ? item.title.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i)[0] : ''),
          respondent: item.respondent_name || item.respondent || (item.title ? item.title.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i)[1] : ''),
          caseNo: item.case_number || item.caseNo || '',
          decisionDate: item.judgment_date ? new Date(item.judgment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (item.decisionDate || ''),
          headnote: item.head_note || item.headnote || item.summary || '',
          content: item.judgment_text || item.content || item.summary || '',
          year: item.year || (item.judgment_date ? new Date(item.judgment_date).getFullYear() : ''),
          title: item.title || `${item.petitioner_name || ''}${item.respondent_name ? ' vs. ' + item.respondent_name : ''}`
        }));
        setCases(mappedCases);
        
        const courtsList = ['All Courts'];
        mappedCases.forEach(c => {
          if (c.court && !courtsList.includes(c.court)) {
            courtsList.push(c.court);
          }
        });
        setAvailableCourts(courtsList);
        setTimeout(() => setAppLoading(false), 900);
      })
      .catch(err => {
        console.error("Backend REST API offline or no database connection:", err);
        setCases([]);
        setTimeout(() => setAppLoading(false), 900);
      });
  }, []);

  // Restore logged in user session on app launch from localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('dlr_user_session');
      if (savedSession) {
        const u = JSON.parse(savedSession);
        if (u && u.mobile) {
          setIsLoggedIn(true);
          setUserProfile(u);
          fetch(`http://localhost:5000/api/auth/saved-cases/${u.mobile}`)
            .then(res => res.json())
            .then(data => {
              if (data && Array.isArray(data.data)) {
                setSavedCases(data.data);
              }
            })
            .catch(err => console.error("Error restoring saved cases from database:", err));
        }
      }
    } catch (e) {
      console.error("LocalStorage session recovery error:", e);
    }
  }, []);

  const openJudgment = (item, originResults = null) => {
    if (!isLoggedIn) {
      setPendingAction({ type: 'judgment', item, originResults });
      setActiveTab('login');
      return;
    }
    if (!item) return;
    if (originResults && Array.isArray(originResults) && originResults.length > 0) {
      setSearchResults(originResults);
    } else if (searchResults.length === 0 && cases.length > 0) {
      setSearchResults(cases);
    }
    setSearchExecuted(true);
    setSelectedJudgment(item);
    setActiveTab('search');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleTabClick = (tabName) => {
    if ((tabName === 'search' || tabName === 'profile') && !isLoggedIn) {
      setPendingAction({ type: 'tab', target: tabName });
      setActiveTab('login');
      return;
    }
    setActiveTab(tabName);
    if (tabName === 'search') {
      setSearchExecuted(false);
      setSelectedJudgment(null);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const openSearchMode = (modeKey) => {
    if (!isLoggedIn) {
      setPendingAction({ type: 'mode', mode: modeKey });
      setActiveTab('login');
      return;
    }
    setSelectedSearchMode(modeKey);
    setActiveTab('search');
    setSearchExecuted(false);
    setSelectedJudgment(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleDirectLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginName.trim() || !loginMobile.trim()) {
      alert('Please enter your Name and Mobile Number');
      return;
    }
    const cleanName = loginName.trim();
    const cleanMobile = loginMobile.trim();
    const userObj = { name: cleanName, mobile: cleanMobile };

    let finalUser = userObj;

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, mobile: cleanMobile })
      });
      const data = await res.json();
      if (data && data.user) {
        finalUser = data.user;
      }
    } catch (err) {
      console.error("Backend Auth Login API Sync Error:", err);
    }

    setUserProfile(finalUser);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    localStorage.setItem('dlr_user_session', JSON.stringify(finalUser));

    // Fetch saved cases for user from database
    fetch(`http://localhost:5000/api/auth/saved-cases/${cleanMobile}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setSavedCases(data.data);
        }
      })
      .catch(err => console.error("Error fetching saved cases from database:", err));

    // Execute pending action directly on SINGLE TAP post-login
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);

      if (action.type === 'judgment') {
        if (action.originResults && Array.isArray(action.originResults) && action.originResults.length > 0) {
          setSearchResults(action.originResults);
        } else if (cases.length > 0) {
          setSearchResults(cases);
        }
        setSearchExecuted(true);
        setSelectedJudgment(action.item);
        setActiveTab('search');
      } else if (action.type === 'mode') {
        setSelectedSearchMode(action.mode);
        setActiveTab('search');
        setSearchExecuted(false);
        setSelectedJudgment(null);
      } else if (action.type === 'tab') {
        setActiveTab(action.target);
        if (action.target === 'search') {
          setSearchExecuted(false);
          setSelectedJudgment(null);
        }
      } else if (action.type === 'save') {
        if (action.item) {
          const isAlreadySaved = savedCases.some(c => c.id === action.item.id);
          const updated = isAlreadySaved 
            ? savedCases.filter(c => c.id !== action.item.id) 
            : [...savedCases, action.item];
          setSavedCases(updated);
        }
        setActiveTab('profile');
      }
    } else {
      setActiveTab('search');
      setSearchExecuted(false);
      setSelectedJudgment(null);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSignOut = () => {
    localStorage.removeItem('dlr_user_session');
    setIsLoggedIn(false);
    setUserProfile(null);
    setSavedCases([]);
    setActiveTab('home');
  };

  // SEARCH EXECUTION FUNCTION (CONNECTED STRICTLY TO BACKEND REST API / DATABASE WITH LOCAL FALLBACK)
  const executeSearch = async (customQuery = '') => {
    let q = customQuery;
    if (!q) {
      if (selectedSearchMode === 'citation') {
        const cleanMonth = month ? month.trim() : '';
        const cleanPage = page ? page.trim() : '';
        const cleanYear = year ? year.trim() : '';
        const cleanCourt = court ? court.trim() : '';
        const cleanReporter = reporter ? reporter.trim() : 'DLR';
        
        q = [cleanYear, cleanMonth, cleanReporter, cleanCourt, cleanPage].filter(Boolean).join(' ');
      } else if (selectedSearchMode === 'party') {
        q = partyQuery.trim();
      } else {
        q = generalQuery.trim();
      }
    }

    let results = [];

    try {
      const url = `http://localhost:5000/api/public/search?q=${encodeURIComponent(q)}&tab=${selectedSearchMode}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const rawList = data.data || data.cases || [];
      results = rawList.map(item => ({
        ...item,
        id: String(item.id),
        citation: formatOfficialCitation(item),
        court: item.court_name || item.court || '',
        appellant: item.petitioner_name || item.petitioner || item.appellant || (item.title ? item.title.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i)[0] : ''),
        respondent: item.respondent_name || item.respondent || (item.title ? item.title.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i)[1] : ''),
        caseNo: item.case_number || item.caseNo || '',
        decisionDate: item.judgment_date ? new Date(item.judgment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (item.decisionDate || ''),
        headnote: item.head_note || item.headnote || item.summary || '',
        content: item.judgment_text || item.content || item.summary || '',
        year: item.year || (item.judgment_date ? new Date(item.judgment_date).getFullYear() : ''),
        title: item.title || `${item.petitioner_name || ''}${item.respondent_name ? ' vs. ' + item.respondent_name : ''}`
      }));
    } catch (err) {
      console.error('API Search Execution Failed:', err);
    }

    // Local DB Fallback Search if backend returns 0 results
    if (results.length === 0 && cases.length > 0) {
      const qLower = q.toLowerCase();
      const tokens = qLower.replace(/[()#:&|\-!\\/]/g, ' ').split(/\s+/).filter(Boolean);

      results = cases.filter(c => {
        if (tokens.length === 0) return true;
        const searchable = `${c.citation} ${c.title} ${c.appellant} ${c.respondent} ${c.court} ${c.caseNo} ${c.headnote} ${c.content}`.toLowerCase();
        return tokens.some(t => searchable.includes(t));
      });
    }

    setSearchResults(results);
    setSearchExecuted(true);
    setSelectedJudgment(null); // ALWAYS show RESULT LIST screen first! User selection moves to next screen!
  };

  const searchOptions = [
    { key: 'keyword', title: 'Keyword Search', desc: 'Search by legal terms, principles, or subjects', icon: Key, hint: 'Enter keywords (e.g. Basic Structure, Article 21)...' },
    { key: 'section', title: 'Find Content by Section', desc: 'Search by IPC, CrPC, CPC, or Act Section numbers', icon: BookOpen, hint: 'Enter Section & Act (e.g. Section 302 IPC, Art 368)...' },
    { key: 'citation', title: 'Find by Citation', desc: 'Search official reporter citations (AIR, SCC, DLR)', icon: Quote, hint: 'Enter official citation...' },
    { key: 'party', title: 'Find by Party Name', desc: 'Search by Petitioner, Appellant, or Respondent name', icon: Users, hint: 'Type Party Name / Case Title...' },
    { key: 'topic', title: 'Find by Topic', desc: 'Browse rulings grouped under legal subject topics', icon: FolderTree, hint: 'Enter legal topic...' },
    { key: 'words', title: 'Words & Phrases', desc: 'Search judicial interpretations of legal terms', icon: Type, hint: 'Enter legal phrase...' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/70 text-slate-800 pb-20 scroll-smooth">
      
      {/* 1. APP HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs gpu-layer">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm shadow-blue-500/20">
            <Scale size={18} strokeWidth={2} />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            DIGI LAW <span className="text-blue-600 font-semibold">REPORTER</span>
          </span>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      {activeTab === 'home' && (
        <main className="flex-1 space-y-5">
          
          {/* HERO BANNER WITH HIGH-VISIBILITY BACKGROUND IMAGE */}
          <div 
            className="relative text-white p-5 space-y-3.5 shadow-md overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url('/hero_bg.jpg')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-blue-950/45 to-slate-950/55"></div>
            
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-slate-950/40 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-blue-200 border border-blue-400/40 shadow-sm">
                <CheckCircle size={12} className="text-blue-400" />
                <span>Trusted Legal Research Partner</span>
              </div>

              <h1 className="text-xl font-bold leading-snug tracking-tight text-white drop-shadow-md">
                Legal Research Portal for <span className="text-blue-400 font-semibold">Judgments & Statutes</span>
              </h1>

              <p className="text-slate-200 text-xs font-medium leading-relaxed max-w-xs drop-shadow-sm">
                Search, discover and analyze authentic court rulings from Supreme Court, High Courts & Tribunals.
              </p>
            </div>
          </div>

          {/* EXPLORE COURTS */}
          <section className="px-4 space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900">Explore Courts</h2>

            <div className="grid grid-cols-3 gap-2.5">
              <div 
                onClick={() => openSearchMode('party')}
                className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-md cursor-pointer flex flex-col justify-between h-24 transition-all duration-200 active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Scale size={14} strokeWidth={2} />
                  </div>
                  <ArrowRight size={10} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 transition-colors truncate">Supreme Court</h3>
                  <p className="text-[10px] text-slate-500 font-normal truncate">Full Archive</p>
                </div>
              </div>

              <div 
                onClick={() => openSearchMode('party')}
                className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-md cursor-pointer flex flex-col justify-between h-24 transition-all duration-200 active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen size={14} strokeWidth={2} />
                  </div>
                  <ArrowRight size={10} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 transition-colors truncate">High Courts</h3>
                  <p className="text-[10px] text-slate-500 font-normal truncate">All States</p>
                </div>
              </div>

              <div 
                onClick={() => openSearchMode('party')}
                className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-md cursor-pointer flex flex-col justify-between h-24 transition-all duration-200 active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Quote size={14} strokeWidth={2} />
                  </div>
                  <ArrowRight size={10} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 transition-colors truncate">Tribunals</h3>
                  <p className="text-[10px] text-slate-500 font-normal truncate">NCLAT, NGT • & more</p>
                </div>
              </div>
            </div>
          </section>

          {/* RECENT JUDGMENTS SECTION */}
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Judgments</h2>
              <button onClick={() => handleTabClick('search')} className="text-xs font-medium text-blue-600 hover:underline">View All →</button>
            </div>

            {cases.slice(0, 3).map(c => (
              <div 
                key={c.id} 
                onClick={() => openJudgment(c, cases)}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md cursor-pointer transition-all duration-200 space-y-2 active-press gpu-layer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-blue-50 text-blue-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-md border border-blue-100/80">
                    {c.court}
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium">{c.year}</span>
                </div>
                <h3 className="font-semibold text-xs text-slate-900 leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-normal line-clamp-3">
                  <span className="font-semibold text-blue-700 block mb-0.5">Citation: {stripHtml(c.citation)}</span>
                  {stripHtml(c.summary || c.headnote)}
                </p>
              </div>
            ))}
          </section>

        </main>
      )}

      {/* SEARCH TAB VIEW */}
      {activeTab === 'search' && (
        <main className="flex-1 space-y-4">
          
          {/* SEARCH FORM (SHOWN WHEN SEARCH HAS NOT BEEN EXECUTED YET) */}
          {!searchExecuted && (
            <div className="px-4 py-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Legal Research Portal</span>
                <h1 className="text-lg font-bold text-slate-900">Search Case Repository</h1>
              </div>

              {/* DYNAMIC SEARCH INPUT BOX CONTAINER */}
              {selectedSearchMode === 'citation' ? (
                /* CITATION SEARCH BOX WITH COMPACT SMALL BACKGROUND LAYOUT */
                <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  {/* Line 1: Tokens -> Year ( Month ) DLR ( Court ) Page # AND Get Citation Button on SAME ROW! */}
                  <div className="flex items-center flex-wrap gap-1 text-slate-500 text-xs font-bold">
                    <input 
                      type="text" 
                      value={year} 
                      onChange={e => setYear(e.target.value)} 
                      placeholder="Year"
                      className="w-14 py-1.5 px-1.5 text-center text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:bg-white text-slate-900 shadow-2xs"
                    />

                    <span className="text-slate-400 font-normal px-0.5">(</span>

                    <input 
                      type="text" 
                      value={month} 
                      onChange={e => setMonth(e.target.value)} 
                      placeholder="Month"
                      className="w-12 py-1.5 px-1.5 text-center text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:bg-white text-slate-900 shadow-2xs"
                    />

                    <span className="text-slate-400 font-normal px-0.5">)</span>

                    <div className="py-1.5 px-2 text-center text-xs font-black bg-slate-900 text-white rounded-lg border border-slate-900 shadow-2xs">
                      DLR
                    </div>

                    <span className="text-slate-400 font-normal px-0.5">(</span>

                    <input 
                      type="text" 
                      value={court} 
                      onChange={e => setCourt(e.target.value)} 
                      placeholder="Court"
                      className="w-12 py-1.5 px-1.5 text-center text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:bg-white text-slate-900 shadow-2xs"
                    />

                    <span className="text-slate-400 font-normal px-0.5">)</span>

                    <input 
                      type="text" 
                      value={page} 
                      onChange={e => setPage(e.target.value)} 
                      placeholder="Page #"
                      className="w-14 py-1.5 px-1.5 text-center text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:bg-white text-slate-900 shadow-2xs"
                    />

                    <button 
                      onClick={() => executeSearch()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 active:scale-98 transition-all shadow-sm shadow-blue-500/20 ml-auto"
                    >
                      <Search size={12} />
                      <span>Get Citation</span>
                    </button>
                  </div>

                  {/* Line 2: : Equivalent text & Clear link */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-400 font-bold text-xs px-0.5">:</span>
                    <input 
                      type="text" 
                      value={equivalentText} 
                      onChange={e => setEquivalentText(e.target.value)} 
                      placeholder="Equivalent text"
                      className="flex-1 py-1.5 px-2.5 text-xs font-normal bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:bg-white text-slate-900 shadow-2xs"
                    />
                    <button 
                      onClick={() => { setYear(''); setMonth(''); setCourt(''); setPage(''); setEquivalentText(''); }}
                      className="text-xs text-slate-500 font-medium hover:text-slate-700 transition-colors px-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : selectedSearchMode === 'party' ? (
                /* PARTY SEARCH BOX */
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">SEARCH BY PARTY NAME</h3>
                  
                  <select 
                    value={selectedCourt}
                    onChange={e => setSelectedCourt(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600 text-slate-800"
                  >
                    {availableCourts.map(ct => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={partyQuery} 
                      onChange={e => setPartyQuery(e.target.value)} 
                      placeholder="Type Party Name / Case Title..."
                      className="flex-1 py-2 px-3 text-xs font-normal bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                    />

                    <button 
                      onClick={() => executeSearch()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 active:scale-98 transition-all shadow-sm"
                    >
                      <Search size={14} />
                      <span>Find Case</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD SEARCH INPUT */
                <div className="space-y-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={generalQuery} 
                      onChange={e => setGeneralQuery(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') executeSearch(); }}
                      placeholder={searchOptions.find(o => o.key === selectedSearchMode)?.hint}
                      className="w-full py-2.5 pl-10 pr-20 text-xs font-normal bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600 shadow-xs"
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
                    <button 
                      onClick={() => executeSearch()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-xs active:scale-98 transition-all"
                    >
                      Search
                    </button>
                  </div>
                </div>
              )}

              {/* SELECT SEARCH MODE CARDS GRID (MODELED AFTER WEBSITE CARD GRID) */}
              <div className="space-y-2.5 pt-1">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">Select Search Mode:</h3>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {searchOptions.map(opt => {
                    const IconComponent = opt.icon;
                    const isSelected = selectedSearchMode === opt.key;

                    return (
                      <div 
                        key={opt.key}
                        onClick={() => setSelectedSearchMode(opt.key)}
                        className={`p-3 rounded-2xl border flex flex-col justify-between h-28 transition-all duration-200 cursor-pointer active:scale-98 relative overflow-hidden group ${
                          isSelected 
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm' 
                            : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl transition-colors ${
                            isSelected ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                          }`}>
                            <IconComponent size={18} strokeWidth={2} />
                          </div>
                        </div>

                        <div>
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-900'} leading-tight`}>{opt.title}</h4>
                          <p className="text-[10px] text-slate-500 font-normal line-clamp-2 mt-0.5 leading-tight">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 1. FULL JUDGMENT READER PAGE (IF USER SELECTED ANY JUDGMENT CARD FROM SEARCH, HOME, OR PROFILE) */}
          {selectedJudgment ? (
            <div className="space-y-3">
              
              {/* DOWNLOAD TOAST NOTIFICATION */}
              {downloadToast && (
                <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center shadow-md animate-fadeIn flex items-center justify-center gap-2">
                  <Check size={14} strokeWidth={3} />
                  <span>{downloadToast}</span>
                </div>
              )}

              {/* Top Action Toolbar */}
              <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between shadow-md gap-2">
                <button 
                  onClick={handleBackToResults}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-transform flex-shrink-0"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Result List ({searchResults.length})</span>
                  <span className="sm:hidden">({searchResults.length})</span>
                </button>

                {/* CENTER SEARCH BOX TO HIGHLIGHT TEXT ON JUDGMENT */}
                <div className="relative flex-1 max-w-[170px] sm:max-w-[220px]">
                  <input 
                    type="text" 
                    value={judgmentHighlightQuery}
                    onChange={e => setJudgmentHighlightQuery(e.target.value)}
                    placeholder="Highlight text..."
                    className="w-full py-1 pl-7 pr-6 text-[11px] font-semibold bg-slate-800 border border-slate-700 rounded-lg outline-none text-white focus:border-blue-500 focus:bg-slate-950 placeholder:text-slate-400 shadow-2xs"
                  />
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  {judgmentHighlightQuery && (
                    <button 
                      onClick={() => setJudgmentHighlightQuery('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Action Bar Icons */}
                <div className="flex items-center gap-2 text-slate-300 flex-shrink-0">
                  {/* Text Size Resizer */}
                  <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-1 rounded-md text-[10px] font-bold">
                    <button onClick={() => setFontSize(Math.max(11, fontSize - 1))} className="hover:text-white px-0.5">A-</button>
                    <span>{fontSize}px</span>
                    <button onClick={() => setFontSize(Math.min(18, fontSize + 1))} className="hover:text-white px-0.5">A+</button>
                  </div>

                  {/* Bookmark / Save */}
                  <button 
                    onClick={() => toggleSaveCase(selectedJudgment)}
                    className={`transition-colors ${(savedCases || []).some(c => c && String(c.id) === String(selectedJudgment?.id)) ? 'text-yellow-400' : 'hover:text-white'}`}
                    title={(savedCases || []).some(c => c && String(c.id) === String(selectedJudgment?.id)) ? "Unsave Case" : "Save Case to Profile"}
                  >
                    <Bookmark size={15} fill={(savedCases || []).some(c => c && String(c.id) === String(selectedJudgment?.id)) ? 'currentColor' : 'none'} />
                  </button>

                  {/* Share */}
                  <button 
                    onClick={handleShareClick}
                    className="hover:text-white transition-colors active:scale-95 p-0.5"
                    title="Share Judgment"
                  >
                    <Share2 size={15} />
                  </button>

                  {/* Download PDF */}
                  <button 
                    onClick={handleDownloadPDF}
                    className="hover:text-white transition-colors active:scale-95 p-0.5"
                    title="Download PDF to Storage"
                  >
                    <Download size={15} />
                  </button>

                </div>
              </div>

              {/* FORMATTED MOBILE LEGAL DOCUMENT SHEET */}
              <div className="px-4 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-md space-y-5">
                  
                  {/* Official Citation Header */}
                  <div className="text-center space-y-1 border-b border-slate-100 pb-4">
                    <span className="text-sm font-black text-slate-900 tracking-wider uppercase block">
                      {selectedJudgment.citation}
                    </span>
                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest pt-1">
                      {selectedJudgment.court}
                    </h2>
                  </div>

                  {/* Appellant vs Respondent Section */}
                  <div className="text-center space-y-2 py-1">
                    <h3 className="font-serif font-bold text-sm text-blue-950 leading-snug">
                      {selectedJudgment.appellant || selectedJudgment.title} ... <span className="font-sans text-xs font-bold text-slate-600">Appellant(s);</span>
                    </h3>
                    {selectedJudgment.respondent && (
                      <>
                        <p className="text-xs italic text-slate-400 font-serif">Versus</p>
                        <h3 className="font-serif font-bold text-sm text-blue-950 leading-snug">
                          {selectedJudgment.respondent} ... <span className="font-sans text-xs font-bold text-slate-600">Respondent(s).</span>
                        </h3>
                      </>
                    )}
                  </div>

                  {/* Appeal Case Number & Decision Date */}
                  {(selectedJudgment.caseNo || selectedJudgment.decisionDate) && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-1">
                      {selectedJudgment.caseNo && (
                        <p className="text-[10px] font-bold text-slate-600 tracking-tight">
                          {selectedJudgment.caseNo}
                        </p>
                      )}
                      {selectedJudgment.decisionDate && (
                        <p className="text-[11px] font-extrabold text-blue-700">
                          Decided on {selectedJudgment.decisionDate}
                        </p>
                      )}
                    </div>
                  )}

                  {/* HEAD NOTE & RATIO DECIDENDI BOXED SECTION */}
                  {(selectedJudgment.headnote || selectedJudgment.summary) && (
                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-1.5">
                      <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                        HEAD NOTE & RATIO DECIDENDI
                      </span>
                      {renderJudgmentContent(selectedJudgment.headnote || selectedJudgment.summary, judgmentHighlightQuery, fontSize)}
                    </div>
                  )}

                  {/* FULL JUDGMENT TEXT */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      FULL JUDGMENT & ORDER
                    </span>
                    {renderJudgmentContent(selectedJudgment.content || selectedJudgment.summary, judgmentHighlightQuery, fontSize)}
                  </div>

                </div>
              </div>

            </div>
          ) : searchExecuted ? (
            /* 2. SEARCH EXECUTED VIEW (CASE NOT FOUND VS RESULT LIST) */
            <div className="space-y-4">
              {searchResults.length === 0 ? (
                /* CASE NOT FOUND EMPTY STATE */
                <div className="px-4 py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
                    <FileX size={32} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900">Case Not Found</h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      No matching court judgments or citations were found in the database.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setSearchExecuted(false); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 active:scale-98"
                  >
                    <RefreshCw size={14} />
                    <span>Try Another Search</span>
                  </button>
                </div>
              ) : (
                /* RESULT LIST VIEW (LIST OF MATCHING JUDGMENT CARDS) */
                <div className="px-4 space-y-3 fast-render-list">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      RESULT LIST ({searchResults.length})
                    </span>
                  </div>

                  {searchResults.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      onClick={() => openJudgment(item)}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 space-y-2.5 active-press gpu-layer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md border border-blue-100">
                          {item.citation}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.decisionDate || item.year}
                        </span>
                      </div>

                      <h3 className="font-semibold text-xs text-slate-900 leading-snug">
                        {idx + 1}. {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed line-clamp-2">
                        {stripHtml(item.headnote || item.summary)}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-slate-500">
                        <span>🏛️ {item.court}</span>
                        <span className="text-blue-600 flex items-center gap-0.5">
                          Read Judgment <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

        </main>
      )}

      {/* CONTACT TAB VIEW */}
      {activeTab === 'contact' && (
        <main className="flex-1 px-4 py-4 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Help & Legal Support</span>
            <h1 className="text-lg font-bold text-slate-900">Contact Us</h1>
            <p className="text-xs text-slate-500 font-normal">We are here to assist with legal research queries & subscriptions.</p>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-start gap-3.5">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
                <Phone size={20} strokeWidth={2} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xs font-semibold text-slate-900">Phone Support</h3>
                <p className="text-xs font-bold text-blue-700">+91 98765 43210 / 044 2345 6789</p>
                <p className="text-[10px] text-slate-500 font-normal">Mon – Sat: 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-start gap-3.5">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
                <Mail size={20} strokeWidth={2} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xs font-semibold text-slate-900">Email Address</h3>
                <p className="text-xs font-bold text-blue-700">support@digilawreporter.com</p>
                <p className="text-[10px] text-slate-500 font-normal">Fast response within 2 hours</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-start gap-3.5">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xs font-semibold text-slate-900">Office Location</h3>
                <p className="text-xs font-medium text-slate-800">High Court Chambers Road, Legal Complex</p>
                <p className="text-[10px] text-slate-500 font-normal">Chennai, Tamil Nadu 600104</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-900">Find Us on Map</h3>
            <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200/90 shadow-xs relative">
              <iframe 
                title="Office Location Map"
                src="https://maps.google.com/maps?q=High%20Court%20Chennai&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                className="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </main>
      )}

      {/* FULL LOGIN PAGE MAIN SCREEN */}
      {activeTab === 'login' && (
        <main className="flex-1 px-4 py-8 space-y-5 animate-fadeIn max-w-sm mx-auto w-full">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-xs relative">
            <div className="text-center pt-1">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-2">
                <Scale size={28} strokeWidth={2} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Login</h1>
            </div>

            <form onSubmit={handleDirectLogin} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={loginName} 
                    onChange={e => setLoginName(e.target.value)} 
                    placeholder="Enter your name"
                    className="w-full py-3 pl-10 pr-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 shadow-2xs"
                    required
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Mobile Number</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={loginMobile} 
                    onChange={e => setLoginMobile(e.target.value)} 
                    placeholder="Enter 10-digit mobile number"
                    className="w-full py-3 pl-10 pr-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 shadow-2xs"
                    required
                  />
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.97] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>Login</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ELEGANT MOBILE SHARE SHEET MODAL */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Drag Bar Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                  <Share2 size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Share Legal Judgment</h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[210px]">
                    {selectedJudgment?.citation} • {selectedJudgment?.title}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-700 rounded-full p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* SOCIAL MEDIA SHARE CHANNELS GRID WITH OFFICIAL BRAND LOGOS */}
            <div className="grid grid-cols-4 gap-3 py-1">
              {/* WhatsApp Official Logo */}
              <button 
                onClick={() => handleShareOption('whatsapp')}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    {/* WhatsApp Green Speech Bubble */}
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.89 5.84L2 22l4.3-.92C7.88 22.25 9.87 22.9 12 22.9c5.52 0 10-4.48 10-10.9C22 6.48 17.52 2 12 2z" fill="#25D366" />
                    
                    {/* White Speech Bubble Outline */}
                    <path d="M12 3.5c-4.69 0-8.5 3.81-8.5 8.5 0 1.87.6 3.6 1.63 5.02l-.99 3.01 3.1-.81c1.37.8 2.97 1.28 4.76 1.28 4.69 0 8.5-3.81 8.5-8.5S16.69 3.5 12 3.5z" fill="#25D366" stroke="#FFFFFF" strokeWidth="1.2" />
                    
                    {/* White Phone Receiver Handset */}
                    <path d="M15.5 13.8c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1s-.5.7-.6.8c-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.7-1.1-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2 0-.3-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.2.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2-.1-.1-.2-.1-.4-.2z" fill="#FFFFFF" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-700">WhatsApp</span>
              </button>

              {/* Email / Gmail Official Logo */}
              <button 
                onClick={() => handleShareOption('email')}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-[#EA4335] text-white rounded-2xl flex items-center justify-center shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-700">Email</span>
              </button>

              {/* X / Twitter Official Logo */}
              <button 
                onClick={() => handleShareOption('twitter')}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/25 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-700">X (Twitter)</span>
              </button>

              {/* LinkedIn Official Logo */}
              <button 
                onClick={() => handleShareOption('linkedin')}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-[#0A66C2] text-white rounded-2xl flex items-center justify-center shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-700">LinkedIn</span>
              </button>
            </div>

            {/* QUICK COPY LINK & SUMMARY BUTTONS */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <button 
                onClick={() => handleShareOption('copylink')}
                className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Link2 size={16} className="text-blue-600" />
                  <span>Copy Judgment Direct Link</span>
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold transition-all ${
                  copyToast === 'link' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {copyToast === 'link' ? 'Copied! ✓' : 'Copy'}
                </span>
              </button>

              <button 
                onClick={() => handleShareOption('copysummary')}
                className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Copy size={16} className="text-blue-600" />
                  <span>Copy Full Headnote & Citation Summary</span>
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold transition-all ${
                  copyToast === 'summary' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {copyToast === 'summary' ? 'Copied! ✓' : 'Copy'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PROFILE TAB VIEW */}
      {activeTab === 'profile' && (
        <main className="flex-1 px-4 py-4 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">User Account</span>
            <h1 className="text-lg font-bold text-slate-900">My Profile</h1>
          </div>

          {/* Account Profile Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                  {userProfile && userProfile.name ? userProfile.name.substring(0, 2).toUpperCase() : <User size={20} />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{userProfile && userProfile.name ? userProfile.name : 'Legal Researcher'}</h2>
                  <p className="text-xs text-slate-500">{userProfile && userProfile.mobile ? userProfile.mobile : 'Active Access'}</p>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="bg-red-50 hover:bg-red-100 active:scale-98 text-red-600 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-red-200/80 transition-all shadow-2xs"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* DYNAMIC SAVED JUDGMENTS SECTION */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Saved Judgments ({savedCases.length})
              </h2>
            </div>

            {savedCases.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200/90 text-center space-y-2 shadow-xs">
                <Bookmark size={24} className="mx-auto text-slate-400" />
                <p className="text-xs text-slate-700 font-semibold">No saved judgments yet.</p>
                <p className="text-[10px] text-slate-400 font-normal leading-relaxed max-w-xs mx-auto">
                  Tap the bookmark icon on any judgment to save it to your profile for quick offline reading.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedCases.map(c => (
                  <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex items-center justify-between gap-3 active-press gpu-layer">
                    <div 
                      className="flex-1 space-y-1 cursor-pointer" 
                      onClick={() => openJudgment(c, savedCases)}
                    >
                      <span className="bg-blue-50 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded-md border border-blue-100/80">
                        {c.citation}
                      </span>
                      <h3 className="font-semibold text-xs text-slate-900 leading-snug line-clamp-1">{c.title}</h3>
                      <p className="text-[10px] text-slate-500">{c.court}</p>
                    </div>

                    <button 
                      onClick={() => toggleSaveCase(c)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove from Saved"
                    >
                      <BookmarkCheck size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* 3. FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-lg md:max-w-xl mx-auto bg-white border-t border-slate-200 py-2 px-6 flex items-center justify-between shadow-lg z-40 gpu-layer">
        <button 
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <Home size={19} strokeWidth={2} />
          <span>Home</span>
        </button>

        <button 
          onClick={() => handleTabClick('search')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all active:scale-95 ${
            activeTab === 'search' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <Search size={19} strokeWidth={2} />
          <span>Search</span>
        </button>

        <button 
          onClick={() => handleTabClick('contact')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all active:scale-95 ${
            activeTab === 'contact' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <Phone size={19} strokeWidth={2} />
          <span>Contact</span>
        </button>

        <button 
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all active:scale-95 ${
            activeTab === 'profile' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <User size={19} strokeWidth={2} />
          <span>Profile</span>
        </button>
      </nav>

    </div>
  );
}
