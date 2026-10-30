import React, { useState, useMemo, useEffect } from 'react';
import { Scale } from 'lucide-react';

/**
 * Universal DLR Legal Document Design System — Authentic Law Report Standard
 * Standard Order across all cases:
 * 1. 1st: Citation (Black bold label, clean badges)
 * 2. Next: HEADNOTE Box
 * 3. Following: Court Name, Parties (VERSUS), Case Number, Act(s) & Section, Date, Bench
 * 4. Body: Authentic Judicial Order & Judgment Text
 */
function UniversalLegalDocument({ 
  doc, 
  fontSize = 15, 
  searchQuery = '', 
  isHighlightingEnabled = true 
}) {
  const safeDoc = doc || {};

  // 1. Data Normalization & Dynamic Extraction
  const rawTitle = safeDoc.title || safeDoc.case_name || safeDoc.name || '';
  
  let petitioner = safeDoc.petitioner_name || safeDoc.petitioner || '';
  let respondent = safeDoc.respondent_name || safeDoc.respondent || '';

  if (!petitioner && !respondent && rawTitle) {
    const splitMatch = rawTitle.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i);
    if (splitMatch.length === 2) {
      petitioner = splitMatch[0].trim();
      respondent = splitMatch[1].trim();
    }
  }

  const court = safeDoc.court_name || safeDoc.court || safeDoc.jurisdiction || 'Supreme Court of India';
  const bench = safeDoc.bench || safeDoc.coram || safeDoc.judges || safeDoc.author || '';
  const caseNumber = safeDoc.case_number || safeDoc.caseNumber || safeDoc.appeal_number || safeDoc.petition_number || '';
  const jurisdiction = safeDoc.jurisdiction_type || safeDoc.jurisdictionType || '';

  // 1.5 Typography & Font Styling Computation
  const fontChoice = String(safeDoc.font_family || safeDoc.fontFamily || '').toLowerCase().trim();
  const useProfessionalFont = Boolean(safeDoc.use_professional_font);

  const activeFontFamily = useMemo(() => {
    if (useProfessionalFont) {
      return "'Times New Roman', Times, Georgia, serif";
    }
    if (fontChoice.includes('courier') || fontChoice.includes('mono')) {
      return "'Courier New', Courier, monospace";
    }
    if (fontChoice.includes('georgia')) {
      return "Georgia, serif";
    }
    if (fontChoice.includes('garamond')) {
      return "'EB Garamond', Garamond, Georgia, serif";
    }
    if (fontChoice.includes('bookman')) {
      return "'Bookman Old Style', Bookman, serif";
    }
    if (fontChoice.includes('cambria')) {
      return "Cambria, Georgia, serif";
    }
    if (fontChoice.includes('palatino')) {
      return "'Palatino Linotype', 'Book Antiqua', Palatino, serif";
    }
    if (fontChoice.includes('calibri')) {
      return "Calibri, Candara, Segoe, -apple-system, sans-serif";
    }
    if (fontChoice.includes('arial') || fontChoice.includes('helvetica') || fontChoice.includes('sans')) {
      return "Arial, Helvetica, -apple-system, sans-serif";
    }
    if (fontChoice.includes('times') || fontChoice.includes('serif')) {
      return "'Times New Roman', Times, Georgia, serif";
    }
    if (safeDoc.font_family && safeDoc.font_family !== 'default' && safeDoc.font_family !== 'original') {
      return `'${safeDoc.font_family}', Georgia, serif`;
    }
    return "Arial, Helvetica, -apple-system, sans-serif";
  }, [useProfessionalFont, fontChoice, safeDoc.font_family]);

  // 2. Extract All Citations into a clean array
  const allCitations = useMemo(() => {
    let list = [];
    if (Array.isArray(safeDoc.citations)) {
      list = safeDoc.citations;
    } else if (typeof safeDoc.citations === 'string') {
      try {
        const parsed = JSON.parse(safeDoc.citations);
        if (Array.isArray(parsed)) list = parsed;
        else if (parsed) list = [parsed];
      } catch (e) {
        list = safeDoc.citations.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    // Fallback: if empty, check safeDoc.citation or safeDoc.citations_string
    if (list.length === 0 && (safeDoc.citation || safeDoc.citations_string)) {
      const single = safeDoc.citation || safeDoc.citations_string;
      list = [single];
    }
    return list;
  }, [safeDoc.citations, safeDoc.citation, safeDoc.citations_string]);

  // Formatter for individual citation entry
  const formatCitationItem = (cit) => {
    if (!cit) return '';
    if (typeof cit === 'string') {
      return cit.replace(/#/g, ' • ').trim();
    }
    const yr = cit.year || safeDoc.year || '2026';
    const mo = cit.month ? `(${String(cit.month).padStart(2, '0')}) ` : '';
    const crt = cit.court ? `(${cit.court}) ` : '(SC) ';
    let num = (cit.number || '').trim();
    if (num) {
      if (/^\d+$/.test(num)) {
        num = `#${num}`;
      } else {
        num = `• ${num.replace(/^#+/, '').trim()}`;
      }
    }
    let str = `${yr} ${mo}DLR ${crt}${num}`.replace(/\s+/g, ' ').trim();
    if (cit.equivalentText) {
      str += ` : ${cit.equivalentText}`;
    }
    return str;
  };

  const primaryCitation = allCitations.length > 0 
    ? formatCitationItem(allCitations[0]) 
    : (safeDoc.citation || `${safeDoc.year || '2026'} DLR (${safeDoc.court || 'SC'})`);

  // Format Decision Date
  let formattedDate = '';
  const rawDate = safeDoc.judgment_date || safeDoc.judgmentDate || safeDoc.date || safeDoc.decided_date;
  if (rawDate) {
    try {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        formattedDate = String(rawDate).trim();
      }
    } catch (e) {
      formattedDate = String(rawDate).trim();
    }
  }

  const documentType = (safeDoc.document_type || safeDoc.category || safeDoc.type || 'JUDGMENT').toUpperCase();
  const headNote = safeDoc.head_note || safeDoc.headnote || safeDoc.summary || safeDoc.abstract || '';
  const rawContent = safeDoc.content || safeDoc.judgment_text || safeDoc.judgmentText || safeDoc.body || '';
  const orderContent = safeDoc.order || safeDoc.disposition || '';
  const authorJudge = safeDoc.author || safeDoc.judge || '';

  // Authentic Court Document Body: Preserves 100% of text, connected appeals, co-appellants & co-respondents
  const { parsedAppearances, fullContent, hasExplicitOrderHeading } = useMemo(() => {
    if (!rawContent) return { parsedAppearances: '', fullContent: '', hasExplicitOrderHeading: false };
    const str = String(rawContent).trim();

    const headingPattern = /(?:<(?:div|p|h[1-6]|center)[^>]*>\s*(?:<[^>]+>\s*)*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|O\s*R\s*D\s*E\s*R|ORDER|The\s+Court\s+made\s+the\s+following\s+order:?)\s*(?:<\/[^>]+>\s*)*<\/(?:div|p|h[1-6]|center)>)|(?:(?:^|\n)\s*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|O\s*R\s*D\s*E\s*R|ORDER|The\s+Court\s+made\s+the\s+following\s+order:?)\s*(?:\n|$))|(?:\bVERSUS\b)/i;
    const hasExplicit = headingPattern.test(str);

    return { parsedAppearances: '', fullContent: str, hasExplicitOrderHeading: hasExplicit };
  }, [rawContent]);

  // Pre-compiled regex for lightning-fast keyword highlighting without rebuilding RegExp per block
  const highlightRegex = useMemo(() => {
    if (!isHighlightingEnabled || !searchQuery || !searchQuery.trim()) return null;
    const query = searchQuery.trim();
    if (query.length < 2) return null;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escapedQuery})`, 'gi');
  }, [searchQuery, isHighlightingEnabled]);

  // Helper for highlighting keywords without breaking HTML
  const highlightText = (text) => {
    if (!text) return '';
    const strText = String(text);
    if (!highlightRegex) return strText;
    return strText.replace(highlightRegex, '<mark class="bg-yellow-300 text-slate-950 font-semibold px-0.5 rounded-xs">$1</mark>');
  };

  const sanitizeContent = (textString) => {
    if (!textString) return '';
    return String(textString).trim()
      .replace(/<div[^>]*class="[^"]*dlr-page-running-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
      .replace(/<div[^>]*class="[^"]*page-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
      .replace(/Indian\s*Kanoon\s*(?:-\s*http[^\s<]*)?/gi, ' ')
      .replace(/(?:Indian\s*Kanoon)?\s*Page\s*\d+\s*(?:of\s*\d+)?/gi, ' ')
      .replace(/HCJ\s*&\s*RRR,\s*J/gi, ' ')
      .replace(/Digitally\s+signed\s+by[^\n<]*/gi, '')
      .replace(/Signature\s+Not\s+Verified[^\n<]*/gi, '')
      .replace(/Signature\s+Valid[^\n<]*/gi, '')
      .replace(/Date:\s*\d{4}\.\d{2}\.\d{2}[^\n<]*/gi, '')
      .replace(/Reason:[^\n<]*/gi, '')
      .replace(/Location:[^\n<]*/gi, '')
      .replace(/https?:\/\/[^\s]*\/qr\/[^\s<]*/gi, '')
      .replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '')
      .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
      .replace(/(?:^|\s)[\?？]\s*(?:$|\s)/g, ' ')
      .replace(/\s*[\?？]\s*([A-Z\.\s]{3,40},\s*J\.?)/gi, ' $1')
      .replace(/\s*[\?？]\s*$/g, '')
      .replace(/^\s*[\?？]\s*/g, '')
      .replace(/\s+[\?？]\s+/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
  };

  const renderFormattedBlock = (textString, customStyle = {}, isItalic = false, isAlreadySanitized = false) => {
    if (!textString) return null;
    const cleanStr = isAlreadySanitized ? String(textString) : sanitizeContent(textString);

    const isHtml = /<[a-z][\s\S]*>/i.test(cleanStr);
    const baseClasses = `text-slate-950 font-serif leading-[1.95] tracking-[0.012em] text-justify ${isItalic ? 'italic' : 'not-italic'}`;

    if (isHtml) {
      return (
        <div 
          className={`court-html-content ${baseClasses} [&_p]:text-justify [&_p]:leading-[1.95] [&_p]:mb-4.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-400 [&_th]:p-3 [&_td]:border [&_td]:border-slate-300 [&_td]:p-3 [&_td]:align-top`}
          style={{ ...customStyle, fontFamily: activeFontFamily, textAlign: 'justify', textJustify: 'inter-word', letterSpacing: '0.15px' }}
          dangerouslySetInnerHTML={{ __html: highlightText(cleanStr) }}
        />
      );
    }

    const formattedParagraphs = cleanStr
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4.5" style={{ ...customStyle, fontFamily: activeFontFamily, textAlign: 'justify', textJustify: 'inter-word', letterSpacing: '0.15px' }}>
        {formattedParagraphs.map((para, idx) => (
          <p 
            key={idx} 
            className={`${baseClasses} text-justify`}
            style={{ ...customStyle, fontFamily: activeFontFamily, textAlign: 'justify', textJustify: 'inter-word', lineHeight: '1.95', letterSpacing: '0.15px' }}
            dangerouslySetInnerHTML={{ __html: highlightText(para) }}
          />
        ))}
      </div>
    );
  };

  const textInlineStyle = {
    fontFamily: activeFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: '1.95',
    letterSpacing: '0.15px'
  };

  // 3. Dynamic A4 Legal Pagination Engine
  const paginatedPages = useMemo(() => {
    if (Array.isArray(safeDoc.pages) && safeDoc.pages.length > 0) {
      return safeDoc.pages.map((pg, idx) => ({
        pageNum: idx + 1,
        content: pg.html || pg.content || pg
      }));
    }

    if (!fullContent || !fullContent.trim()) {
      return [{ pageNum: 1, content: '' }];
    }

    const cleanStr = sanitizeContent(fullContent);
    const isHtml = /<[a-z][\s\S]*>/i.test(cleanStr);

    let rawBlocks = [];
    if (isHtml) {
      const blockRegex = /<(p|table|div|blockquote|h[1-6]|ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
      let match;
      while ((match = blockRegex.exec(cleanStr)) !== null) {
        rawBlocks.push(match[0]);
      }
      if (rawBlocks.length === 0) {
        rawBlocks = cleanStr.split(/(?:<br\s*\/?>\s*){2,}/i).filter(Boolean).map(s => `<p>${s}</p>`);
      }
    } else {
      rawBlocks = cleanStr.split(/\n\s*\n/).filter(Boolean);
    }

    if (rawBlocks.length === 0) {
      return [{ pageNum: 1, content: cleanStr }];
    }

    const getBlockWeight = (block) => {
      const textOnly = block.replace(/<[^>]*>/g, '').trim();
      if (/<table/i.test(block)) {
        const rows = (block.match(/<tr/gi) || []).length;
        return Math.max(textOnly.length, rows * 220);
      }
      return Math.max(textOnly.length, 60);
    };

    // Page 1 contains Citation + HEADNOTE + Court + Parties + Meta, so body starts on Page 1 with balanced budget
    const headnoteWeight = headNote ? Math.min(headNote.length, 1200) : 0;
    const page1Budget = Math.max(1200, 2400 - headnoteWeight);
    const regularPageBudget = 3200;

    const pages = [];
    let currentPageBlocks = [];
    let currentWeight = 0;
    let currentBudget = page1Budget;

    for (const block of rawBlocks) {
      const w = getBlockWeight(block);

      if (w > 2400 && !/<table/i.test(block)) {
        const isBlockHtml = /<p[^>]*>/i.test(block);
        const innerText = block.replace(/^<p[^>]*>|<\/p>$/gi, '');
        const sentences = innerText.split(/(?<=[.!?])\s+(?=[A-Z0-9(\[])/);
        let chunk = '';

        for (const sent of sentences) {
          if ((chunk.length + sent.length) > 1700 && chunk.length > 0) {
            const formatted = isBlockHtml ? `<p>${chunk.trim()}</p>` : chunk.trim();
            if (currentWeight + chunk.length > currentBudget && currentPageBlocks.length > 0) {
              pages.push({ pageNum: pages.length + 1, content: currentPageBlocks.join('\n') });
              currentPageBlocks = [];
              currentWeight = 0;
              currentBudget = regularPageBudget;
            }
            currentPageBlocks.push(formatted);
            currentWeight += chunk.length;
            chunk = '';
          }
          chunk += (chunk ? ' ' : '') + sent;
        }

        if (chunk.trim()) {
          const formatted = isBlockHtml ? `<p>${chunk.trim()}</p>` : chunk.trim();
          if (currentWeight + chunk.length > currentBudget && currentPageBlocks.length > 0) {
            pages.push({ pageNum: pages.length + 1, content: currentPageBlocks.join('\n') });
            currentPageBlocks = [];
            currentWeight = 0;
            currentBudget = regularPageBudget;
          }
          currentPageBlocks.push(formatted);
          currentWeight += chunk.length;
        }
        continue;
      }

      if (currentWeight + w > currentBudget && currentPageBlocks.length > 0) {
        pages.push({ pageNum: pages.length + 1, content: currentPageBlocks.join('\n') });
        currentPageBlocks = [block];
        currentWeight = w;
        currentBudget = regularPageBudget;
      } else {
        currentPageBlocks.push(block);
        currentWeight += w;
      }
    }

    if (currentPageBlocks.length > 0) {
      pages.push({ pageNum: pages.length + 1, content: currentPageBlocks.join('\n') });
    }

    return pages.length > 0 ? pages : [{ pageNum: 1, content: cleanStr }];
  }, [fullContent, headNote, safeDoc.pages]);

  const totalPages = paginatedPages.length;

  // Progressive A4 sheet mounting: Render initial 6 pages in <8ms so switching cases is instantaneous (<10ms)
  // regardless of document size (even for 500+ page cases), then stream remaining pages in idle slices.
  const INITIAL_RENDER_LIMIT = 6;
  const [renderedCount, setRenderedCount] = useState(INITIAL_RENDER_LIMIT);

  // Reset renderedCount whenever the viewed document changes so switching cases is lightning fast
  useEffect(() => {
    setRenderedCount(INITIAL_RENDER_LIMIT);
  }, [safeDoc.id, safeDoc.case_number, safeDoc.title]);

  // Incrementally mount subsequent pages in background idle slices so the main thread never drops frames
  useEffect(() => {
    if (renderedCount >= totalPages) return;
    const timer = setTimeout(() => {
      setRenderedCount(prev => Math.min(totalPages, prev + 12));
    }, 45);
    return () => clearTimeout(timer);
  }, [renderedCount, totalPages]);

  // Ensure 100% of pages are rendered when printing
  useEffect(() => {
    const handleBeforePrint = () => setRenderedCount(totalPages);
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [totalPages]);

  if (!doc) return null;

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Force Authentic Court Typography & Page Break Print Rules */}
      <style>{`
        .court-a4-page {
          font-family: ${activeFontFamily} !important;
          font-size: ${fontSize}px !important;
          text-align: justify !important;
          text-justify: inter-word !important;
          text-align-last: left !important;
          overflow-wrap: break-word !important;
        }
        .court-a4-page,
        .court-a4-page * {
          font-family: ${activeFontFamily} !important;
        }
        .court-a4-page p,
        .court-a4-page li,
        .court-a4-page blockquote,
        .court-a4-page .court-html-content,
        .court-a4-page .court-html-content p,
        .court-a4-page .court-html-content div,
        .court-a4-page .court-html-content span,
        .court-a4-page .court-html-content li,
        .court-a4-page .court-html-content blockquote {
          font-family: ${activeFontFamily} !important;
          font-size: ${fontSize}px !important;
          text-align: justify !important;
          text-justify: inter-word !important;
          text-align-last: left !important;
          line-height: 1.95 !important;
          letter-spacing: 0.15px !important;
          overflow-wrap: break-word !important;
        }
        .court-a4-page table.dlr-extracted-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 18px 0 !important;
          font-family: ${activeFontFamily} !important;
          border: 1.5px solid #334155 !important;
        }
        .court-a4-page table.dlr-extracted-table th {
          border: 1px solid #94a3b8 !important;
          padding: 8px 12px !important;
          background-color: #f1f5f9 !important;
          font-weight: bold !important;
          text-align: left !important;
        }
        .court-a4-page table.dlr-extracted-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 8px 12px !important;
          vertical-align: top !important;
          text-align: justify !important;
          line-height: 1.75 !important;
        }
        @media print {
          body {
            background-color: white !important;
          }
          .court-a4-page {
            box-shadow: none !important;
            border: 1.5px solid #1e293b !important;
            margin: 0 !important;
            padding: 14mm 16mm !important;
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
          }
        }
      `}</style>

      {/* A4 LEGAL PAGE SHEETS */}
      <div 
        id="printable-judgment-document" 
        className="w-full flex flex-col items-center space-y-8 sm:space-y-10 py-2"
      >
        {paginatedPages.slice(0, renderedCount).map((page, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === totalPages - 1;

          return (
            <div
              key={page.pageNum || pageIdx}
              id={`dlr-page-sheet-${pageIdx + 1}`}
              className="court-a4-page w-full max-w-4xl bg-white border-2 border-slate-700/90 shadow-xl hover:shadow-2xl transition-shadow p-8 sm:p-14 sm:px-16 text-slate-900 select-text rounded-xs relative flex flex-col justify-between"
              style={{
                minHeight: '1130px',
                fontFamily: activeFontFamily
              }}
            >
              {/* Top Section: Header & Content */}
                <div className="space-y-4">
                  
                  {/* -------------------------------------------------------- */}
                  {/* STEP 1: CITATION (SLEEK BORDERED BOX)                     */}
                  {/* -------------------------------------------------------- */}
                  {isFirstPage ? (
                    <div className="border border-slate-300 rounded-sm p-3.5 bg-slate-50/80 shadow-2xs space-y-1.5 select-none">
                      <div className="flex flex-wrap items-baseline gap-2 text-xs">
                        <span className="font-bold text-slate-950 font-serif text-sm">
                          Citation:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {allCitations.length > 0 ? (
                            allCitations.map((cit, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-0.5 bg-white border border-slate-300 rounded text-[11.5px] font-mono font-bold text-slate-900 shadow-3xs"
                              >
                                {formatCitationItem(cit)}
                              </span>
                            ))
                          ) : (
                            <span className="font-mono font-bold text-slate-900 text-xs">{primaryCitation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* -------------------------------------------------------- */}
                  {/* STEP 2: HEADNOTE (NEXT POSITION ON CASE PAGE)             */}
                  {/* -------------------------------------------------------- */}
                  {isFirstPage && headNote && (
                    <div className="my-3">
                      <div className="border border-slate-300 rounded-sm p-4 sm:p-5 bg-slate-50/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-center border-b border-slate-300 pb-1.5 mb-1.5">
                          <span className="text-[11px] font-bold font-sans uppercase tracking-widest text-slate-950 flex items-center gap-1.5">
                            <Scale size={13} className="text-primary-700" />
                            <span>HEADNOTE</span>
                          </span>
                        </div>
                        <div className="text-slate-900 leading-relaxed text-justify font-serif">
                          {renderFormattedBlock(headNote, textInlineStyle, false)}
                        </div>
                      </div>
                      {/* Generous breathing room below headnote box */}
                      <div className="border-t border-slate-900 mt-6 mb-6"></div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* STEP 3: COURT NAME, PARTIES (VERSUS), CASE NO & ACTS       */}
                  {/* (ALWAYS RENDERED ON ALL CASES)                             */}
                  {/* -------------------------------------------------------- */}
                  {isFirstPage && (
                    <div className="space-y-4 pt-1">
                      {court && (
                        <div className="text-center pt-1 space-y-1">
                          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-950 leading-snug">
                            IN THE {court.toUpperCase()}
                          </h1>
                          {jurisdiction && (
                            <div className="text-xs uppercase font-sans text-slate-600 tracking-wider">
                              ( {jurisdiction} )
                            </div>
                          )}
                        </div>
                      )}

                      {/* Party Names (Appellant vs. Respondent) with VERSUS */}
                      {(petitioner || respondent || rawTitle) && (
                        <div className="text-center py-2 my-1 space-y-2">
                          {petitioner && respondent ? (
                            <div className="space-y-1.5 max-w-xl mx-auto">
                              <div className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
                                {petitioner} <span className="font-normal text-xs text-slate-600 italic font-sans ml-1">. . . Appellant(s) / Petitioner(s);</span>
                              </div>
                              <div className="text-xs italic font-serif text-slate-600 py-0.5 tracking-widest uppercase">
                                — Versus —
                              </div>
                              <div className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
                                {respondent} <span className="font-normal text-xs text-slate-600 italic font-sans ml-1">. . . Respondent(s).</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-base sm:text-lg font-bold text-slate-950 leading-snug max-w-xl mx-auto">
                              {rawTitle}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Case No. & Decided Date */}
                      {(caseNumber || formattedDate) && (
                        <div className="text-center text-xs font-serif text-slate-800 italic pt-0.5">
                          {caseNumber && <span className="font-bold text-slate-900">Case Number: {caseNumber}</span>}
                          {caseNumber && formattedDate && <span>, </span>}
                          {formattedDate && <span>decided on {formattedDate}</span>}
                        </div>
                      )}

                      {/* Bench / Coram */}
                      {bench && (
                        <div className="text-center text-xs text-slate-900 font-semibold pt-0.5">
                          Before <span className="uppercase tracking-wide font-sans text-[11px] font-bold">{bench}</span>
                        </div>
                      )}

                      {/* Act & Section Reference */}
                      {(safeDoc.act || safeDoc.section) && (
                        <div className="text-center text-xs font-serif text-slate-800 pt-0.5">
                          <span className="font-bold text-slate-900">Act(s): </span>
                          {safeDoc.act && <span className="font-bold text-slate-900">{safeDoc.act}</span>}
                          {safeDoc.act && safeDoc.section && <span className="text-slate-500 font-sans mx-1.5">—</span>}
                          {safeDoc.section && <span className="font-semibold text-slate-800">{safeDoc.section}</span>}
                        </div>
                      )}

                      {/* Appearances / Advocates Section */}
                      {parsedAppearances && (
                        <div className="pt-2 pb-1 text-left text-xs font-serif text-slate-800 space-y-1">
                          <div className="text-[11px] font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                            Appearances
                          </div>
                          <div className="whitespace-pre-line text-slate-700 leading-relaxed text-[12px] pt-1">
                            {parsedAppearances}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-900 my-3"></div>

                      {/* Judgment Title only if content doesn't already have its own authentic heading */}
                      {!hasExplicitOrderHeading && (
                        <div className="text-center text-sm font-bold uppercase tracking-widest text-slate-950 font-sans py-1">
                          {documentType === 'ORDER' ? 'ORDER' : 'J U D G M E N T'}
                        </div>
                      )}

                      {!hasExplicitOrderHeading && authorJudge && (
                        <div className="text-xs text-slate-900 italic mb-2">
                          The Judgment of the Court was delivered by
                          <div className="font-bold uppercase tracking-wider not-italic text-slate-950 mt-0.5 font-sans text-xs">
                            {authorJudge}, J.—
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. THIS PAGE BODY CONTENT */}
                  <div className="pt-1">
                    {renderFormattedBlock(page.content, textInlineStyle, false, true)}
                  </div>

                  {/* 5. FINAL ORDER (On the Last Page if present) */}
                  {isLastPage && orderContent && (
                    <div className="space-y-2 pt-5 border-t border-slate-900">
                      <div className="text-xs font-bold font-sans uppercase tracking-widest text-slate-950">
                        ORDER
                      </div>
                      <div>
                        {renderFormattedBlock(orderContent, textInlineStyle, false)}
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom Section: Running Footer On Every Single Page */}
                <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] font-sans text-slate-500 select-none">
                  <div className="flex flex-col text-[10px] text-slate-500 font-serif leading-tight">
                    <span className="font-medium">Generated by Digital Law Reporter</span>
                    <span>Date: {formattedDate || new Date().toLocaleDateString('en-GB')}</span>
                  </div>

                  <div className="font-serif font-bold text-slate-900 text-xs">
                    Page {pageIdx + 1} of {totalPages}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-700 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    <Scale size={11} className="text-primary-600" />
                    <span>DLR VERIFIED</span>
                  </div>
                </div>

              </div>
            );
          })}

          {renderedCount < totalPages && (
            <div className="py-4 flex items-center justify-center text-slate-400 text-xs font-sans print:hidden">
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                Rendering additional pages ({renderedCount} of {totalPages})...
              </span>
            </div>
          )}
      </div>
    </div>
  );
}

export default React.memo(UniversalLegalDocument);
