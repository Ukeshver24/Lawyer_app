import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock, Trash2, X, AlertTriangle, CheckCircle2, Eye, EyeOff, Key } from 'lucide-react';

const INITIAL_MOCK_ADMINS = [
  { id: '1', name: 'Main Admin', username: 'mainadmin', role: 'MAIN_ADMIN', password: 'mainpassword123' }
];

export default function AdminManagement() {
  const navigate = useNavigate();

  // Get logged-in role (defaults to MAIN_ADMIN for demonstration)
  const currentRole = localStorage.getItem('adminRole') || 'MAIN_ADMIN';

  // Persisted Admins List State
  const [adminsList, setAdminsList] = useState(() => {
    try {
      const saved = localStorage.getItem('digi_mock_admins');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(a => a.username !== 'johnadmin' && a.username !== 'kumaradmin');
        return filtered.length > 0 ? filtered : INITIAL_MOCK_ADMINS;
      }
      return INITIAL_MOCK_ADMINS;
    } catch (e) {
      return INITIAL_MOCK_ADMINS;
    }
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState(null);
  
  // View / Edit Password Modal State
  const [adminToEditPassword, setAdminToEditPassword] = useState(null);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showAddAdminPassword, setShowAddAdminPassword] = useState(false);

  // Add Form State (ONLY Name, Username, Password)
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    username: '',
    password: ''
  });

  const [toastMessage, setToastMessage] = useState('');

  // Access Security Check: Redirect EXTRA_ADMIN to /admin/dashboard
  // Load admins list from backend REST API
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/admins');
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          setAdminsList(data.data);
          localStorage.setItem('digi_mock_admins', JSON.stringify(data.data));
          return;
        }
      } catch (err) {
        console.warn("Backend offline for admins list, using local state");
      }
    };
    if (currentRole === 'MAIN_ADMIN') {
      fetchAdmins();
    }
  }, [currentRole]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveAdmins = (updated) => {
    setAdminsList(updated);
    try {
      localStorage.setItem('digi_mock_admins', JSON.stringify(updated));
    } catch (e) {}
  };

  // Handle Add Admin Form Submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!newAdminData.name.trim() || !newAdminData.username.trim() || !newAdminData.password.trim()) {
      showToast("Please fill out all fields.");
      return;
    }

    const usernameExists = adminsList.some(
      a => (a.username || '').toLowerCase() === newAdminData.username.trim().toLowerCase()
    );
    if (usernameExists) {
      showToast("This username already exists.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminData.name.trim(),
          username: newAdminData.username.trim().toLowerCase(),
          password: newAdminData.password.trim(),
          role: 'EXTRA_ADMIN'
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        const updatedList = [...adminsList, data.data];
        handleSaveAdmins(updatedList);
        setNewAdminData({ name: '', username: '', password: '' });
        setIsAddModalOpen(false);
        showToast(`Created extra administrator "${data.data.name}"`);
        return;
      }
    } catch (err) {
      console.warn("Backend offline for createAdmin, saving locally");
    }

    const createdAdmin = {
      id: Date.now().toString(),
      name: newAdminData.name.trim(),
      username: newAdminData.username.trim().toLowerCase(),
      password: newAdminData.password.trim(),
      role: 'EXTRA_ADMIN'
    };

    const updatedList = [...adminsList, createdAdmin];
    handleSaveAdmins(updatedList);

    setNewAdminData({ name: '', username: '', password: '' });
    setIsAddModalOpen(false);
    showToast(`Created extra administrator "${createdAdmin.name}"`);
  };

  // Open Edit Credentials Modal
  const handleOpenEditPassword = (admin) => {
    setAdminToEditPassword(admin);
    setEditedUsername(admin.username || '');
    setEditedPassword(admin.password || 'password123');
    setShowPasswordText(false);
  };

  // Save Username & Password Changes
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!adminToEditPassword) return;

    if (!editedUsername.trim() || !editedPassword.trim()) {
      showToast("Username and Password cannot be empty.");
      return;
    }

    const cleanUsername = editedUsername.trim().toLowerCase();

    try {
      await fetch(`http://localhost:5000/api/admin/admins/${adminToEditPassword.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: editedPassword.trim() })
      });
    } catch (err) {
      console.warn("Backend offline for updateAdminCredentials");
    }

    const updatedList = adminsList.map(a => {
      if (String(a.id) === String(adminToEditPassword.id)) {
        return { ...a, username: cleanUsername, password: editedPassword.trim() };
      }
      return a;
    });

    handleSaveAdmins(updatedList);
    showToast(`Updated credentials for "${adminToEditPassword.name}"`);
    setAdminToEditPassword(null);
  };

  // Handle Remove Admin Action
  const handleConfirmRemove = async () => {
    if (!adminToRemove) return;
    if (adminToRemove.role === 'MAIN_ADMIN') return;

    try {
      await fetch(`http://localhost:5000/api/admin/admins/${adminToRemove.id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Backend offline for deleteAdmin");
    }

    const updatedList = adminsList.filter(a => String(a.id) !== String(adminToRemove.id));
    handleSaveAdmins(updatedList);
    showToast(`Removed administrator "${adminToRemove.name}"`);
    setAdminToRemove(null);
  };

  if (currentRole !== 'MAIN_ADMIN') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
          <Lock size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only Main Administrator accounts can access the Manage Admins panel.
        </p>
        <div className="pt-2">
          <button 
            onClick={() => {
              localStorage.setItem('adminRole', 'MAIN_ADMIN');
              window.location.reload();
            }} 
            className="px-4 py-2 bg-[#0B1727] hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Switch to Main Admin Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-jakarta text-[#0B1727]">
      
      {/* ========================================================================= */}
      {/* 1. PAGE TITLE & TOP-RIGHT [+ ADD ADMIN] BUTTON */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-cinzel text-[#0B1727]">
            Manage Admins
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Manage administrator accounts and access privileges
          </p>
        </div>

        {/* Top-Right Add Admin Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#0B1727] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>+ Add Admin</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADMINS TABLE (Clean, Simple, Professional with Password View/Edit) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5 w-16 text-center">S.No</th>
                <th className="py-3.5 px-5">Admin Name</th>
                <th className="py-3.5 px-5">Username</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {adminsList.map((admin, idx) => {
                const isMainAdmin = admin.role === 'MAIN_ADMIN' || idx === 0;

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* S.No */}
                    <td className="py-4 px-5 text-center font-bold text-slate-500 text-xs">
                      {idx + 1}
                    </td>

                    {/* Admin Name */}
                    <td className="py-4 px-5 font-bold text-[#0B1727]">
                      <div className="flex items-center gap-2">
                        <span>{admin.name}</span>
                        {isMainAdmin && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200">
                            MAIN ADMIN
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-4 px-5 font-mono text-slate-600 font-medium">
                      {admin.username}
                    </td>

                    {/* Action Column */}
                    <td className="py-4 px-5 text-right whitespace-nowrap font-bold text-xs">
                      {isMainAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditPassword(admin)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 px-2.5 py-1 rounded transition-colors cursor-pointer"
                            title="View / Edit Password"
                          >
                            <Key size={13} className="text-slate-600" />
                            <span>Edit Password</span>
                          </button>

                          <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100/70 border border-slate-200">
                            <Lock size={12} className="text-slate-500" />
                            <span>Protected</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {/* View & Edit Password Button */}
                          <button
                            onClick={() => handleOpenEditPassword(admin)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2.5 py-1 rounded transition-colors cursor-pointer"
                            title="View and Edit Password"
                          >
                            <Key size={13} />
                            <span>Edit Password</span>
                          </button>

                          {/* Remove Button */}
                          <button
                            onClick={() => setAdminToRemove(admin)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded transition-colors cursor-pointer"
                            title="Remove Extra Admin"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ADD ADMIN MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B1727]">Add Admin</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  placeholder="e.g. John Admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newAdminData.username}
                  onChange={(e) => setNewAdminData({ ...newAdminData, username: e.target.value })}
                  placeholder="e.g. johnadmin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showAddAdminPassword ? "text" : "password"}
                    required
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                    placeholder="Enter admin password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-10 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddAdminPassword(!showAddAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
                    title={showAddAdminPassword ? "Hide password text" : "Reveal password text"}
                  >
                    {showAddAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B1727] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                >
                  Create Admin
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIEW & EDIT PASSWORD MODAL */}
      {/* ========================================================================= */}
      {adminToEditPassword && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Key className="text-blue-600" size={18} />
                <h3 className="text-base font-bold text-[#0B1727]">Edit Username & Password</h3>
              </div>
              <button 
                onClick={() => setAdminToEditPassword(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-0.5">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Account Holder</div>
                <div className="text-xs font-bold text-[#0B1727]">{adminToEditPassword.name}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={editedPassword}
                    onChange={(e) => setEditedPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
                    title={showPasswordText ? "Hide password text" : "Reveal password text"}
                  >
                    {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdminToEditPassword(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B1727] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REMOVE ADMIN CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {adminToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle size={18} />
              <h3 className="text-base font-bold text-slate-900">Remove this admin?</h3>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Are you sure you want to remove this administrator (<strong className="text-slate-900 font-bold">{adminToRemove.name}</strong>)?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdminToRemove(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                Remove
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1727] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}