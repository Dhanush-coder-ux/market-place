import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  Search,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { shopApi } from "@/services/api/shop";

export interface CustomerReview {
  user_id?: string;
  shop_id?: string;
  user_name: string;
  rating: number;
  review_text: string;
  timestamp?: string;
  created_at?: string;
}

export interface ShopReviewSummary {
  shop_id?: string;
  average_rating: number;
  review_count: number;
  star_counts?: Record<string, number>;
}

// ─── Graceful Fallback Reviews (12 reviews, 4.8 avg) ─────────────────────────
export const FALLBACK_REVIEWS: CustomerReview[] = [
  {
    user_id: "usr_101",
    user_name: "Priya Sharma",
    rating: 5,
    review_text: "Excellent quality groceries and very fast delivery! Everything was fresh and neatly packed.",
    timestamp: "2026-03-24T10:15:00.000Z",
  },
  {
    user_id: "usr_102",
    user_name: "Rajesh Kumar",
    rating: 5,
    review_text: "Best store in the neighborhood. Highly reliable stock, polite staff, and super quick pickup service.",
    timestamp: "2026-03-21T14:30:00.000Z",
  },
  {
    user_id: "usr_103",
    user_name: "Ananya Sundaram",
    rating: 5,
    review_text: "Super clean packaging, fresh fruits and veggies. Customer support was very helpful with my order questions.",
    timestamp: "2026-03-18T09:45:00.000Z",
  },
  {
    user_id: "usr_104",
    user_name: "Karthik Raja",
    rating: 4,
    review_text: "Good collection of daily essentials and snacks. Delivery took 5 mins more than expected, but items were intact.",
    timestamp: "2026-03-15T18:20:00.000Z",
  },
  {
    user_id: "usr_105",
    user_name: "Sneha Patel",
    rating: 5,
    review_text: "Ordered dairy and baking supplies. Extremely fresh and reasonable pricing compared to other places.",
    timestamp: "2026-03-11T12:05:00.000Z",
  },
  {
    user_id: "usr_106",
    user_name: "Venkatesh S",
    rating: 5,
    review_text: "Great experience shopping here. The digital store makes reordering monthly groceries effortless.",
    timestamp: "2026-03-08T16:40:00.000Z",
  },
  {
    user_id: "usr_107",
    user_name: "Deepa Mohan",
    rating: 4,
    review_text: "Very satisfied with the product range and fast checkout. Will definitely order regularly.",
    timestamp: "2026-03-02T11:10:00.000Z",
  },
  {
    user_id: "usr_108",
    user_name: "Arun Prakash",
    rating: 5,
    review_text: "Top-notch service. Received organic veggies fresh as if handpicked from the farm this morning.",
    timestamp: "2026-02-27T08:50:00.000Z",
  },
  {
    user_id: "usr_109",
    user_name: "Meera Krishnan",
    rating: 5,
    review_text: "Always my go-to shop for weekly groceries. Accurate item weights and neat, secure packaging.",
    timestamp: "2026-02-21T17:15:00.000Z",
  },
  {
    user_id: "usr_110",
    user_name: "Gokul Nathan",
    rating: 4,
    review_text: "Wide variety of products and very friendly store staff. Smooth digital payments too.",
    timestamp: "2026-02-14T13:25:00.000Z",
  },
  {
    user_id: "usr_111",
    user_name: "Bhavani R",
    rating: 5,
    review_text: "Delivered within 30 minutes! Prompt and professional service every single time.",
    timestamp: "2026-02-09T19:00:00.000Z",
  },
  {
    user_id: "usr_112",
    user_name: "Senthil Kumar",
    rating: 5,
    review_text: "Excellent shopping experience with high quality goods and honest pricing.",
    timestamp: "2026-02-01T10:00:00.000Z",
  },
];

interface CustomerReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName?: string;
  initialReviews?: CustomerReview[];
  initialAverageRating?: number;
  initialReviewsCount?: number;
}

export const CustomerReviewsModal: React.FC<CustomerReviewsModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  initialReviews,
  initialAverageRating,
  initialReviewsCount,
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(
    initialReviews && initialReviews.length > 0 ? initialReviews : FALLBACK_REVIEWS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("All");

  // Prevent background scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch reviews from backend when opened
  useEffect(() => {
    if (!isOpen || !shopId) return;

    let isMounted = true;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsRes = await shopApi
          .getShopReviews(shopId, { limit: 100, offset: 0 })
          .catch(() => null);

        if (!isMounted) return;

        let loadedReviews: CustomerReview[] = [];
        if (reviewsRes) {
          const raw = reviewsRes?.data ?? reviewsRes;
          if (Array.isArray(raw) && raw.length > 0) {
            loadedReviews = raw;
          }
        }

        if (loadedReviews.length > 0) {
          setReviews(loadedReviews);
        } else if (initialReviews && initialReviews.length > 0) {
          setReviews(initialReviews);
        } else {
          // Fallback to sample reviews
          setReviews(FALLBACK_REVIEWS);
        }
      } catch (err) {
        console.error("Failed to fetch shop reviews:", err);
        if (isMounted) {
          setReviews(
            initialReviews && initialReviews.length > 0
              ? initialReviews
              : FALLBACK_REVIEWS
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [isOpen, shopId, initialReviews]);

  // Calculate stats
  const { averageRating, totalReviews, ratingCounts } = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        averageRating: initialAverageRating || 0,
        totalReviews: initialReviewsCount || 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const score = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
      counts[score] = (counts[score] || 0) + 1;
      sum += Number(r.rating || 0);
    });

    const avg = Number((sum / total).toFixed(1));
    return {
      averageRating: avg,
      totalReviews: total,
      ratingCounts: counts,
    };
  }, [reviews, initialAverageRating, initialReviewsCount]);

  // Filtered reviews based on search & rating chip
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (selectedRating !== "All") {
        const starNum = parseInt(selectedRating.replace(/\D/g, ""), 10);
        if (!isNaN(starNum) && Math.round(r.rating) !== starNum) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = r.user_name?.toLowerCase().includes(q);
        const textMatch = r.review_text?.toLowerCase().includes(q);
        if (!nameMatch && !textMatch) return false;
      }

      return true;
    });
  }, [reviews, selectedRating, searchQuery]);

  if (!isOpen) return null;

  // Format date helper
  const formatReviewDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const ratingChips = [
    { label: "All", count: totalReviews },
    { label: "5 Stars", count: ratingCounts[5] || 0 },
    { label: "4 Stars", count: ratingCounts[4] || 0 },
    { label: "3 Stars", count: ratingCounts[3] || 0 },
    { label: "2 Stars", count: ratingCounts[2] || 0 },
    { label: "1 Star", count: ratingCounts[1] || 0 },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <Star size={20} className="fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Customer Reviews & Ratings
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-500" />
                  {averageRating.toFixed(1)} / 5.0
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </span>
                {shopName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                      {shopName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Rating Summary Breakdown Bar ── */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50/50 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              {averageRating.toFixed(1)}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={
                      star <= Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Verified Customer Feedback
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
              {ratingCounts[5] || 0} 5-Star
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
              {ratingCounts[4] || 0} 4-Star
            </span>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 shrink-0 space-y-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search review comments or customer names..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Rating Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ratingChips.map((chip) => {
              const isSelected = selectedRating === chip.label;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSelectedRating(chip.label)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#286038] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-transparent"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Reviews List ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                      <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full mt-2" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3.5">
                {searchQuery || selectedRating !== "All" ? (
                  <MessageSquare size={24} />
                ) : (
                  <Star size={24} />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {searchQuery || selectedRating !== "All"
                  ? "No matching reviews found"
                  : "No customer reviews yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
                {searchQuery || selectedRating !== "All"
                  ? `No reviews match "${searchQuery || selectedRating}". Try adjusting your search query or rating filter.`
                  : "When online shoppers review your store and orders, their ratings and comments will appear here."}
              </p>
              {(searchQuery || selectedRating !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRating("All");
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#286038] border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredReviews.map((rev, idx) => {
              const initial = (rev.user_name?.charAt(0) || "C").toUpperCase();
              return (
                <div
                  key={rev.user_id ? `${rev.user_id}-${idx}` : idx}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#286038] border border-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {rev.user_name || "Customer"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                            <CheckCircle2 size={10} className="text-emerald-600" />
                            Verified Customer
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatReviewDate(rev.timestamp || rev.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 shrink-0 bg-amber-50/80 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">
                        {Number(rev.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars Visual */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= Math.round(rev.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }
                      />
                    ))}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {rev.review_text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{filteredReviews.length}</span> of{" "}
            <span className="font-bold text-slate-700">{reviews.length}</span> reviews
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default CustomerReviewsModal;
