import React from 'react';
import {
  Home,
  Newspaper,
  Sparkles,
  Building2,
  Lock,
  LayoutDashboard,
  Phone,
  GraduationCap,
  Users,
  FileText,
  Globe,
  Info,
  BookOpen
} from 'lucide-react';
import { useAdaptive } from '../../context/AdaptiveContext';

/**
 * Smart Lucide Icon map for bottom navigation
 */
const ICON_MAP = {
  Home,
  Building2,
  Newspaper,
  Sparkles,
  Phone,
  GraduationCap,
  Users,
  FileText,
  LayoutDashboard,
  Lock,
  Globe,
  Info,
  BookOpen
};

/**
 * Resolves icon from string or keyword detection
 */
function resolveIcon(item) {
  if (typeof item.icon === 'function') {
    return item.icon;
  }
  if (typeof item.icon === 'string' && ICON_MAP[item.icon]) {
    return ICON_MAP[item.icon];
  }

  const text = `${item.title || ''} ${item.label || ''} ${item.path || ''} ${item.id || ''}`.toLowerCase();

  if (text.includes('home') || text.includes('หน้าแรก')) return Home;
  if (text.includes('news') || text.includes('ข่าว') || text.includes('ประกาศ')) return Newspaper;
  if (text.includes('eservice') || text.includes('service') || text.includes('บริการ')) return Sparkles;
  if (text.includes('about') || text.includes('เกี่ยวกับ') || text.includes('ประวัติ') || text.includes('วิสัยทัศน์')) return Building2;
  if (text.includes('contact') || text.includes('ติดต่อ') || text.includes('โทร')) return Phone;
  if (text.includes('academic') || text.includes('วิชาการ') || text.includes('หลักสูตร') || text.includes('เรียน')) return GraduationCap;
  if (text.includes('user') || text.includes('personnel') || text.includes('บุคลากร') || text.includes('ครู') || text.includes('นักเรียน')) return Users;

  return FileText;
}

/**
 * AdaptiveBottomNav:
 * Designed specifically for Mobile Adaptive UX (Thumb Zone navigation).
 * Filters items from site navigation with fallback and keeps admin access.
 */
export default function AdaptiveBottomNav({
  menuItems = [],
  currentPage,
  activeDynamicPage,
  onNavigate,
  isAdminLoggedIn,
  newsCount = 0
}) {
  const { isMobile, isForcedDesktop, isForcedMobile } = useAdaptive();

  // If forced desktop mode is on, don't show mobile bottom nav
  if (!isMobile || isForcedDesktop) return null;

  // 1. Filter items from menuItems that have show_in_bottom_nav === true
  let selectedItems = (Array.isArray(menuItems) ? menuItems : []).filter(
    (item) => item && item.show_in_bottom_nav === true
  );

  // If none explicitly marked, fallback to the top 4 default items
  if (selectedItems.length === 0) {
    const defaults = ['home', 'news', 'eservice', 'about'];
    selectedItems = defaults.map((id) => {
      const found = (menuItems || []).find((m) => m.id === id || m.path === id);
      if (found) return found;
      if (id === 'home') return { id: 'home', title: 'หน้าแรก', path: 'home', icon: 'Home' };
      if (id === 'news') return { id: 'news', title: 'ข่าวสาร', path: 'news', icon: 'Newspaper' };
      if (id === 'eservice') return { id: 'eservice', title: 'E-Service', path: 'eservice', icon: 'Sparkles' };
      if (id === 'about') return { id: 'about', title: 'เกี่ยวกับเรา', path: 'about', icon: 'Building2' };
      return null;
    }).filter(Boolean);
  }

  // Keep maximum 4 items from site navigation
  const siteNavItems = selectedItems.slice(0, 4);

  // 5th item is always Admin / Login
  const adminItem = {
    id: 'admin',
    title: isAdminLoggedIn ? 'หลังบ้าน' : 'ล็อกอิน',
    path: 'admin',
    icon: isAdminLoggedIn ? LayoutDashboard : Lock,
    isAdmin: true,
  };

  const navItems = [...siteNavItems, adminItem];

  const checkIsActive = (item) => {
    if (item.isAdmin || item.id === 'admin') {
      return currentPage === 'admin';
    }

    const itemPath = item.path || item.id;
    if (currentPage === itemPath) return true;

    // Check dynamic page slug
    if (currentPage === 'dynamic_page' && activeDynamicPage?.slug) {
      const cleanPath = (itemPath || '').replace(/^\/?(pages|page)\//, '');
      if (cleanPath && cleanPath === activeDynamicPage.slug) return true;
    }

    // Check children if any
    if (item.children && Array.isArray(item.children)) {
      return item.children.some((child) => {
        const childPath = child.path || child.id;
        if (currentPage === childPath) return true;
        if (currentPage === 'dynamic_page' && activeDynamicPage?.slug) {
          const cleanChildPath = (childPath || '').replace(/^\/?(pages|page)\//, '');
          if (cleanChildPath && cleanChildPath === activeDynamicPage.slug) return true;
        }
        return false;
      });
    }

    return false;
  };

  const handleItemClick = (item) => {
    if (item.isAdmin || item.id === 'admin') {
      onNavigate('admin');
      return;
    }
    onNavigate(item.path || item.id);
  };

  const getBadge = (item) => {
    const text = `${item.title || ''} ${item.path || ''} ${item.id || ''}`.toLowerCase();
    if ((text.includes('news') || text.includes('ข่าว')) && newsCount > 0) {
      return newsCount;
    }
    return null;
  };

  return (
    <nav
      aria-label="เมนูลัดบนอุปกรณ์เคลื่อนที่"
      className={`fixed bottom-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,8px)] transition-all ${
        isForcedMobile ? 'w-full max-w-[430px] left-1/2 -translate-x-1/2 rounded-t-2xl border-x' : 'left-0 right-0'
      }`}
    >
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = resolveIcon(item);
          const isActive = checkIsActive(item);
          const badge = getBadge(item);
          const label = item.title || item.label || item.id;

          return (
            <button
              key={item.id || item.path}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer select-none min-w-[56px] min-h-[44px] ${
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
                {badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 leading-tight tracking-tight truncate max-w-[68px] ${isActive ? 'font-bold text-emerald-700' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
