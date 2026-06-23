// ─── ProfileHero — Dark gradient banner with shop identity & stats ───────────

import React from "react";
import {
  Store,
  MapPin,
  Tag,
  FileText,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Package,
  Star,
  Zap,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import StatPill from "./ui/StatPill";
import type { NormalisedShop } from "../types";

interface ProfileHeroProps {
  shop: NormalisedShop;
  showOnApp: boolean;
  onShowOnAppChange: (val: boolean) => void;
}

const ProfileHero: React.FC<ProfileHeroProps> = ({
  shop,
  showOnApp,
  onShowOnAppChange,
}) => {
  const { shopName, tagline, address, category, gstNumber, businessType } = shop;

  return (
    <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 rounded-2xl overflow-hidden shadow-xl">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        {/* Top Row: Logo + Identity + Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Shop Logo */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-2xl">
              <Store size={32} className="text-white/60" />
            </div>
            {/* Verification badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
              <AlertCircle size={12} className="text-slate-900" />
            </div>
          </div>

          {/* Shop Identity */}
          <div className="flex-1 min-w-0">
            {/* Name + Verified badge */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                {shopName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/15 border border-amber-400/25 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                <AlertCircle size={10} />
                Unverified
              </span>
            </div>

            {/* Tagline */}
            {tagline && (
              <p className="text-sm text-white/45 font-medium italic mb-2.5 leading-snug">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            {/* Address */}
            <div className="flex items-center gap-1.5 text-sm text-white/55 mb-3">
              <MapPin size={13} className="shrink-0 text-white/40" />
              <span className="truncate">{address}</span>
            </div>

            {/* Taxonomy badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/20 text-blue-300 text-xs font-semibold rounded-full">
                <Tag size={11} />
                {category}
              </span>
              {gstNumber !== "N/A" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 text-xs font-semibold rounded-full">
                  <FileText size={11} />
                  GST Registered
                </span>
              )}
              {businessType !== "N/A" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-400/20 text-purple-300 text-xs font-semibold rounded-full">
                  <ShieldCheck size={11} />
                  {businessType}
                </span>
              )}
            </div>
          </div>

          {/* Show on App toggle */}
          <div className="shrink-0">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <Switch
                id="show-on-app"
                checked={showOnApp}
                onCheckedChange={onShowOnAppChange}
              />
              <label
                htmlFor="show-on-app"
                className="text-xs font-semibold text-white/65 cursor-pointer whitespace-nowrap select-none"
              >
                Show on App
              </label>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            icon={<TrendingUp size={15} className="text-blue-400" />}
            label="Status"
            value="Active"
            color="bg-blue-500/10 border-blue-500/20 text-white"
          />
          <StatPill
            icon={<Package size={15} className="text-purple-400" />}
            label="Products"
            value="—"
            color="bg-purple-500/10 border-purple-500/20 text-white"
          />
          <StatPill
            icon={<Star size={15} className="text-amber-400" />}
            label="Rating"
            value="—"
            color="bg-amber-500/10 border-amber-500/20 text-white"
          />
          <StatPill
            icon={<Zap size={15} className="text-emerald-400" />}
            label="Plan"
            value="Free"
            color="bg-emerald-500/10 border-emerald-500/20 text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
