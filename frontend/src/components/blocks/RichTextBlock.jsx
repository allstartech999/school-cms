import React from 'react';

export default function RichTextBlock({ heading, content, container = 'normal' }) {
  if (!content) return null;

  const maxWidthClass = container === 'narrow' ? 'max-w-3xl' : 'max-w-4xl';

  return (
    <section className="py-8 bg-white">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6`}>
        {heading && (
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-3">
            <span className="w-2 h-7 bg-emerald-600 rounded-full inline-block"></span>
            {heading}
          </h2>
        )}
        <div className="prose prose-slate prose-emerald max-w-none text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base">
          {content}
        </div>
      </div>
    </section>
  );
}
