import React from 'react';
import { User } from 'lucide-react';

export default function PersonCardsBlock({ title, subtitle, members = [] }) {
  if (!members || members.length === 0) return null;

  return (
    <section className="py-8 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {subtitle}
              </p>
            )}
            <div className="w-12 h-1 bg-emerald-600 mx-auto mt-4 rounded-full"></div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((person, idx) => (
            <div 
              key={idx}
              className="group bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col items-center text-center"
            >
              <div className="w-28 h-36 rounded-xl overflow-hidden bg-emerald-100 border-2 border-emerald-500/20 shadow-sm mb-4 shrink-0 flex items-center justify-center">
                {person.photo ? (
                  <img 
                    src={person.photo} 
                    alt={person.name} 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/head-academic.jpg';
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-emerald-600" />
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                {person.name}
              </h3>
              
              {person.role && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 mb-1">
                  {person.role}
                </div>
              )}

              {person.position && (
                <p className="text-xs text-slate-500 mb-2">
                  {person.position}
                </p>
              )}

              {person.group && (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded mb-3">
                  {person.group}
                </span>
              )}

              {person.quote && (
                <p className="text-xs italic text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 mt-auto w-full text-center">
                  "{person.quote}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
