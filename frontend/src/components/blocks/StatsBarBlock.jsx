import React from 'react';

export default function StatsBarBlock({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="my-8 py-6">
      {title && (
        <h3 className="text-center text-sm font-bold tracking-widest text-emerald-800 uppercase mb-6">
          {title}
        </h3>
      )}
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-4 sm:gap-6`}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-700 tracking-tight">
              {item.value}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-2">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
