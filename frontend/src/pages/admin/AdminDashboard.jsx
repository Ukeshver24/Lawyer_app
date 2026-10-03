import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Eye, Edit3, Scale, Clock, Activity, FileText, Users, Bookmark, X } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

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

// Helper to safely parse citations array or JSON string
const parseCitationsList = (c) => {
  if (Array.isArray(c.citations)) return c.citations;
  if (typeof c.citations === 'string') {
    try {
      const parsed = JSON.parse(c.citations);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (e) {}
  }
  return [];
};

// Formatter for clean citation presentation (avoid empty brackets)
const formatCitationDisplay = (cit) => {
  if (!cit) return '';
  if (typeof cit === 'string') return cit;
  const yr = cit.year ? `${cit.year} ` : '';
  const mo = cit.month ? `(${cit.month}) ` : '';
  const crt = cit.court ? `(${cit.court}) ` : '';
  const rawNum = cit.number ? String(cit.number).trim() : '';
  const num = rawNum ? (rawNum.startsWith('#') || rawNum.startsWith('(') ? rawNum : `#${rawNum}`) : '';
  const eq = cit.equivalentText ? ` : ${cit.equivalentText}` : '';
  return `${yr}${mo}DLR ${crt}${num}${eq}`.replace(/\s+/g, ' ').trim();
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const casesRes = await fetch(`${API_BASE_URL}/cases`);
        const casesData = await casesRes.json();

        if (casesData.success && Array.isArray(casesData.data)) {
          setAllCases(casesData.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Available Years: strictly extract unique years entered in citations in the database (Zero duplicates, no auto-generated extras)
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    allCases.forEach(c => {
      const cits = parseCitationsList(c);
      cits.forEach(cit => {
        if (cit && cit.year) {
          const y = String(cit.year).trim();
          if (y && /^\d{4}$/.test(y)) yearSet.add(y);
        }
      });
      // Fallback: if no citations in case, check c.year
      if (cits.length === 0 && c.year) {
        const y = String(c.year).trim();
        if (y && /^\d{4}$/.test(y)) yearSet.add(y);
      }
    });

    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [allCases]);

  // Filter cases and compute exact matching citations count for the selected year and month
  const { filteredCases, totalMatchingCitations } = useMemo(() => {
    let citCount = 0;

    const matched = allCases.filter(c => {
      const cits = parseCitationsList(c);

      // If case has citations, check if any citation matches the filter
      if (cits.length > 0) {
        let caseHasMatch = false;
        cits.forEach(cit => {
          const citYear = String(cit.year || c.year || '').trim();
          let citMonth = '';
          if (cit.month) {
            citMonth = String(cit.month).replace(/\D/g, '').padStart(2, '0');
          } else if (c.judgment_date) {
            const dateStr = String(c.judgment_date);
            if (dateStr.includes('-')) {
              citMonth = dateStr.split('-')[1].padStart(2, '0');
            } else {
              const d = new Date(c.judgment_date);
              if (!isNaN(d.getTime())) citMonth = String(d.getMonth() + 1).padStart(2, '0');
            }
          }

          const matchYr = !selectedYear || citYear === String(selectedYear);
          const matchMo = !selectedMonth || citMonth === String(selectedMonth).padStart(2, '0');

          if (matchYr && matchMo) {
            caseHasMatch = true;
            citCount += 1;
          }
        });
        return caseHasMatch;
      }

      // If case has no citations, fallback to case year & judgment date
      let caseYear = '';
      if (c.year) {
        caseYear = String(c.year).trim();
      } else if (c.judgment_date) {
        const d = new Date(c.judgment_date);
        if (!isNaN(d.getTime())) caseYear = String(d.getFullYear());
      }

      let caseMonth = '';
      if (c.judgment_date) {
        const dateStr = String(c.judgment_date);
        if (dateStr.includes('-')) {
          caseMonth = dateStr.split('-')[1].padStart(2, '0');
        } else {
          const d = new Date(c.judgment_date);
          if (!isNaN(d.getTime())) caseMonth = String(d.getMonth() + 1).padStart(2, '0');
        }
      }

      const matchYr = !selectedYear || caseYear === String(selectedYear);
      const matchMo = !selectedMonth || caseMonth === String(selectedMonth).padStart(2, '0');

      return matchYr && matchMo;
    });

    return {
      filteredCases: matched,
      totalMatchingCitations: citCount
    };
  }, [allCases, selectedYear, selectedMonth]);

  // Compute dynamic stats from filteredCases and totalMatchingCitations
  const stats = useMemo(() => {
    const total = filteredCases.length;
    const published = filteredCases.filter(c => (c.status || 'Published') === 'Published').length;
    const draft = filteredCases.filter(c => c.status === 'Draft').length;

    return {
      totalCases: total,
      totalCitations: totalMatchingCitations,
      publishedCases: published,
      draftCases: draft
    };
  }, [filteredCases, totalMatchingCitations]);

  // Compute dynamic recent cases list from filteredCases
  const recentCases = useMemo(() => {
    return filteredCases.slice(0, 10).map(c => {
      const cits = parseCitationsList(c);
      let citationDisplay = '';

      if (cits.length > 0) {
        // Pick citation matching active filter if available
        const matchingCit = cits.find(cit => {
          const citYear = String(cit.year || c.year || '').trim();
          let citMonth = '';
          if (cit.month) citMonth = String(cit.month).replace(/\D/g, '').padStart(2, '0');
          const matchYr = !selectedYear || citYear === String(selectedYear);
          const matchMo = !selectedMonth || citMonth === String(selectedMonth).padStart(2, '0');
          return matchYr && matchMo;
        }) || cits[0];

        citationDisplay = formatCitationDisplay(matchingCit);
        if (cits.length > 1) {
          citationDisplay += ` (+${cits.length - 1} more)`;
        }
      } else {
        citationDisplay = c.case_number || 'N/A';
      }

      return {
        id: c.id,
        caseNumber: c.case_number || '',
        title: c.title || '',
        court: c.court || c.court_name || 'Supreme Court of India',
        judgmentDate: c.judgment_date ? new Date(c.judgment_date).toISOString().split('T')[0] : '',
        status: c.status || 'Published',
        citation: citationDisplay
      };
    });
  }, [filteredCases, selectedYear, selectedMonth]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-jakarta text-[#0B1727]">
      
      {/* 1. Heading & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-cinzel text-[#0B1727]">
            DASHBOARD
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Legal case research portal overview
          </p>
        </div>

        {/* Year and Month Dropdown Filters with Active Badge and Reset Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(selectedYear || selectedMonth) && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs animate-in fade-in">
              <span>
                {stats.totalCitations} {stats.totalCitations === 1 ? 'Citation' : 'Citations'}
                {selectedYear ? ` in ${selectedYear}` : ''}
                {selectedMonth ? ` (${MONTHS_LIST.find(m => m.value === selectedMonth)?.label})` : ''}
              </span>
              <button
                onClick={() => { setSelectedYear(''); setSelectedMonth(''); }}
                className="hover:text-rose-600 text-slate-400 p-0.5 rounded transition-colors cursor-pointer"
                title="Clear Filters"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Year Dropdown (Strictly from Citations in Database) */}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer shadow-2xs"
          >
            <option value="">Year ({availableYears.length})</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-600 cursor-pointer shadow-2xs"
          >
            <option value="">Month</option>
            {MONTHS_LIST.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Editorial Statistics Banner (Neat Responsive Grid: Total Cases, Citations Added, Published, Draft, Add Button) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          
          {/* Total Cases */}
          <div className="space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Scale size={16} className="text-primary-600" />
              <span>Total Cases</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1727] font-cinzel">{stats.totalCases}</span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedYear || selectedMonth ? 'Matching filter' : 'All case records'}
              </span>
            </div>
          </div>

          {/* Citations Added */}
          <div className="space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Bookmark size={16} className="text-blue-600" />
              <span>Citations Added</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-cinzel">{stats.totalCitations}</span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedYear || selectedMonth ? 'In selected period' : 'Total citations'}
              </span>
            </div>
          </div>

          {/* Published Cases */}
          <div className="space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Activity size={16} className="text-emerald-600" />
              <span>Published</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1727] font-cinzel">{stats.publishedCases}</span>
              <span className="text-xs text-slate-400 font-medium">Available to users</span>
            </div>
          </div>

          {/* Draft Cases & Add New Case Button */}
          <div className="flex items-center justify-between sm:justify-start lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <FileText size={16} className="text-amber-600" />
                <span>Draft</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-[#0B1727] font-cinzel">{stats.draftCases}</span>
                <span className="text-xs text-slate-400 font-medium">Awaiting publication</span>
              </div>
            </div>

            <Link
              to="/admin/cases/add"
              className="px-4 py-2.5 bg-[#0B1727] hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95"
            >
              <Plus size={15} />
              <span>Add Case</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 3. Recent Cases Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0B1727]">
              Recent Legal Precedent Activity
            </h2>
            {(selectedYear || selectedMonth) && (
              <p className="text-xs font-semibold text-blue-700 mt-0.5">
                Showing cases matching {selectedYear ? `Year ${selectedYear}` : ''}{selectedYear && selectedMonth ? ' • ' : ''}{selectedMonth ? `Month ${MONTHS_LIST.find(m => m.value === selectedMonth)?.label}` : ''} ({stats.totalCitations} {stats.totalCitations === 1 ? 'citation' : 'citations'} found)
              </p>
            )}
          </div>
          <Link
            to="/admin/cases"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            <span>View All Cases</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Loading recent precedent activity...
          </div>
        ) : recentCases.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            {selectedYear || selectedMonth
              ? `No precedent citations recorded for ${selectedYear || ''} ${selectedMonth ? MONTHS_LIST.find(m => m.value === selectedMonth)?.label : ''}. Try another filter.`
              : 'No precedent activity recorded yet. Click "+ Add Case" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4 w-64">Case Details</th>
                  <th className="py-3 px-4 w-44">Citation</th>
                  <th className="py-3 px-4 w-40">Court</th>
                  <th className="py-3 px-4 w-28">Date</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentCases.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 truncate" title={c.title || ''}>
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 truncate" title={c.citation || ''}>
                      {c.citation}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate" title={c.court || ''}>
                      {c.court}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {c.judgmentDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/cases/${c.id}`}
                          className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="View Case in Admin"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/admin/cases/edit/${c.id}`}
                          className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                          title="Edit Case"
                        >
                          <Edit3 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
