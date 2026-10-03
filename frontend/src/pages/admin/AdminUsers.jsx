import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch registered users strictly from backend API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const sessionId = localStorage.getItem('adminSessionId');

      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (sessionId) headers['x-admin-session-id'] = sessionId;

      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
      const data = await res.json();
      if ((data.status === 'success' || data.success) && Array.isArray(data.data)) {
        // Sort users by join order / ID descending (newly joined user at top S.NO 1)
        const sortedData = [...data.data].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

        const formatted = sortedData.map(u => {
          const rawJoinDate = u.created_at || u.joined_date;
          let joinedDateStr = '-';
          if (rawJoinDate) {
            const d = new Date(rawJoinDate);
            if (!isNaN(d.getTime())) {
              joinedDateStr = d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            }
          }

          return {
            id: u.id,
            name: u.name || '',
            mobile: u.mobile || '',
            joinedDate: joinedDateStr,
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: true
            }) : 'No login record',
            status: u.status || 'Active'
          };
        });
        setUsersList(formatted);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.error('Error fetching users from backend:', err);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = usersList.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mobile || '').includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-jakarta text-[#0B1727]">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-extrabold tracking-tight font-cinzel text-[#0B1727]">
          Users
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          Manage users accessing the legal research portal
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or mobile number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Loading user records from database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold text-xs">
                      No user records found in database.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1727] whitespace-nowrap">
                        {u.name}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {u.mobile}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">{u.joinedDate}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">{u.lastLogin}</td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
