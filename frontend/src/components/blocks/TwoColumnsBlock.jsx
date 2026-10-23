import React from 'react';

export default function TwoColumnsBlock({
  badge,
  heading,
  content,
  imageUrl,
  imagePosition = 'right',
}) {
  const isImageLeft = imagePosition === 'left';

  return (
    <section className="my-12 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Content Side */}
        <div className={`space-y-5 ${isImageLeft ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7'}`}>
          {badge && (
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
              {badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {heading}
          </h2>
          <div className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
            {content}
          </div>
        </div>

        {/* Image Side */}
        {imageUrl && (
          <div className={`flex justify-center ${isImageLeft ? 'lg:col-span-5 lg:order-1' : 'lg:col-span-5'}`}>
            <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src={imageUrl}
                alt={heading}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
