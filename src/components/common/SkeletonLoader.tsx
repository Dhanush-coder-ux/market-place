import { FC } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SkeletonVariant = "form" | "list" | "card" | "table" | "detail" | "detail-full";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  rows?: number;
  cols?: number;
  showStats?: boolean;
  className?: string;
}

// ─── Primitive Skeleton Block ─────────────────────────────────────────────────

export const Bone: FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] rounded-lg ${className}`}
    aria-hidden="true"
  />
);

// ─── Reusable sub-components ──────────────────────────────────────────────────

/** Mimics the standard app toolbar: search bar + action buttons */
export const ToolbarSkeleton: FC<{ buttons?: number }> = ({ buttons = 2 }) => (
  <div className="flex items-center gap-3 mb-3">
    <Bone className="h-9 w-5 rounded" />        {/* checkbox */}
    <Bone className="h-9 flex-1 max-w-xs" />     {/* search */}
    <div className="flex items-center gap-2 ml-auto">
      {Array.from({ length: buttons }).map((_, i) => (
        <Bone key={i} className="h-9 w-28 rounded-lg" />
      ))}
    </div>
  </div>
);

/** Mimics the sticky-action table used throughout the app */
export const TableSkeleton: FC<{ rows?: number; cols?: number }> = ({ rows = 7, cols = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    {/* Table header */}
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
      <Bone className="w-4 h-4 rounded" />
      {Array.from({ length: cols }).map((_, i) => (
        <Bone key={i} className={`h-3 rounded ${i === 0 ? "w-32" : "flex-1"}`} />
      ))}
      <Bone className="w-16 h-3 rounded ml-auto" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0"
        style={{ opacity: 1 - i * 0.07 }}
      >
        <Bone className="w-4 h-4 rounded shrink-0" />
        {Array.from({ length: cols }).map((_, j) => (
          <Bone key={j} className={`h-4 rounded ${j === 0 ? "w-32" : "flex-1"}`} />
        ))}
        <Bone className="w-16 h-7 rounded-lg ml-auto" />
      </div>
    ))}
  </div>
);

/** Stats strip used at the top of list pages */
export const StatsSkeleton: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="flex gap-3 mb-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-1 bg-white rounded-xl border border-slate-100 p-3 space-y-2 shadow-sm">
        <Bone className="h-3 w-20" />
        <Bone className="h-6 w-24" />
      </div>
    ))}
  </div>
);

/** Profile header card used in all detail pages */
export const DetailHeaderSkeleton: FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 mb-3">
    <Bone className="w-14 h-14 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2.5">
      <Bone className="h-5 w-52" />
      <Bone className="h-3.5 w-72" />
      <div className="flex gap-2 pt-1">
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-6 w-16 rounded-full" />
      </div>
    </div>
    <div className="flex gap-2 shrink-0">
      <Bone className="w-8 h-8 rounded-lg" />
      <Bone className="w-8 h-8 rounded-lg" />
    </div>
  </div>
);

/** Tab bar */
export const TabsSkeleton: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit mb-3">
    {Array.from({ length: count }).map((_, i) => (
      <Bone key={i} className={`h-7 rounded-md ${i === 0 ? "w-24 bg-blue-200" : "w-20"}`} />
    ))}
  </div>
);

/** Stats row for detail pages */
export const DetailStatsSkeleton: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="flex flex-wrap gap-3 mb-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-1 min-w-[130px] bg-white rounded-xl border border-slate-100 p-3 space-y-2 shadow-sm">
        <Bone className="h-3 w-20" />
        <Bone className="h-6 w-24" />
      </div>
    ))}
  </div>
);

/** Two-column detail content: main card + sidebar */
export const DetailContentSkeleton: FC = () => (
  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
    <div className="xl:col-span-3 space-y-4">
      {/* Main info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-2.5">
          <Bone className="w-8 h-8 rounded-lg" />
          <Bone className="h-3 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-7 w-32 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      {/* Pricing card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Bone className="w-8 h-8 rounded-lg" />
          <Bone className="h-3 w-36" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Sidebar */}
    <div className="xl:col-span-1 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-0">
        <div className="flex items-center gap-2.5 mb-4">
          <Bone className="w-8 h-8 rounded-lg" />
          <Bone className="h-3 w-28" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Composed page-level skeletons ────────────────────────────────────────────

const FormSkeleton = () => (
  <div className="space-y-6 p-4">
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-lg" />
        <div className="space-y-1.5">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-56" />
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3 w-24" />
            <Bone className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="w-9 h-9 rounded-lg" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-32" />
          </div>
        </div>
        <Bone className="h-9 w-24 rounded-lg" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Bone className="w-7 h-7 rounded-lg" />
              <Bone className="h-10 flex-1" />
              <Bone className="h-8 w-8 rounded-lg" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Bone key={j} className="h-10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Full list page skeleton: toolbar + stats + table */
const ListPageSkeleton: FC<{ rows?: number; cols?: number; showStats?: boolean }> = ({
  rows = 8,
  cols = 5,
  showStats = false,
}) => (
  <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-300">
    <ToolbarSkeleton buttons={2} />
    {showStats && <StatsSkeleton />}
    <div className="flex-1 overflow-hidden">
      <TableSkeleton rows={rows} cols={cols} />
    </div>
  </div>
);

/** Full detail page skeleton: header + tabs + stats + content */
const DetailPageSkeleton: FC = () => (
  <div className="flex flex-col h-full space-y-0 animate-in fade-in duration-300">
    <DetailHeaderSkeleton />
    <TabsSkeleton count={4} />
    <DetailStatsSkeleton count={4} />
    <DetailContentSkeleton />
  </div>
);

const CardSkeleton: FC<{ rows: number }> = ({ rows }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="space-y-1.5">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-full" />
            </div>
          ))}
        </div>
        <Bone className="h-9 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Reusable skeleton loader for all page types.
 *
 * @example
 * <SkeletonLoader variant="form" />
 * <SkeletonLoader variant="list" rows={8} />
 * <SkeletonLoader variant="table" rows={10} />
 * <SkeletonLoader variant="detail" />
 * <SkeletonLoader variant="detail-full" />
 */
const SkeletonLoader: FC<SkeletonLoaderProps> = ({
  variant = "list",
  rows = 7,
  cols = 5,
  showStats = false,
  className = "",
}) => {
  return (
    <div
      className={`w-full ${className}`}
      role="status"
      aria-label="Loading content..."
    >
      {variant === "form"        && <FormSkeleton />}
      {variant === "list"        && <ListPageSkeleton rows={rows} cols={cols} showStats={showStats} />}
      {variant === "table"       && <TableSkeleton rows={rows} cols={cols} />}
      {variant === "card"        && <CardSkeleton rows={rows} />}
      {variant === "detail"      && <DetailPageSkeleton />}
      {variant === "detail-full" && <DetailPageSkeleton />}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default SkeletonLoader;
