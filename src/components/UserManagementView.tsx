import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Lock,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types.js';

interface UserManagementViewProps {
  currentUser: UserAccount;
  authToken: string;
  onUserUpdated?: (updated: UserAccount) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  authToken,
  onUserUpdated,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Self password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  // Add user modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('manager');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('manager');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Admin Reset User Password modal state
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [adminAssignedPassword, setAdminAssignedPassword] = useState('');
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // General banner notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle current user password change
  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    if (!currentPassword) {
      setPwErrorMsg('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New password and confirmation do not match.');
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwErrorMsg(data.error || 'Failed to update password.');
      } else {
        setPwSuccessMsg('Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwErrorMsg(err.message || 'Error updating password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    if (!newUsername.trim() || !newEmail.trim() || !newUserPassword) {
      setAddUserError('All fields are required.');
      return;
    }

    if (newUserPassword.length < 6) {
      setAddUserError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingNewUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim() || newUsername.trim(),
          email: newEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.error || 'Failed to create user account.');
      } else {
        showNotice('success', `User "${data.username}" created successfully.`);
        setIsAddModalOpen(false);
        setNewUsername('');
        setNewName('');
        setNewEmail('');
        setNewUserPassword('');
        setNewUserRole('manager');
        await fetchUsers();
      }
    } catch (err: any) {
      setAddUserError(err.message || 'Error creating user.');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Save edit user
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update user.');
      } else {
        showNotice('success', `User "${data.username}" updated.`);
        setEditingUser(null);
        if (data.id === currentUser.id && onUserUpdated) {
          onUserUpdated(data);
        }
        await fetchUsers();
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating user.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Admin Reset User Password
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);

    if (adminAssignedPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    setIsResettingPw(true);
    try {
      const res = await fetch(`/api/users/${resetTargetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          newPassword: adminAssignedPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Failed to reset password.');
      } else {
        showNotice('success', `Password for "${resetTargetUser.username}" was reset successfully.`);
        setResetTargetUser(null);
        setAdminAssignedPassword('');
      }
    } catch (err: any) {
      setResetError(err.message || 'Error resetting password.');
    } finally {
      setIsResettingPw(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete user.');
      } else {
        showNotice('success', `User "${user.username}" deleted.`);
        await fetchUsers();
      }
    } catch (err: any) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditError(null);
  };

  const openResetPasswordModal = (user: UserAccount) => {
    setResetTargetUser(user);
    setAdminAssignedPassword('');
    setResetError(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner Notice */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            User Authentication &amp; Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage administrative access credentials, roles, and security policies for this portal.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Account & Change Password */}
        <div className="lg:col-span-1 space-y-6">
          {/* My Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-600/20">
                {currentUser.name
                  ? currentUser.name.slice(0, 2).toUpperCase()
                  : currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{currentUser.name || currentUser.username}</h3>
                <span className="text-xs text-slate-400 font-mono">@{currentUser.username}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Email:
                </span>
                <span className="text-slate-200 font-mono">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Access Role:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Created:
                </span>
                <span className="text-slate-300">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Change My Password Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Change My Password</h3>
            </div>

            {pwSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pwSuccessMsg}</span>
              </div>
            )}

            {pwErrorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pwErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangeMyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 pr-9 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-9 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPw}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isChangingPw ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: User Accounts Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  User Accounts Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All active users with authenticated access to this ad server portal.
                </p>
              </div>

              <button
                onClick={fetchUsers}
                disabled={isLoadingUsers}
                title="Refresh users list"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {u.name || u.username}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 font-mono text-[11px]">@{u.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-400">{u.email}</td>

                        <td className="px-3 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-400">
                          {u.lastLoginAt ? (
                            new Date(u.lastLoginAt).toLocaleString()
                          ) : (
                            <span className="text-slate-500 italic">Never</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password button (for Admins or Self) */}
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                title="Reset User Password"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit User button */}
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit User Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete User button */}
                            {currentUser.role === 'admin' && !isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete User Account"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: ADD NEW USER */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Add New User Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {addUserError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {addUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. adops_lead"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. jdoe@adserver.io"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Initial Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">System Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="manager">Manager (Campaigns, Creatives, Tags, Sandbox)</option>
                  <option value="admin">Administrator (Full Access &amp; User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewUser}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNewUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT USER */}
      {/* ==================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Edit User: @{editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="manager">Manager (Campaigns, Creatives, Tags, Sandbox)</option>
                  <option value="admin">Administrator (Full Access &amp; User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RESET PASSWORD (ADMIN) */}
      {/* ==================================================== */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Reset Password: @{resetTargetUser.username}
              </h3>
              <button
                onClick={() => setResetTargetUser(null)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              As an Administrator, you can assign a new password directly to this user account without needing their previous password.
            </p>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={adminAssignedPassword}
                  onChange={(e) => setAdminAssignedPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPw}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isResettingPw ? 'Resetting...' : 'Assign New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
