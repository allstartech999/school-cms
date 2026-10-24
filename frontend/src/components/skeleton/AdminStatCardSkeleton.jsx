import React from 'react';
import Skeleton from './Skeleton';

/**
 * AdminStatCardSkeleton for Admin Overview metrics
 */
export default function AdminStatCardSkeleton({
  count = 4,
  shimmerVariant = 'shimmer'
}) {
  const cards = Array.from({ length: count });

  const renderCard = (key) => (
    <div
      key={key}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-3"
    >
      {/* Header: Title and Icon pill */}
      <div className="flex items-center justify-between">
        <Skeleton
          variant={shimmerVariant}
          className="h-3.5 w-24"
          rounded="rounded"
        />
        <Skeleton
          variant={shimmerVariant}
          className="w-7 h-7 sm:w-8 sm:h-8"
          rounded="rounded-xl"
        />
      </div>

      {/* Number Value */}
      <div className="flex items-baseline gap-2">
        <Skeleton
          variant={shimmerVariant}
          className="h-8 w-20"
          rounded="rounded-lg"
        />
        <Skeleton
          variant={shimmerVariant}
          className="h-3 w-10"
          rounded="rounded"
        />
      </div>

      {/* Status note */}
      <Skeleton
        variant={shimmerVariant}
        className="h-3 w-32"
        rounded="rounded"
      />
    </div>
  );

  if (count === 1) {
    return renderCard(0);
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((_, i) => renderCard(i))}
    </div>
  );
}
