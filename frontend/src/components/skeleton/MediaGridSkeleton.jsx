import React from 'react';
import Skeleton from './Skeleton';

/**
 * MediaGridSkeleton for media gallery thumbnails in admin media tab
 */
export default function MediaGridSkeleton({
  count = 12,
  shimmerVariant = 'shimmer'
}) {
  const items = Array.from({ length: count });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col justify-between"
        >
          {/* Thumbnail Skeleton */}
          <div className="aspect-square bg-neutral-200/60 overflow-hidden">
            <Skeleton
              variant={shimmerVariant}
              className="w-full h-full"
              rounded="rounded-none"
            />
          </div>

          {/* Caption & Actions Skeleton */}
          <div className="p-2 space-y-2 bg-white">
            <Skeleton
              variant={shimmerVariant}
              className="h-3 w-4/5"
              rounded="rounded"
            />
            <div className="flex items-center gap-1">
              <Skeleton
                variant={shimmerVariant}
                className="h-6 flex-1"
                rounded="rounded"
              />
              <Skeleton
                variant={shimmerVariant}
                className="w-6 h-6"
                rounded="rounded"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
