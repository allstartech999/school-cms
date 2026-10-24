import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, KeyRound, User } from 'lucide-react';
import { adminLogin } from '../../api';

export default function AdminLogin({ onLoginSuccess, onClose, schoolInfo }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminLogin(password, username.trim());
      const token = res.token || 'authenticated-admin';
      localStorage.setItem('school_admin_token', token);
      if (res.user) {
        localStorage.setItem('school_admin_user', JSON.stringify(res.user));
      }
      if (onLoginSuccess) {
        onLoginSuccess(token, !!res.must_change_password);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Pattern */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white relative">
          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition cursor-pointer flex items-center gap-1.5 text-xs"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับหน้าหลัก</span>
            </button>
          </div>

          <div className="flex flex-col items-center text-center mt-3 sm:mt-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center shadow-lg mb-3">
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-200" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">เข้าสู่ระบบผู้ดูแลระบบ</h2>
            <p className="text-emerald-100/80 text-[11px] sm:text-xs mt-1">
              {schoolInfo?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} CMS Admin Portal
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-neutral-900 transition outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="w-full pl-10 pr-11 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-neutral-900 transition outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-medium text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>เข้าสู่ระบบหลังบ้าน</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
            >
              ยกเลิกและกลับสู่หน้าเว็บไซต์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
