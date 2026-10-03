import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit3, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AdminPublishedCases() {
  const navigate = useNavigate();
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalCase, setDeleteModalCase] = useState(null);

  const fetchPublishedCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases?status=Published`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const formatted = data.data.map(c => ({
          id: c.id,
          caseNumber: c.case_number || '',
          title: c.title || '',
          citation: (() => {
            const cits = Array.isArray(c.citations) ? c.citations : [];
            if (cits.length === 0) return c.case_number || '—';
            const first = cits[0];
            const yr = first.year || c.year || '2026';
            const mo = first.month ? `(${String(first.month).padStart(2, '0')}) ` : '';
            const crt = first.court ? `(${first.court}) ` : '(SC) ';
            const num = first.number ? `#${String(first.number).replace(/^#+/, '')}` : '';
            let s = `${yr} ${mo}DLR ${crt}${num}`.replace(/\s+/g, ' ').trim();
            if (cits.length > 1) {
              s += ` (+${cits.length - 1})`;
            }
            return s;
          })(),
          year: c.year || '',
          judgmentDate: c.judgment_date ? new Date(c.judgment_date).toISOString().split('T')[0] : ''
        }));
        setCasesList(formatted);
      } else {
        setCasesList([]);
      }
    } catch (err) {
      console.error('Error fetching published cases:', err);
      setCasesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedCases();
  }, []);

  const handleUnpublishCase = async (caseId) => {
    try {
      await fetch(`${API_BASE_URL}/cases/${caseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Draft' })
      });
      setCasesList(prev => prev.filter(c => c.id !== caseId));
    } catch (err) {
      console.error('Error unpublishing case:', err);
    }
  };

  const handleDeleteCase = async () => {
    if (deleteModalCase) {
      try {
        await fetch(`${API_BASE_URL}/cases/${deleteModalCase.id}`, { method: 'DELETE' });
        setCasesList(prev => prev.filter(c => c.id !== deleteModalCase.id));
      } catch (err) {
        console.error('Error deleting published case:', err);
      } finally {
        setDeleteModalCase(null);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-jakarta text-[#0B1727]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-cinzel text-[#0B1727]">
            Published Cases
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Live precedent cases accessible to legal portal subscribers
          </p>
        </div>

        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded text-xs font-bold shrink-0">
          {casesList.length} Live Published Precedents
        </span>
      </div>

      {/* Modern Legal Precedent Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium text-xs">
            Loading published cases from database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-48">Case Number</th>
                  <th className="py-3 px-4 w-64">Case Title</th>
                  <th className="py-3 px-4 w-40">Citation</th>
                  <th className="py-3 px-4 w-32">Judgment Date</th>
                  <th className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {casesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-slate-400 font-medium text-xs">
                      No live published cases in database.
                    </td>
                  </tr>
                ) : (
                  casesList.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800 truncate" title={c.caseNumber || ''}>
                        {c.caseNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0B1727] text-xs truncate" title={c.title || ''}>
                        {c.title}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-primary-700 text-xs truncate" title={c.citation || ''}>
                        {c.citation || 'Unassigned'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {c.judgmentDate || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUnpublishCase(c.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Lock size={13} />
                            <span>Unpublish</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/cases/${c.id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="View Case in Admin"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/cases/edit/${c.id}`)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Case"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalCase(c)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Case"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-base font-extrabold text-slate-900">Delete Published Case</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete published case <strong className="text-slate-900">{deleteModalCase.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Delete Case
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
