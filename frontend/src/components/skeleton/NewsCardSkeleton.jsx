import React from 'react';
import Skeleton from './Skeleton';

/**
 * NewsCardSkeleton matching the news card layout
 * Supports 'akat' (homepage Akat Card design) and 'archive' (News list design).
 */
export default function NewsCardSkeleton({
  count = 1,
  variant = 'akat', // 'akat' | 'archive'
  className = '',
  shimmerVariant = 'shimmer'
}) {
  const cards = Array.from({ length: count });

  const renderSingleCard = (idx) => {
    if (variant === 'akat') {
      return (
        <article
          key={idx}
          className={`akat-card overflow-hidden flex flex-col justify-between ${className}`}
        >
          {/* Thumbnail */}
          <div className="aspect-16/10 w-full overflow-hidden bg-neutral-100">
            <Skeleton
              variant={shimmerVariant}
              className="w-full h-full"
              rounded="rounded-none"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Category pill & Date chip */}
              <div className="flex items-center gap-2 mb-3">
                <Skeleton
                  variant={shimmerVariant}
                  className="h-4 w-16"
                  rounded="rounded-md"
                />
                <span className="text-neutral-300 text-xs">•</span>
                <Skeleton
                  variant={shimmerVariant}
                  className="h-3.5 w-20"
                  rounded="rounded-md"
                />
              </div>

              {/* Title lines */}
              <div className="space-y-2">
                <Skeleton
                  variant={shimmerVariant}
                  className="h-5 w-11/12"
                  rounded="rounded-md"
                />
                <Skeleton
                  variant={shimmerVariant}
                  className="h-5 w-3/4"
                  rounded="rounded-md"
                />
              </div>

              {/* Excerpt lines */}
              <div className="space-y-1.5 mt-3">
                <Skeleton
                  variant={shimmerVariant}
                  className="h-3.5 w-full"
                  rounded="rounded-md"
                />
                <Skeleton
                  variant={shimmerVariant}
                  className="h-3.5 w-4/5"
                  rounded="rounded-md"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <Skeleton
                variant={shimmerVariant}
                className="h-4 w-20"
                rounded="rounded-md"
              />
              <Skeleton
                variant={shimmerVariant}
                className="h-3.5 w-12"
                rounded="rounded-md"
              />
            </div>
          </div>
        </article>
      );
    }

    // Archive style
    return (
      <article
        key={idx}
        className={`flex flex-col justify-between ${className}`}
      >
        {/* Thumbnail */}
        <div className="aspect-16/10 w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/70 mb-4">
          <Skeleton
            variant={shimmerVariant}
            className="w-full h-full"
            rounded="rounded-2xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Category pill & Date */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton
                variant={shimmerVariant}
                className="h-4 w-16"
                rounded="rounded-md"
              />
              <span className="text-neutral-300 text-xs">•</span>
              <Skeleton
                variant={shimmerVariant}
                className="h-3.5 w-20"
                rounded="rounded-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Skeleton
                variant={shimmerVariant}
                className="h-5 w-11/12"
                rounded="rounded-md"
              />
              <Skeleton
                variant={shimmerVariant}
                className="h-5 w-2/3"
                rounded="rounded-md"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5 mt-2.5">
              <Skeleton
                variant={shimmerVariant}
                className="h-3.5 w-full"
                rounded="rounded-md"
              />
              <Skeleton
                variant={shimmerVariant}
                className="h-3.5 w-4/5"
                rounded="rounded-md"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <Skeleton
              variant={shimmerVariant}
              className="h-4 w-16"
              rounded="rounded-md"
            />
            <Skeleton
              variant={shimmerVariant}
              className="h-3.5 w-12"
              rounded="rounded-md"
            />
          </div>
        </div>
      </article>
    );
  };

  if (count === 1) {
    return renderSingleCard(0);
  }

  return (
    <>
      {cards.map((_, i) => renderSingleCard(i))}
    </>
  );
}
