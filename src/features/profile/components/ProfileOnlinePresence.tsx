// ─── ProfileOnlinePresence — Website, Instagram, Facebook links ──────────────

import React from "react";
import { Globe, Instagram, Facebook, ExternalLink } from "lucide-react";
import SectionCard from "./ui/SectionCard";
import type { NormalisedShop } from "../types";

interface ProfileOnlinePresenceProps {
  shop: NormalisedShop;
}

const ProfileOnlinePresence: React.FC<ProfileOnlinePresenceProps> = ({
  shop,
}) => {
  const { website, instagram, facebook } = shop;

  return (
    <SectionCard
      title="Online Presence"
      subtitle="Website & social media"
      icon={<Globe size={16} className="text-purple-600" />}
      iconBg="bg-purple-50"
    >
      <div className="space-y-2.5">

        {/* Website */}
        <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
              <Globe size={13} className="text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                Website
              </p>
              <p className="text-xs font-semibold text-blue-600 truncate max-w-[150px]">
                {website || "Not set"}
              </p>
            </div>
          </div>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors shrink-0"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Instagram */}
        <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-pink-50 to-purple-50/60 rounded-xl border border-pink-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-pink-200">
            <Instagram size={13} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Instagram
            </p>
            <p className="text-xs font-semibold text-pink-700 truncate">
              {instagram || "Not linked"}
            </p>
          </div>
          {instagram && (
            <a
              href={`https://instagram.com/${instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors shrink-0"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Facebook */}
        <div className="flex items-center gap-2.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
            <Facebook size={13} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Facebook
            </p>
            <p className="text-xs font-semibold text-blue-700 truncate">
              {facebook || "Not linked"}
            </p>
          </div>
          {facebook && (
            <a
              href={`https://${facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors shrink-0"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default ProfileOnlinePresence;
