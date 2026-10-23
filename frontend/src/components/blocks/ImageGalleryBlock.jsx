import React from 'react';

export default function ImageGalleryBlock({ title, subtitle, columns = 3, images = [] }) {
  if (!images || images.length === 0) return null;

  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-8 bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="text-center max-w-2xl mx-auto mb-8">
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

        <div className={`grid ${colClasses} gap-5`}>
          {images.map((item, idx) => (
            <div 
              key={idx}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg transition duration-300"
            >
              <div className="aspect-4/3 overflow-hidden bg-slate-100 relative">
                <img 
                  src={item.url} 
                  alt={item.alt || item.caption || `ภาพที่ ${idx + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/hero-banner.jpg';
                  }}
                />
              </div>
              {item.caption && (
                <div className="p-3 text-xs sm:text-sm font-medium text-slate-700 bg-white">
                  {item.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
