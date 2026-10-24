import React from 'react';
import Skeleton from './Skeleton';

/**
 * PostDetailSkeleton for full article modal / reader view
 */
export default function PostDetailSkeleton({
  shimmerVariant = 'shimmer'
}) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Hero Image Skeleton */}
      <div className="w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-neutral-100">
        <Skeleton
          variant={shimmerVariant}
          className="w-full h-full"
          rounded="rounded-none"
        />
      </div>

      {/* Content Skeleton Container */}
      <div className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8 pt-0 sm:pt-0 md:pt-0">
        {/* Metadata Chips: Category, Date, Author */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Skeleton
              variant={shimmerVariant}
              className="h-6 w-20"
              rounded="rounded-full"
            />
            <span className="text-neutral-300">•</span>
            <Skeleton
              variant={shimmerVariant}
              className="h-4 w-28"
              rounded="rounded-md"
            />
            <span className="text-neutral-300">•</span>
            <Skeleton
              variant={shimmerVariant}
              className="h-4 w-36"
              rounded="rounded-md"
            />
          </div>

          {/* Title Lines */}
          <div className="space-y-2.5 pt-1">
            <Skeleton
              variant={shimmerVariant}
              className="h-8 sm:h-10 w-11/12"
              rounded="rounded-xl"
            />
            <Skeleton
              variant={shimmerVariant}
              className="h-8 sm:h-10 w-2/3"
              rounded="rounded-xl"
            />
          </div>
        </div>

        {/* Summary Callout Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50/80 border-l-4 border-emerald-400 space-y-2">
          <Skeleton
            variant={shimmerVariant}
            className="h-4 w-full"
            rounded="rounded-md"
          />
          <Skeleton
            variant={shimmerVariant}
            className="h-4 w-4/5"
            rounded="rounded-md"
          />
        </div>

        {/* Content Paragraphs */}
        <div className="space-y-6 pt-2">
          {/* Paragraph 1 */}
          <div className="space-y-2.5">
            <Skeleton variant={shimmerVariant} className="h-4 w-full" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-11/12" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-5/6" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-3/4" rounded="rounded-md" />
          </div>

          {/* Paragraph 2 */}
          <div className="space-y-2.5">
            <Skeleton variant={shimmerVariant} className="h-4 w-full" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-4/5" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-2/3" rounded="rounded-md" />
          </div>

          {/* Paragraph 3 */}
          <div className="space-y-2.5">
            <Skeleton variant={shimmerVariant} className="h-4 w-11/12" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-3/4" rounded="rounded-md" />
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <Skeleton
            variant={shimmerVariant}
            className="h-4 w-28"
            rounded="rounded-md"
          />
          <div className="flex items-center gap-2">
            <Skeleton
              variant={shimmerVariant}
              className="h-9 w-24"
              rounded="rounded-full"
            />
            <Skeleton
              variant={shimmerVariant}
              className="h-9 w-20"
              rounded="rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
