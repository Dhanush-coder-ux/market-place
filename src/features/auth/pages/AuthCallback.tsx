import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/services/api/auth";

/**
 * AuthCallback – handles token exchange with skeleton loading state
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      let accessToken = searchParams.get("access_token");
      let refreshToken = searchParams.get("refresh_token");
      const tokenId = searchParams.get("token_id");

      if (tokenId) {
        try {
          const response = await authApi.callback(tokenId);
          accessToken = response.access_token || response.data?.access_token;
          refreshToken = response.refresh_token || response.data?.refresh_token;
        } catch (error) {
          console.error("Token exchange failed", error);
          if (isMounted) {
            setStatus("error");
            showToast("Authentication failed. Please try again.", "error");
            setTimeout(() => navigate("/login"), 1500);
          }
          return;
        }
      }

      if (!accessToken) {
        if (isMounted) {
          setStatus("error");
          showToast("Authentication failed — no token received.", "error");
          setTimeout(() => navigate("/login"), 1500);
        }
        return;
      }

      // Store tokens
      localStorage.setItem("auth_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      // Decode JWT payload
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const userId = payload.sub || payload.user_id;
        if (userId) localStorage.setItem("user_id", userId);
        if (payload.email) localStorage.setItem("user_email", payload.email);
        const name = payload.entity_name || payload.name || payload.user_name || (payload.email ? payload.email.split("@")[0] : "");
        if (name) localStorage.setItem("user_name", name);
      } catch (e) {
        console.warn("Could not decode JWT payload:", e);
      }

      window.history.replaceState({}, "", "/auth/callback");

      if (isMounted) {
        showToast("Welcome back!", "success");
        navigate("/shop-select", { replace: true });
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Top Navbar Skeleton */}
      <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="h-9 w-64 bg-slate-100 border border-slate-200/60 rounded-xl animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </header>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="w-full h-36 md:h-44 rounded-3xl bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>

        {/* Section Title Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-200/60 rounded-md" />
          </div>
          <div className="h-9 w-28 bg-slate-200 rounded-xl hidden sm:block" />
        </div>

        {/* Grid Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden"
            >
              <div className="w-full h-32 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="pt-2 flex items-center justify-between">
                <div className="h-5 w-16 bg-slate-200 rounded-md" />
                <div className="h-8 w-20 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AuthCallback;
