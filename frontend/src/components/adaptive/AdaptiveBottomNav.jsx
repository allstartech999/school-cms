import React from 'react';
import { Home, Newspaper, Sparkles, Building2, Lock, LayoutDashboard } from 'lucide-react';
import { useAdaptive } from '../../context/AdaptiveContext';

/**
 * AdaptiveBottomNav:
 * Designed specifically for Mobile Adaptive UX (Thumb Zone navigation).
 * Snaps to the bottom of the screen with iOS safe area padding.
 */
export default function AdaptiveBottomNav({
  currentPage,
  onNavigate,
  isAdminLoggedIn,
  newsCount = 0
}) {
  const { isMobile, isForcedDesktop, isForcedMobile } = useAdaptive();

  // If forced desktop mode is on, don't show mobile bottom nav
  if (!isMobile || isForcedDesktop) return null;

  const navItems = [
    { id: 'home', label: 'หน้าแรก', icon: Home },
    { id: 'news', label: 'ข่าวสาร', icon: Newspaper, badge: newsCount > 0 ? newsCount : null },
    { id: 'eservice', label: 'E-Service', icon: Sparkles },
    { id: 'about', label: 'เกี่ยวกับเรา', icon: Building2 },
    {
      id: 'admin',
      label: isAdminLoggedIn ? 'หลังบ้าน' : 'ล็อกอิน',
      icon: isAdminLoggedIn ? LayoutDashboard : Lock,
      highlight: true
    },
  ];

  return (
    <nav
      aria-label="เมนูลัดบนอุปกรณ์เคลื่อนที่"
      className={`fixed bottom-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,8px)] transition-all ${
        isForcedMobile ? 'w-full max-w-[430px] left-1/2 -translate-x-1/2 rounded-t-2xl border-x' : 'left-0 right-0'
      }`}
    >
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer select-none min-w-[56px] min-h-[44px] ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active subtle pill glow */}
              {isActive && (
                <span className="absolute inset-0 bg-emerald-50 rounded-xl -z-10 scale-95 animate-in fade-in zoom-in-95 duration-150" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-600 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 leading-tight tracking-tight ${isActive ? 'font-bold text-emerald-700' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
