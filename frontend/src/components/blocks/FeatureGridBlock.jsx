import React from 'react';
import {
  Brain,
  Sparkles,
  Rocket,
  Trophy,
  Book,
  Cpu,
  Shield,
  Users,
  GraduationCap,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP = {
  Brain,
  Sparkles,
  Rocket,
  Trophy,
  Book,
  Cpu,
  Shield,
  Users,
  GraduationCap,
  CheckCircle,
};

export default function FeatureGridBlock({
  title,
  subtitle,
  columns = 3,
  items = [],
}) {
  if (!items || items.length === 0) return null;

  const colClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="my-12">
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 ${colClasses} gap-6`}>
        {items.map((item, idx) => {
          const IconComponent = ICON_MAP[item.icon] || HelpCircle;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
