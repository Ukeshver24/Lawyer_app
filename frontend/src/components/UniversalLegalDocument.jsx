import React, { useMemo } from 'react';

/**
 * Universal DLR Legal Document Design System — Authentic Law Report Standard
 * Renders case precedents with authentic Indian Court typography (Times New Roman),
 * dedicated multi-citation references, clean justified paragraphs, and bordered tables.
 */
export default function UniversalLegalDocument({ 
  doc, 
  fontSize = 15, 
  searchQuery = '', 
  isHighlightingEnabled = true 
}) {
  if (!doc) return null;

  // 1. Data Normalization & Dynamic Extraction
  const rawTitle = doc.title || doc.case_name || doc.name || '';
  
  let petitioner = doc.petitioner_name || doc.petitioner || '';
  let respondent = doc.respondent_name || doc.respondent || '';

  if (!petitioner && !respondent && rawTitle) {
    const splitMatch = rawTitle.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i);
    if (splitMatch.length === 2) {
      petitioner = splitMatch[0].trim();
      respondent = splitMatch[1].trim();
    }
  }

  const court = doc.court_name || doc.court || doc.jurisdiction || '';
  const bench = doc.bench || doc.coram || doc.judges || doc.author || '';
  const caseNumber = doc.case_number || doc.caseNumber || doc.appeal_number || doc.petition_number || '';
  const jurisdiction = doc.jurisdiction_type || doc.jurisdictionType || '';

  // 2. Extract All Citations into a clean array
  const allCitations = useMemo(() => {
    let list = [];
    if (Array.isArray(doc.citations)) {
      list = doc.citations;
    } else if (typeof doc.citations === 'string') {
      try {
        const parsed = JSON.parse(doc.citations);
        if (Array.isArray(parsed)) list = parsed;
        else if (parsed) list = [parsed];
      } catch (e) {
        list = doc.citations.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    // Fallback: if empty, check doc.citation or doc.citations_string
    if (list.length === 0 && (doc.citation || doc.citations_string)) {
      const single = doc.citation || doc.citations_string;
      list = [single];
    }
    return list;
  }, [doc.citations, doc.citation, doc.citations_string]);

  // Formatter for individual citation entry
  const formatCitationItem = (cit) => {
    if (!cit) return '';
    if (typeof cit === 'string') return cit;
    const yr = cit.year || doc.year || '2026';
    const mo = cit.month ? `(${String(cit.month).padStart(2, '0')}) ` : '';
    const crt = cit.court ? `(${cit.court}) ` : '(SC) ';
    const num = cit.number ? `#${String(cit.number).replace(/^#+/, '')}` : '';
    let str = `${yr} ${mo}DLR ${crt}${num}`.replace(/\s+/g, ' ').trim();
    if (cit.equivalentText) {
      str += ` : ${cit.equivalentText}`;
    }
    return str;
  };

  const primaryCitation = allCitations.length > 0 ? formatCitationItem(allCitations[0]) : (doc.citation || `${doc.year || '2026'} DLR (${doc.court || 'SC'})`);

  // Format Decision Date
  let formattedDate = '';
  const rawDate = doc.judgment_date || doc.judgmentDate || doc.date || doc.decided_date;
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

  const documentType = (doc.document_type || doc.category || doc.type || 'JUDGMENT').toUpperCase();
  const headNote = doc.head_note || doc.headnote || doc.summary || doc.abstract || '';
  const fullContent = doc.content || doc.judgment_text || doc.judgmentText || doc.body || '';
  const orderContent = doc.order || doc.disposition || '';
  const authorJudge = doc.author || doc.judge || '';

  // Smart Check: Does fullContent already include the authentic court cause title & judgment title?
  const hasFullEmbeddedCourtLayout = useMemo(() => {
    if (!fullContent) return false;
    return /IN\s+THE\s+SUPREME\s+COURT|IN\s+THE\s+HIGH\s+COURT|CRIMINAL\s+APPELLATE|CIVIL\s+APPELLATE|—\s*VERSUS\s*—|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T/i.test(fullContent);
  }, [fullContent]);

  // Helper for highlighting keywords without breaking HTML
  const highlightText = (text) => {
    if (!text) return '';
    const strText = String(text);
    if (!isHighlightingEnabled || !searchQuery || !searchQuery.trim()) {
      return strText;
    }

    const query = searchQuery.trim();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    return strText.replace(regex, '<mark class="bg-yellow-300 text-slate-950 font-semibold px-0.5 rounded-xs">$1</mark>');
  };

  const renderFormattedBlock = (textString, customStyle = {}, isItalic = false) => {
    if (!textString) return null;
    const cleanStr = String(textString).trim()
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    const isHtml = /<[a-z][\s\S]*>/i.test(cleanStr);
    const baseClasses = `text-slate-950 font-serif leading-[1.85] text-justify tracking-normal ${isItalic ? 'italic' : 'not-italic'}`;

    if (isHtml) {
      return (
        <div 
          className={`court-html-content ${baseClasses} [&_p]:text-justify [&_p]:leading-[1.85] [&_p]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-400 [&_th]:p-3 [&_td]:border [&_td]:border-slate-300 [&_td]:p-3 [&_td]:align-top`}
          style={{ ...customStyle, fontFamily: "'Times New Roman', Times, Georgia, serif", textAlign: 'justify', textJustify: 'inter-word' }}
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
      <div className="space-y-4" style={{ ...customStyle, fontFamily: "'Times New Roman', Times, Georgia, serif", textAlign: 'justify', textJustify: 'inter-word' }}>
        {formattedParagraphs.map((para, idx) => (
          <p 
            key={idx} 
            className={`${baseClasses} text-justify`}
            style={{ ...customStyle, fontFamily: "'Times New Roman', Times, Georgia, serif", textAlign: 'justify', textJustify: 'inter-word', lineHeight: '1.85' }}
            dangerouslySetInnerHTML={{ __html: highlightText(para) }}
          />
        ))}
      </div>
    );
  };

  const textInlineStyle = {
    fontFamily: "'Times New Roman', Times, Georgia, serif",
    fontSize: `${fontSize}px`,
    lineHeight: '1.85'
  };

  return (
    <div 
      id="printable-judgment-document" 
      className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-xl p-8 sm:p-14 space-y-6 font-serif text-slate-900 pb-12 select-text rounded-sm print:p-0 print:m-0 print:border-none print:shadow-none print:pb-0"
      style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
    >
      {/* Force Authentic Court Typography, Text Justification & Comparison Table Styles */}
      <style>{`
        #printable-judgment-document {
          font-family: 'Times New Roman', Times, Georgia, serif !important;
        }
        #printable-judgment-document p,
        #printable-judgment-document li,
        #printable-judgment-document .court-html-content,
        #printable-judgment-document .court-html-content p {
          font-family: 'Times New Roman', Times, Georgia, serif !important;
          text-align: justify !important;
          text-justify: inter-word !important;
          line-height: 1.85 !important;
        }
        #printable-judgment-document table.dlr-extracted-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 20px 0 !important;
          font-family: 'Times New Roman', serif !important;
          border: 1.5px solid #334155 !important;
        }
        #printable-judgment-document table.dlr-extracted-table th {
          border: 1px solid #94a3b8 !important;
          padding: 10px 14px !important;
          background-color: #f1f5f9 !important;
          font-weight: bold !important;
          text-align: left !important;
        }
        #printable-judgment-document table.dlr-extracted-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 10px 14px !important;
          vertical-align: top !important;
          text-align: justify !important;
          line-height: 1.65 !important;
        }
      `}</style>
      
      {/* 1. TOP DLR LAW REPORT HEADER */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 text-xs select-none">
        <div className="font-bold tracking-wide text-slate-950 font-mono text-[13px]">
          {primaryCitation}
        </div>
        <div className="text-[11px] font-sans font-extrabold tracking-widest text-slate-600 uppercase">
          DIGI LAW REPORTER (DLR)
        </div>
      </div>

      {/* 2. COURT & JURISDICTION (Formal Law Report Precedent Header) */}
      {court && (
        <div className="text-center pt-2 space-y-1">
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-950 leading-snug">
            IN THE {court}
          </h1>
          {jurisdiction && (
            <div className="text-xs uppercase font-sans text-slate-600 tracking-wider">
              ( {jurisdiction} )
            </div>
          )}
        </div>
      )}

      {/* 3. PARTY NAMES (Petitioner vs. Respondent) */}
      {(petitioner || respondent || rawTitle) && (
        <div className="text-center py-3 my-1 space-y-2">
          {petitioner && respondent ? (
            <div className="space-y-1.5 max-w-xl mx-auto">
              <div className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
                {petitioner} <span className="font-normal text-xs text-slate-600 italic font-sans ml-1">. . . Appellant(s);</span>
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

      {/* 4. CASE NO. & DECIDED DATE LINE */}
      {(caseNumber || formattedDate) && (
        <div className="text-center text-xs font-serif text-slate-800 italic pt-0.5">
          {caseNumber && <span className="font-semibold">{caseNumber}</span>}
          {caseNumber && formattedDate && <span>, </span>}
          {formattedDate && <span>decided on {formattedDate}</span>}
        </div>
      )}

      {/* 5. BENCH / CORAM LINE */}
      {bench && (
        <div className="text-center text-xs text-slate-900 font-semibold pt-0.5">
          Before <span className="uppercase tracking-wide font-sans text-[11px]">{bench}</span>
        </div>
      )}

      {/* 6. DEDICATED CITATIONS SECTION (MANDATORY ALL CITATIONS DISPLAY) */}
      {allCitations.length > 0 && (
        <div className="my-4 p-3.5 sm:p-4 bg-slate-50 border border-slate-300 rounded-sm">
          <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200">
            <h2 className="text-[11px] font-bold font-sans tracking-widest text-[#0B1727] uppercase flex items-center gap-2">
              <span>CITATIONS</span>
            </h2>
            <span className="text-[10px] font-sans font-semibold text-slate-600 bg-slate-200/90 px-2 py-0.5 rounded-full">
              {allCitations.length} {allCitations.length === 1 ? 'Citation' : 'Citations'} Added
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allCitations.map((cit, idx) => (
              <div 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 shadow-2xs"
              >
                <span className="text-primary-700">{formatCitationItem(cit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ACT & SECTION REFERENCE LINE */}
      {(doc.act || doc.section) && (
        <div className="text-center text-xs font-serif text-slate-800 pt-1">
          {doc.act && <span className="font-bold text-slate-900">{doc.act}</span>}
          {doc.act && doc.section && <span className="text-slate-500 font-sans mx-1.5">—</span>}
          {doc.section && <span className="font-semibold text-slate-800">{doc.section}</span>}
        </div>
      )}

      <div className="border-t border-slate-900 my-4"></div>

      {/* 7. HEADNOTE SECTION (BOX CONTAINER FORMAT) */}
      {headNote && (
        <div className="my-6">
          <div className="border border-slate-300 rounded-sm p-5 bg-slate-50/70 shadow-xs space-y-2">
            <div className="text-xs font-bold font-sans uppercase tracking-widest text-slate-950 border-b border-slate-300 pb-2 mb-2">
              EDITORIAL HEADNOTE
            </div>
            <div className="text-slate-900 leading-relaxed text-justify">
              {renderFormattedBlock(headNote, textInlineStyle, false)}
            </div>
          </div>
        </div>
      )}

      {/* 8. JUDGMENT DELIVERY & BODY SECTION */}
      {fullContent && (
        <div className="space-y-4 pt-1">
          {!hasFullEmbeddedCourtLayout && (
            <>
              <div className="text-center text-sm font-bold uppercase tracking-widest text-slate-950 font-sans py-2">
                {documentType === 'ORDER' ? 'ORDER' : 'J U D G M E N T'}
              </div>

              {authorJudge && (
                <div className="text-xs text-slate-900 italic">
                  The Judgment of the Court was delivered by
                  <div className="font-bold uppercase tracking-wider not-italic text-slate-950 mt-0.5 font-sans text-xs">
                    {authorJudge}, J.—
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-1">
            {renderFormattedBlock(fullContent, textInlineStyle, false)}
          </div>
        </div>
      )}

      {/* 9. FINAL ORDER & DISPOSITION */}
      {orderContent && (
        <div className="space-y-2 pt-6 border-t border-slate-900">
          <div className="text-xs font-bold font-sans uppercase tracking-widest text-slate-950">
            ORDER
          </div>
          <div>
            {renderFormattedBlock(orderContent, textInlineStyle, false)}
          </div>
        </div>
      )}

    </div>
  );
}
