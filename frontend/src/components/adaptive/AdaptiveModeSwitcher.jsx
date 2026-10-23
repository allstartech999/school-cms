import React, { useState } from 'react';
import { Smartphone, Monitor, Sparkles, SlidersHorizontal, X, Check, Laptop } from 'lucide-react';
import { useAdaptive } from '../../context/AdaptiveContext';
import { VIEWPORT_MODES } from '../../context/AdaptiveConstants';

/**
 * AdaptiveModeSwitcher:
 * Allows visitors, teachers, and administrators to toggle between
 * Auto, Mobile, and Desktop viewport modes, satisfying the core
 * requirement for adaptive device control in government/school systems.
 */
export default function AdaptiveModeSwitcher() {
  const {
    viewportMode,
    setMode,
    width,
    physicalDeviceType,
    profileLabel,
    isMobile,
    isForcedMobile,
  } = useAdaptive();

  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    {
      id: VIEWPORT_MODES.AUTO,
      label: 'โหมดอัตโนมัติ',
      desc: 'ปรับตามขนาดหน้าจอจริงอัตโนมัติ (AWD)',
      icon: Sparkles,
      activeColor: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    },
    {
      id: VIEWPORT_MODES.MOBILE,
      label: 'มุมมองมือถือ',
      desc: 'เลย์เอาต์กะทัดรัด พร้อมแถบเมนูด้านล่าง',
      icon: Smartphone,
      activeColor: 'text-teal-700 bg-teal-50 border-teal-300',
    },
    {
      id: VIEWPORT_MODES.DESKTOP,
      label: 'มุมมองเดสก์ท็อป',
      desc: 'แสดงผลแบบคอมพิวเตอร์เต็มจอ (Full Web)',
      icon: Monitor,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-300',
    },
  ];

  return (
    <div className={`fixed z-50 print:hidden transition-all duration-300 ${
      isMobile && !isForcedMobile ? 'bottom-20 right-3' : 'bottom-6 right-6'
    }`}>
      {/* Expanded Modal / Popover */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-none">ปรับแต่งมุมมองจอ (AWD)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">ระบบจัดการแสดงผลแบบ Adaptive</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="ปิดเมนูปรับแต่ง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Screen Specs Info Box */}
          <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1 border border-slate-150">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">อุปกรณ์จริง:</span>
              <span className="font-semibold text-slate-700">{physicalDeviceType} ({width}px)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">สถานะที่แสดงผล:</span>
              <span className="font-semibold text-emerald-700">{profileLabel}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-1.5">
            {modes.map((item) => {
              const Icon = item.icon;
              const isSelected = viewportMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMode(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? item.activeColor + ' font-semibold shadow-xs'
                      : 'border-slate-150 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1 text-center">
            <p className="text-[10px] text-slate-400">
              รองรับทั้งการอ่านบนมือถือและพิมพ์รายงานบนเดสก์ท็อป
            </p>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="เปลี่ยนมุมมองการแสดงผล"
        className={`group flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-700/20'
            : 'bg-white/95 text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 hover:shadow-xl'
        }`}
      >
        <SlidersHorizontal className={`w-3.5 h-3.5 ${isOpen ? 'rotate-90' : 'group-hover:rotate-45'} transition-transform duration-300`} />
        <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
          {viewportMode === VIEWPORT_MODES.AUTO ? 'AWD: ออโต้' : viewportMode === VIEWPORT_MODES.MOBILE ? 'AWD: มือถือ' : 'AWD: เดสก์ท็อป'}
        </span>
      </button>
    </div>
  );
}
