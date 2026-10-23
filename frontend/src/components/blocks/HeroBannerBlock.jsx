import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroBannerBlock({
  variant = 'split',
  badge,
  heading,
  subheading,
  ctaText,
  ctaUrl = '#',
  imageUrl,
}) {
  const isCentered = variant === 'centered';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white shadow-xl my-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
        <div className={`grid items-center gap-8 ${isCentered ? 'text-center max-w-3xl mx-auto' : 'lg:grid-cols-12'}`}>
          <div className={isCentered ? '' : 'lg:col-span-7 space-y-6'}>
            {badge && (
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 text-emerald-100 text-xs sm:text-sm font-semibold mb-4 ${isCentered ? 'mx-auto' : ''}`}>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>{badge}</span>
              </div>
            )}
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {heading}
            </h1>

            {subheading && (
              <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl leading-relaxed mt-3">
                {subheading}
              </p>
            )}

            {ctaText && (
              <div className={`pt-2 ${isCentered ? 'flex justify-center' : ''}`}>
                <a
                  href={ctaUrl}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-bold shadow-lg hover:bg-emerald-50 hover:shadow-xl transition-all duration-200 group"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}
          </div>

          {!isCentered && imageUrl && (
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img
                  src={imageUrl}
                  alt={heading}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
