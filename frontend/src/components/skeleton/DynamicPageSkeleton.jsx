import React from 'react';
import Skeleton from './Skeleton';

/**
 * DynamicPageSkeleton for custom dynamic CMS pages (/pages/:slug)
 */
export default function DynamicPageSkeleton({
  shimmerVariant = 'shimmer',
  className = ''
}) {
  return (
    <div className={`animate-in fade-in duration-200 ${className}`}>
      {/* Breadcrumb Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-200/60">
          <Skeleton variant={shimmerVariant} className="h-4 w-14" rounded="rounded-md" />
          <span className="text-neutral-300 text-xs">/</span>
          <Skeleton variant={shimmerVariant} className="h-4 w-32" rounded="rounded-md" />
        </div>
      </div>

      {/* Main Page Content Skeleton Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-8">
          {/* Page Title */}
          <div className="pb-6 border-b border-neutral-100 space-y-2">
            <Skeleton
              variant={shimmerVariant}
              className="h-9 sm:h-10 w-2/3"
              rounded="rounded-xl"
            />
            <Skeleton
              variant={shimmerVariant}
              className="h-4 w-1/3"
              rounded="rounded-md"
            />
          </div>

          {/* Banner Media Block */}
          <div className="w-full aspect-21/9 rounded-2xl overflow-hidden bg-neutral-100">
            <Skeleton
              variant={shimmerVariant}
              className="w-full h-full"
              rounded="rounded-2xl"
            />
          </div>

          {/* Section 1 Content */}
          <div className="space-y-3 pt-2">
            <Skeleton variant={shimmerVariant} className="h-6 w-1/4" rounded="rounded-lg" />
            <Skeleton variant={shimmerVariant} className="h-4 w-full" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-11/12" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-4/5" rounded="rounded-md" />
          </div>

          {/* 2-Column Feature Block Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/60 space-y-2.5">
              <Skeleton variant={shimmerVariant} className="h-5 w-1/2" rounded="rounded-md" />
              <Skeleton variant={shimmerVariant} className="h-3.5 w-full" rounded="rounded-md" />
              <Skeleton variant={shimmerVariant} className="h-3.5 w-3/4" rounded="rounded-md" />
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/60 space-y-2.5">
              <Skeleton variant={shimmerVariant} className="h-5 w-1/2" rounded="rounded-md" />
              <Skeleton variant={shimmerVariant} className="h-3.5 w-full" rounded="rounded-md" />
              <Skeleton variant={shimmerVariant} className="h-3.5 w-3/4" rounded="rounded-md" />
            </div>
          </div>

          {/* Section 2 Content */}
          <div className="space-y-2.5 pt-2">
            <Skeleton variant={shimmerVariant} className="h-4 w-full" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-5/6" rounded="rounded-md" />
            <Skeleton variant={shimmerVariant} className="h-4 w-3/4" rounded="rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
