import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Users, 
  Key, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  UserPlus,
  Trash2,
  Mail,
  X
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { UserRole } from '../types/dorm';
import { demeritLabel } from '../utils/checkViolations';

export const AdminManagementView: React.FC = () => {
  const { users, currentUser, updateUserRole, addAdminUser, removeAdminUser, isSuperAdmin } = useDorm();
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.roomNumber && u.roomNumber.includes(searchTerm))
  );

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const res = updateUserRole(userId, newRole);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) return;

    const res = addAdminUser({
      name: newAdminName.trim(),
      email: newAdminEmail.trim(),
      phone: newAdminPhone.trim(),
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleRemoveAdmin = (userId: string, userName: string) => {
    if (confirm(`Revoke admin privileges and remove staff account for "${userName}"?`)) {
      const res = removeAdminUser(userId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-lg font-bold text-white">Admin Staff & Role-Based Access Control (RBAC)</h2>
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Dean Authority
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Register your <strong>actual Assistant Deans, Proctors, and Staff emails</strong> so they can log in and manage dorm policies with Admin permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="min-h-touch bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Admin Email</span>
            </button>
          )}

          <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border ${
            isSuperAdmin 
              ? 'bg-purple-950/60 border-purple-600/40 text-purple-300' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Shield className="w-3.5 h-3.5" />
            <span>{isSuperAdmin ? 'Dean Active' : 'Read Only'}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-600 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-stretch">
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm mb-1.5">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Dean (Institutional Head)</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 h-5 truncate">
              Primary Dean: <strong className="text-white">orapajelmar@gmail.com</strong>
            </p>
            <ul className="text-slate-400 space-y-1.5 text-[11px] list-disc list-inside">
              <li>Authorize & invite Assistant Deans</li>
              <li>Full write authority on all dorm policies</li>
              <li>Official roster management & discipline resolution</li>
            </ul>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 text-[10px] text-purple-400 font-mono font-semibold">
            AUTHORITY: FULL DEAN POWERS
          </div>
        </div>

        <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-2 text-blue-300 font-bold text-sm mb-1.5">
              <Key className="w-4 h-4 flex-shrink-0" />
              <span>Admin (Assistant Dean)</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 h-5 truncate">
              Registered operational staff & proctors
            </p>
            <ul className="text-slate-400 space-y-1.5 text-[11px] list-disc list-inside">
              <li>Save & score room inspections and cleanliness</li>
              <li>Record worship attendance & curfew arrivals</li>
              <li>Manage phone vault deposits & the daily cleaning rotation</li>
            </ul>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 text-[10px] text-blue-400 font-mono font-semibold">
            AUTHORITY: OPERATIONAL WRITE ACCESS
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm mb-1.5">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>Occupant (Resident Student)</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 h-5 truncate">
              Assigned dorm occupants & students
            </p>
            <ul className="text-slate-400 space-y-1.5 text-[11px] list-disc list-inside">
              <li>Strictly View-Only access to personal standing</li>
              <li>Inspect room scores & cleaning duty days</li>
              <li>Review medical slips & weekend leave status</li>
            </ul>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 text-[10px] text-emerald-400 font-mono font-semibold">
            AUTHORITY: PERSONAL READ-ONLY
          </div>
        </div>
      </div>

      {/* User Directory & RBAC Assignment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm">System Users & Administrative Permissions</h3>
            <p className="text-xs text-slate-400">Manage administrator emails and resident roles</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 min-h-touch text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="lg:hidden divide-y divide-slate-800/70">
          {filtered.map(user => {
            const isThisSuperAdmin = user.role === 'superadmin' || user.email.toLowerCase() === 'orapajelmar@gmail.com';
            const isCustomAdmin = user.role === 'admin';

            return (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    user.role === 'superadmin' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                    user.role === 'admin' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}>
                    {user.role === 'superadmin' ? 'DEAN' : user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {user.roomNumber ? `Room ${user.roomNumber}` : 'Faculty / Staff'} ·{' '}
                  <span className={`font-bold ${user.demerits > 5 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {demeritLabel(user.demerits)}
                  </span>
                </p>
                <div className="mt-2">
                  {isThisSuperAdmin ? (
                    <span className="text-xs text-purple-400 font-medium">Dean Jelmar Orapa</span>
                  ) : isSuperAdmin ? (
                    <div className="flex items-center gap-2">
                      {user.role === 'occupant' ? (
                        <button
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          className="flex-1 min-h-touch bg-blue-600 hover:bg-blue-500 text-white px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Promote to Admin</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user.id, 'occupant')}
                          className="flex-1 min-h-touch bg-slate-800 hover:bg-slate-700 text-rose-300 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 border border-slate-700"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Demote to Occupant</span>
                        </button>
                      )}

                      {isCustomAdmin && (
                        <button
                          onClick={() => handleRemoveAdmin(user.id, user.name)}
                          className="min-h-touch min-w-touch bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition-colors flex items-center justify-center"
                          title="Delete Admin Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Protected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Room / Staff</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5">Demerits</th>
                <th className="p-3.5">RBAC Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(user => {
                const isThisSuperAdmin = user.role === 'superadmin' || user.email.toLowerCase() === 'orapajelmar@gmail.com';
                const isCustomAdmin = user.role === 'admin';

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="p-3.5">
                      {user.roomNumber ? `Room ${user.roomNumber}` : <span className="text-amber-400 font-medium">Faculty / Staff</span>}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        user.role === 'superadmin' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                        user.role === 'admin' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}>
                        {user.role === 'superadmin' ? 'DEAN' : user.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${user.demerits > 5 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {demeritLabel(user.demerits)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {isThisSuperAdmin ? (
                        <span className="text-xs text-purple-400 font-medium">Dean Jelmar Orapa</span>
                      ) : isSuperAdmin ? (
                        <div className="flex items-center space-x-2">
                          {user.role === 'occupant' ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Promote to Admin</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user.id, 'occupant')}
                              className="bg-slate-800 hover:bg-slate-700 text-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Demote to Occupant</span>
                            </button>
                          )}

                          {isCustomAdmin && (
                            <button
                              onClick={() => handleRemoveAdmin(user.id, user.name)}
                              className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 p-1.5 rounded-lg text-xs transition-colors"
                              title="Delete Admin Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddAdminModal && (
        <Modal onClose={() => setShowAddAdminModal(false)} padding="p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Register New Administrator Email</h3>
                <p className="text-xs text-slate-400">Grant administrative write privileges</p>
              </div>
              <button onClick={() => setShowAddAdminModal(false)} className="min-h-touch min-w-touch flex items-center justify-center text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Staff / Assistant Dean Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro. Carlos Mendez"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-touch text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Admin Google / Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. assistant.dean@gmail.com"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-touch text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  When this person signs in using Google OAuth with this email, they will automatically receive Admin write-access.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0917-555-4321"
                  value={newAdminPhone}
                  onChange={e => setNewAdminPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-touch text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="min-h-touch px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-touch px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Register Admin
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
