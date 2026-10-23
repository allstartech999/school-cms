import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function AccordionFaqBlock({ title, subtitle, items = [] }) {
  const [openIndices, setOpenIndices] = useState([0]);

  if (!items || items.length === 0) return null;

  const toggle = (idx) => {
    if (openIndices.includes(idx)) {
      setOpenIndices(openIndices.filter((i) => i !== idx));
    } else {
      setOpenIndices([...openIndices, idx]);
    }
  };

  return (
    <section className="my-12 py-8 max-w-4xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8 space-y-2">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-emerald-700 transition-colors"
              >
                <span className="text-sm sm:text-base">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-600 transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
