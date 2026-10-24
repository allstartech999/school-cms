import React from 'react';
import Skeleton from './Skeleton';

/**
 * AdminTableSkeleton for tables in admin dashboard
 * Supports configurable columns, rows, compact mode, and responsive layout.
 */
export default function AdminTableSkeleton({
  rows = 5,
  columns = 5,
  compact = false,
  showSearch = false,
  hasThumbnail = true,
  shimmerVariant = 'shimmer'
}) {
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  if (compact) {
    return (
      <div className="space-y-2">
        {rowList.map((_, rIdx) => (
          <div
            key={rIdx}
            className="p-2.5 sm:p-3 rounded-xl bg-neutral-50/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {hasThumbnail && (
                <Skeleton
                  variant={shimmerVariant}
                  className="h-4 w-14 shrink-0"
                  rounded="rounded-full"
                />
              )}
              <Skeleton
                variant={shimmerVariant}
                className={`h-4 ${hasThumbnail ? 'w-4/6' : 'w-3/5'} truncate`}
                rounded="rounded"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton
                variant={shimmerVariant}
                className="h-3 w-16 hidden xs:inline-block"
                rounded="rounded"
              />
              <Skeleton
                variant={shimmerVariant}
                className="w-6 h-6"
                rounded="rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
      {/* Optional Search / Filter Toolbar Skeleton */}
      {showSearch && (
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton
            variant={shimmerVariant}
            className="h-9 w-full sm:w-64"
            rounded="rounded-xl"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Skeleton
              variant={shimmerVariant}
              className="h-9 w-24"
              rounded="rounded-xl"
            />
            <Skeleton
              variant={shimmerVariant}
              className="h-9 w-28"
              rounded="rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="bg-neutral-50 border-b border-neutral-200/80 text-[11px] font-semibold text-neutral-500">
            <tr>
              {colList.map((_, cIdx) => (
                <th key={cIdx} className="py-3 px-4">
                  <Skeleton
                    variant={shimmerVariant}
                    className="h-3.5 w-16"
                    rounded="rounded"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rowList.map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-50/50 transition">
                {colList.map((_, cIdx) => (
                  <td key={cIdx} className="py-3.5 px-4">
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        {hasThumbnail && (
                          <Skeleton
                            variant={shimmerVariant}
                            className="w-10 h-10 shrink-0"
                            rounded="rounded-lg"
                          />
                        )}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <Skeleton
                            variant={shimmerVariant}
                            className="h-3.5 w-48"
                            rounded="rounded"
                          />
                          <Skeleton
                            variant={shimmerVariant}
                            className="h-3 w-28"
                            rounded="rounded"
                          />
                        </div>
                      </div>
                    ) : cIdx === 1 ? (
                      <Skeleton
                        variant={shimmerVariant}
                        className="h-5 w-16"
                        rounded="rounded-full"
                      />
                    ) : cIdx === colList.length - 1 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton
                          variant={shimmerVariant}
                          className="w-7 h-7"
                          rounded="rounded-lg"
                        />
                        <Skeleton
                          variant={shimmerVariant}
                          className="w-7 h-7"
                          rounded="rounded-lg"
                        />
                      </div>
                    ) : (
                      <Skeleton
                        variant={shimmerVariant}
                        className="h-3.5 w-20"
                        rounded="rounded"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-neutral-100 md:hidden">
        {rowList.map((_, rIdx) => (
          <div key={rIdx} className="p-3.5 space-y-2.5">
            <div className="flex gap-3">
              {hasThumbnail && (
                <Skeleton
                  variant={shimmerVariant}
                  className="w-14 h-14 shrink-0"
                  rounded="rounded-xl"
                />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton
                    variant={shimmerVariant}
                    className="h-4 w-14"
                    rounded="rounded-full"
                  />
                  <Skeleton
                    variant={shimmerVariant}
                    className="h-4 w-12"
                    rounded="rounded-full"
                  />
                </div>
                <Skeleton
                  variant={shimmerVariant}
                  className="h-4 w-full"
                  rounded="rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
              <Skeleton
                variant={shimmerVariant}
                className="h-3 w-20"
                rounded="rounded"
              />
              <div className="flex items-center gap-1.5">
                <Skeleton
                  variant={shimmerVariant}
                  className="h-7 w-14"
                  rounded="rounded-lg"
                />
                <Skeleton
                  variant={shimmerVariant}
                  className="h-7 w-12"
                  rounded="rounded-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
