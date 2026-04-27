import { FC } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SkeletonVariant = "form" | "list" | "card" | "table" | "detail";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  rows?: number;
  className?: string;
}

// ─── Primitive Skeleton Block ─────────────────────────────────────────────────

const Bone: FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-slate-200 rounded-lg animate-pulse ${className}`}
    aria-hidden="true"
  />
);

// ─── Variants ─────────────────────────────────────────────────────────────────

const FormSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Card header */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-xl" />
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

    {/* Items card */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-44" />
          </div>
        </div>
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Bone className="w-7 h-7 rounded-lg" />
              <Bone className="h-10 flex-1" />
              <Bone className="h-8 w-8 rounded-lg" />
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

const ListSkeleton: FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-3">
    {/* Search/filter bar */}
    <div className="flex items-center gap-3 mb-4">
      <Bone className="h-10 flex-1 max-w-sm" />
      <Bone className="h-10 w-28 rounded-xl" />
    </div>
    {/* Rows */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
          <Bone className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-1/3" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

const CardSkeleton: FC<{ rows: number }> = ({ rows }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-xl shrink-0" />
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
        <Bone className="h-9 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

const TableSkeleton: FC<{ rows: number }> = ({ rows }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <Bone key={i} className="h-3 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
        {Array.from({ length: 5 }).map((_, j) => (
          <Bone key={j} className={`h-4 ${j === 0 ? "w-10 rounded-full" : "flex-1"}`} />
        ))}
      </div>
    ))}
  </div>
);

const DetailSkeleton = () => (
  <div className="space-y-5">
    {/* Hero card */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-5">
      <Bone className="w-16 h-16 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-6 w-1/3" />
        <Bone className="h-4 w-1/4" />
        <div className="flex gap-2 mt-3">
          <Bone className="h-7 w-20 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      </div>
    </div>
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          <Bone className="h-3 w-16" />
          <Bone className="h-7 w-24" />
        </div>
      ))}
    </div>
    {/* Table */}
    <TableSkeleton rows={4} />
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
 */
const SkeletonLoader: FC<SkeletonLoaderProps> = ({
  variant = "list",
  rows = 5,
  className = "",
}) => {
  return (
    <div
      className={`w-full ${className}`}
      role="status"
      aria-label="Loading content..."
    >
      {variant === "form"   && <FormSkeleton />}
      {variant === "list"   && <ListSkeleton rows={rows} />}
      {variant === "card"   && <CardSkeleton rows={rows} />}
      {variant === "table"  && <TableSkeleton rows={rows} />}
      {variant === "detail" && <DetailSkeleton />}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default SkeletonLoader;
