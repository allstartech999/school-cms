import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  X,
  FileDown
} from 'lucide-react';

/**
 * PdfViewerBlock Component
 * Adaptive PDF Document Card & Embedded Viewer
 * Optimized for Desktop, iOS Safari, Android, and In-App Browsers
 */
export default function PdfViewerBlock({ url, title }) {
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(mobile);
      // Auto-open preview on desktop, keep collapsed on mobile to avoid scroll-trapping & save mobile data
      if (!mobile) {
        setShowPreview(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!url) return null;

  // Derive a user-friendly document title
  const cleanTitle = (() => {
    if (title && title.trim() && title.toLowerCase() !== 'pdf') {
      return title.trim();
    }
    try {
      const segments = url.split('/');
      const lastSegment = segments[segments.length - 1].split('?')[0];
      const decoded = decodeURIComponent(lastSegment);
      // If filename has timestamp prefix like 1729000-upload-document.pdf, clean it up
      return decoded.replace(/^\d+-(?:upload-)?/, '') || 'เอกสารแนบ PDF';
    } catch {
      return 'เอกสารแนบ PDF';
    }
  })();

  // Construct viewer URL with browser PDF options
  const viewerUrl = url.includes('#') ? url : `${url}#toolbar=1&navpanes=0&view=FitH`;

  return (
    <div className="my-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-neutral-300">
      {/* Document Card Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-50/50 via-white to-neutral-50/50">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs border border-red-200/60">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100/80 text-red-700 tracking-wide">
                PDF
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                เอกสารแนบ
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 truncate tracking-tight" title={cleanTitle}>
              {cleanTitle}
            </h4>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
          {/* Download Button */}
          <a
            href={url}
            download={cleanTitle}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
            title="ดาวน์โหลดไฟล์ PDF ลงเครื่อง"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด</span>
          </a>

          {/* Open In New Tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
            title="เปิดอ่านในแท็บใหม่"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">แท็บใหม่</span>
          </a>

          {/* Fullscreen Modal View */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition cursor-pointer"
            title="เปิดอ่านเอกสารเต็มหน้าจอ"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>อ่านเต็มจอ</span>
          </button>

          {/* Toggle Inline Preview */}
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
            title={showPreview ? 'ซ่อนตัวอย่าง' : 'แสดงตัวอย่าง'}
            aria-expanded={showPreview}
          >
            <span className="text-[11px]">{showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}</span>
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Inline Preview Body */}
      {showPreview && (
        <div className="border-t border-neutral-200/80 bg-neutral-100 relative">
          <div className="w-full h-[520px] sm:h-[620px] relative bg-neutral-900/5">
            <iframe
              src={viewerUrl}
              title={cleanTitle}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>

          {/* Mobile Helper Hint */}
          {isMobile && (
            <div className="p-2.5 bg-amber-50/90 border-t border-amber-200/60 text-amber-800 text-xs flex items-center justify-between gap-2">
              <span className="truncate">
                💡 บนมือถือ แนะนำให้กด <strong>"อ่านเต็มจอ"</strong> หรือ <strong>"แท็บใหม่"</strong> เพื่อซูมอ่านตัวหนังสือได้ชัดเจนขึ้น
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-semibold underline text-amber-900"
              >
                เปิดเลย
              </a>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Reader Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex flex-col animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between gap-4 border-b border-neutral-800 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold truncate text-neutral-100">
                {cleanTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={url}
                download={cleanTitle}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด</span>
              </a>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">แท็บใหม่</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition cursor-pointer"
                title="ปิดหน้าต่างอ่าน (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal PDF Viewer Body */}
          <div className="flex-1 w-full bg-neutral-950 relative overflow-hidden">
            <iframe
              src={viewerUrl}
              title={cleanTitle}
              className="w-full h-full border-0 bg-neutral-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
