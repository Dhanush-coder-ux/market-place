// ─── Profile Page — Orchestrator ─────────────────────────────────────────────
//
//  Responsibilities:
//    1. Fetch raw shop data from the API
//    2. Normalise it into a typed NormalisedShop object
//    3. Manage lightweight UI state (showOnApp)
//    4. Compose section components into the page layout
//
//  No visual code lives here — all UI is delegated to /components.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCheck2, Edit3, LogOut } from "lucide-react";

import Title from "@/components/common/Title";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

import { normaliseShop, type NormalisedShop } from "../types";
import {
  ProfileHero,
  ProfileAbout,
  ProfileContact,
  ProfileBusinessHours,
  ProfileOnlinePresence,
  ProfileQuickActions,
} from "../components";

// ─── Component ───────────────────────────────────────────────────────────────

const Profile = () => {
  const { getData, loading } = useApi();
  const [shop, setShop] = useState<NormalisedShop | null>(null);
  const [showOnApp, setShowOnApp] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  useEffect(() => {
    getData(ENDPOINTS.SHOPS + "/by/" + SHOP_ID).then((res) => {
      if (!res) return;
      const raw = Array.isArray(res.data) ? res.data[0] : res.data;
      if (raw) setShop(normaliseShop(raw.datas ?? raw));
    });
  }, []);

  // ── Loading skeleton ──
  if (loading && !shop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  // ── Fallback: nothing returned yet ──
  const data = shop ?? normaliseShop({});

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-24 md:pb-8">

      {/* Page Title */}
      <Title
        icon={<UserCheck2 size={20} />}
        title="Shop Profile"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/profile/add"
              className="h-9 inline-flex items-center gap-2 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Edit3 size={14} />
              Edit Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 inline-flex items-center gap-2 px-4 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        }
      />

      {/* Hero Banner */}
      <ProfileHero
        shop={data}
        showOnApp={showOnApp}
        onShowOnAppChange={setShowOnApp}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Left column (2/3): About + Contact ── */}
        <div className="md:col-span-2 space-y-5">
          <ProfileAbout shop={data} />
          <ProfileContact shop={data} />
        </div>

        {/* ── Right column (1/3): Hours + Links + Actions ── */}
        <div className="space-y-5">
          <ProfileBusinessHours shop={data} />
          <ProfileOnlinePresence shop={data} />
          <ProfileQuickActions onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
