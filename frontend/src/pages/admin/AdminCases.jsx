import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, AlertTriangle, Eye, Edit3, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

// Generates 227 years from 2026 down to 1800
const YEARS_LIST = Array.from({ length: 2026 - 1800 + 1 }, (_, i) => 2026 - i);

// 12 Months
const MONTHS_LIST = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

export default function AdminCases() {
  const navigate = useNavigate();
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalCase, setDeleteModalCase] = useState(null);

  const itemsPerPage = 8;

  // Extract unique courts dynamically from database case records
  const availableCourts = useMemo(() => {
    const courts = casesList
      .map(c => (c.court || c.court_name || '').trim())
      .filter(Boolean);
    return Array.from(new Set(courts)).sort();
  }, [casesList]);

  // Fetch Cases from Backend API
  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases`);
      const data = await res.json();
      if (data.success) {
        // Map database fields to UI format
        const formatted = data.data.map(c => ({
          id: c.id,
          caseNumber: c.case_number || '',
          title: c.title || '',
          petitioner: c.petitioner || '',
          respondent: c.respondent || '',
          court: c.court || c.court_name || 'Supreme Court of India',
          judgmentDate: c.judgment_date ? new Date(c.judgment_date).toISOString().split('T')[0] : '',
          year: c.year || '',
          status: c.status || 'Published',
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
          citations: Array.isArray(c.citations) ? c.citations : []
        }));
        setCasesList(formatted);
      }
    } catch (err) {
      console.error('Error fetching cases from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = casesList.filter(c => {
    const matchesSearch = 
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.citation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.petitioner || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    const matchesYear = (() => {
      if (!selectedYear) return true;
      let caseYear = '';
      if (c.year) {
        caseYear = String(c.year);
      } else if (c.judgmentDate) {
        const d = new Date(c.judgmentDate);
        if (!isNaN(d.getTime())) caseYear = String(d.getFullYear());
      }
      return caseYear === String(selectedYear);
    })();
    
    const matchesMonth = (() => {
      if (!selectedMonth) return true;
      if (!c.judgmentDate) return false;
      const dateStr = String(c.judgmentDate);
      const monthPart = dateStr.includes('-') 
        ? dateStr.split('-')[1].padStart(2, '0')
        : String(new Date(dateStr).getMonth() + 1).padStart(2, '0');

      return monthPart === selectedMonth;
    })();

    const matchesCourt = !selectedCourt || c.court === selectedCourt;

    return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesCourt;
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteCase = async () => {
    if (deleteModalCase) {
      try {
        await fetch(`${API_BASE_URL}/cases/${deleteModalCase.id}`, { method: 'DELETE' });
        // Permanently filter out deleted case
        setCasesList(prev => prev.filter(c => c.id !== deleteModalCase.id));
      } catch (err) {
        console.error('Error permanently deleting case:', err);
      } finally {
        setDeleteModalCase(null);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-jakarta text-[#0B1727]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-cinzel text-[#0B1727]">
            Case Records
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Manage, publish, and review legal case judgments
          </p>
        </div>

        <Link
          to="/admin/cases/add"
          className="px-4 py-2.5 bg-[#0B1727] hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          <Plus size={16} />
          <span>Add New Case</span>
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-4">
        
        {/* Top Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case title, case number, citation, petitioner name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600 transition-colors"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Filters Dropdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer"
          >
            <option value="">All Years</option>
            {YEARS_LIST.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer"
          >
            <option value="">All Months</option>
            {MONTHS_LIST.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Court Filter */}
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer"
          >
            <option value="">All Courts</option>
            {availableCourts.map((courtName) => (
              <option key={courtName} value={courtName}>{courtName}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-medium text-xs">
            Loading case records from database...
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
                  <th className="py-3 px-4 w-44">Court</th>
                  <th className="py-3 px-4 w-28">Date</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-14 text-center text-slate-400 font-medium text-xs">
                      No case records found in database. Click "+ Add New Case" to create your first precedent.
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800 truncate" title={c.caseNumber || ''}>
                        {c.caseNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0B1727] text-xs truncate" title={c.title || ''}>
                        {c.title}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-primary-700 text-xs truncate" title={c.citation || ''}>
                        {c.citation || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 text-xs truncate" title={c.court || 'Supreme Court of India'}>
                        {c.court || 'Supreme Court of India'}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-500 text-xs whitespace-nowrap">
                        {c.judgmentDate || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'Published' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/cases/${c.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Case in Admin"
                          >
                            <Eye size={15} />
                          </Link>

                          <Link
                            to={`/admin/cases/edit/${c.id}`}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit Case"
                          >
                            <Edit3 size={15} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteModalCase(c)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
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

        {/* Pagination Footer */}
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
            <div>
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> of <span className="font-bold text-slate-900">{filteredCases.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 font-bold transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              <span>Page {currentPage} of {totalPages}</span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 font-bold transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-base font-extrabold text-slate-900">Delete Case Record</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete <strong className="text-slate-900">{deleteModalCase.title}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteCase}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
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
