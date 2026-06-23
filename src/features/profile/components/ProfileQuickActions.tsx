// ─── ProfileQuickActions — Action shortcuts sidebar card ─────────────────────

import React from "react";
import { Link } from "react-router-dom";
import { Edit3, FileText, LogOut, Zap } from "lucide-react";
import SectionCard from "./ui/SectionCard";

interface ProfileQuickActionsProps {
  onLogout?: () => void;
}

const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({
  onLogout,
}) => (
  <SectionCard
    title="Quick Actions"
    subtitle="Manage your profile"
    icon={<Zap size={16} className="text-amber-500" />}
    iconBg="bg-amber-50"
  >
    <div className="space-y-2">
      {/* Edit Profile */}
      <Link
        to="/profile/add"
        className="group flex items-center gap-2.5 w-full px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-blue-700 text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-95"
      >
        <Edit3 size={14} className="shrink-0 group-hover:rotate-12 transition-transform duration-200" />
        Edit Profile Info
      </Link>

      {/* View Documents */}
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-95"
      >
        <FileText size={14} className="shrink-0" />
        View Documents
      </button>

      {/* Divider */}
      <div className="border-t border-slate-100 my-1" />

      {/* Sign Out */}
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 text-red-500 text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-95"
      >
        <LogOut size={14} className="shrink-0" />
        Sign Out
      </button>
    </div>
  </SectionCard>
);

export default ProfileQuickActions;
