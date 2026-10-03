import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Globe, Lock, Download, Printer, ExternalLink, 
  CheckCircle2, AlertTriangle, Loader2, FileText, Scale, Eye, Calendar
} from 'lucide-react';
import UniversalLegalDocument from '../../components/UniversalLegalDocument';
import { downloadCaseAsPDF, printCaseAsPDF } from '../../utils/pdfExporter';
import { API_BASE_URL } from '../../config/api';

export default function AdminCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBackendCase = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/cases/${id}`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.success && data.data) {
          setCaseData(data.data);
        } else {
          // Fallback search via public endpoint
          const searchRes = await fetch(`${API_BASE_URL}/public/cases/search?q=${encodeURIComponent(id)}`);
          const searchData = await searchRes.json();
          if (isMounted && searchData.success && Array.isArray(searchData.data) && searchData.data.length > 0) {
            const matched = searchData.data.find(c => String(c.id) === String(id)) || searchData.data[0];
            setCaseData(matched);
          } else if (isMounted) {
            setError(data.message || 'Case precedent record not found in backend database.');
          }
        }
      } catch (err) {
        console.error('Error fetching case detail:', err);
        if (isMounted) {
          setError('Failed to connect to backend database server.');
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

  // Toggle Publish / Unpublish directly via status API
  const handleTogglePublish = async () => {
    if (!caseData || statusUpdating) return;
    const nextStatus = caseData.status === 'Published' ? 'Draft' : 'Published';
    setStatusUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseData.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (result.success) {
        setCaseData(prev => ({ ...prev, status: nextStatus }));
        showToast(`Case status updated to "${nextStatus}"`);
      } else {
        showToast(result.message || 'Failed to update case status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!caseData) return;
    downloadCaseAsPDF(caseData, 'printable-judgment-document', showToast);
  };

  const handlePrintPDF = () => {
    if (!caseData) return;
    printCaseAsPDF(caseData, 'printable-judgment-document', showToast);
  };

  if (loading) {
    return (
      <div className="w-full flex-1 py-24 flex flex-col items-center justify-center space-y-4 font-jakarta">
        <Loader2 size={40} className="text-[#0B1727] animate-spin" />
        <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">
          Loading case precedent from database...
        </p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-6 font-jakarta">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Case Record Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || `No case record matching ID "${id}" exists in the backend database.`}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#0B1727] hover:bg-slate-800 px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to All Cases
        </button>
      </div>
    );
  }

  const isPublished = caseData.status === 'Published';
  const caseNumber = caseData.case_number || caseData.caseNumber || '';
  const decidedDate = caseData.judgment_date 
    ? new Date(caseData.judgment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : (caseData.judgmentDate || '');

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 font-jakarta">
      
      {/* 1. Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Cases</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium truncate max-w-[220px]">
            {caseData.court || 'Supreme Court of India'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-slate-700">
            Case #{caseData.id}
          </span>
        </div>

        {/* Right: Public User View Shortcut */}
        <a
          href={`/judgment/${caseData.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto px-2.5 py-1 rounded-lg hover:bg-blue-50 cursor-pointer"
          title="Open Public User View in New Tab"
        >
          <span>Public User View</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* 2. Formal Executive Action Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Case Status & Identifiers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${
            isPublished 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>{caseData.status || 'Draft'}</span>
          </span>

          {/* Case Number Badge */}
          {caseNumber && (
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/90 px-3 py-1 rounded-lg border border-slate-200/80 truncate max-w-xs sm:max-w-md" title={caseNumber}>
              {caseNumber}
            </span>
          )}

          {/* Decided Date */}
          {decidedDate && (
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>Decided: <strong className="text-slate-700 font-semibold">{decidedDate}</strong></span>
            </span>
          )}
        </div>

        {/* Right: Perfectly Aligned Action Buttons Group */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          
          {/* Toggle Publish / Unpublish */}
          <button
            type="button"
            disabled={statusUpdating}
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
              isPublished
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200/90'
            }`}
            title={isPublished ? 'Unpublish case back to drafts' : 'Publish case to live public portal'}
          >
            {statusUpdating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPublished ? (
              <Lock size={14} className="text-amber-700" />
            ) : (
              <Globe size={14} className="text-emerald-700" />
            )}
            <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
          </button>

          {/* Edit Case */}
          <Link
            to={`/admin/cases/edit/${caseData.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Edit Precedent Record"
          >
            <Edit3 size={14} className="text-slate-600" />
            <span>Edit Case</span>
          </Link>

          {/* Download Official PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1727] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Download Official PDF Document"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          {/* Print Official Document */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Print Official Document"
          >
            <Printer size={16} />
          </button>

        </div>

      </div>

      {/* 3. Authentic DLR Law Report Legal Document (Centered Paper Canvas) */}
      <div className="w-full flex justify-center py-2">
        <UniversalLegalDocument doc={caseData} />
      </div>

      {/* 4. Uploaded Court Documents (if attached) */}
      {caseData.documents && Array.isArray(caseData.documents) && caseData.documents.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 max-w-4xl mx-auto w-full">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-[#0B1727]" />
            <span>Attached Court Documents</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {caseData.documents.map((doc, idx) => (
              <div key={doc.id || idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 truncate">
                  <FileText size={18} className="text-primary-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{doc.name || `Document #${idx + 1}`}</p>
                    {doc.size && <span className="text-[10px] text-slate-400 font-medium">{doc.size}</span>}
                  </div>
                </div>
                {doc.url && (
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={15} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
