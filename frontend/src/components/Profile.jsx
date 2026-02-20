import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { User, Mail, Calendar, Lock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const inputCls = 'w-full rounded-xl border border-midnight/10 bg-sage/40 px-4 py-2.5 text-sm text-midnight placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 transition';

export function Profile() {
    const user = useAuthStore((state) => state.user);
    const signOut = useAuthStore((state) => state.signOut);
    const clearRoadmapData = useRoadmapStore((state) => state.clearRoadmapData);
    const roadmaps = useRoadmapStore((state) => state.roadmaps);
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    const completedCount = roadmaps.filter(r => r.is_completed).length;
    const ongoingCount = roadmaps.filter(r => !r.is_completed).length;
    const totalNodes = roadmaps.reduce((s, r) => s + (r.nodes?.length || 0), 0);
    const completedNodes = roadmaps.reduce((s, r) => s + (r.marked_nodes?.length || 0), 0);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError(''); setPwSuccess('');
        if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return; }
        if (newPassword.length < 5) { setPwError('Password must be at least 5 characters.'); return; }
        setPwLoading(true);
        try {
            await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
            setPwSuccess('Password updated successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            setPwError(err.response?.data?.detail || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleSignOut = () => {
        signOut();
        clearRoadmapData();
        navigate('/');
    };

    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    const stats = [
        { label: 'Ongoing', value: ongoingCount, bg: 'bg-coral/10', color: 'text-coral' },
        { label: 'Completed', value: completedCount, bg: 'bg-green-50', color: 'text-green-600' },
        { label: 'Total Topics', value: totalNodes, bg: 'bg-midnight/5', color: 'text-midnight' },
        { label: 'Done Topics', value: completedNodes, bg: 'bg-sage', color: 'text-slate-600' },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile heading */}
            <div className="mb-2">
                <h1 className="text-4xl font-bold text-midnight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Your Account
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Manage your profile and preferences.</p>
            </div>

            {/* Identity card */}
            <div className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-6 flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-7 w-7 text-coral" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-midnight truncate">{user?.email}</p>
                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user?.email}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {joinedDate}</span>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                >
                    <LogOut className="h-4 w-4" />Sign out
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ label, value, bg, color }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Change password */}
            <div className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-6">
                <h2 className="text-lg font-bold text-midnight flex items-center gap-2 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <Lock className="h-4 w-4 text-coral" />Change Password
                </h2>

                {pwSuccess && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <CheckCircle className="h-4 w-4" />{pwSuccess}
                    </div>
                )}
                {pwError && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="h-4 w-4" />{pwError}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    {[
                        { label: 'Current Password', val: currentPassword, setter: setCurrentPassword },
                        { label: 'New Password', val: newPassword, setter: setNewPassword },
                        { label: 'Confirm New Password', val: confirmPassword, setter: setConfirmPassword },
                    ].map(({ label, val, setter }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-midnight mb-1.5">{label}</label>
                            <input type="password" value={val} onChange={e => setter(e.target.value)} required minLength={5} placeholder="••••••••" className={inputCls} />
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="w-full flex items-center justify-center gap-2 bg-coral text-white font-semibold py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 mt-2"
                    >
                        {pwLoading ? 'Updating…' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
