import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { authApi } from "@/services/api/auth";

/**
 * AuthCallback – landed on after the backend's /auth/callback redirects here.
 *
 * This page handles two potential flows:
 * 1. The URL has `token_id`, which must be exchanged for JWTs via the API.
 * 2. The URL directly contains `access_token` and `refresh_token` (legacy flow).
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const handleAuth = async () => {
      let accessToken = searchParams.get("access_token");
      let refreshToken = searchParams.get("refresh_token");
      const tokenId = searchParams.get("token_id");

      if (tokenId) {
        try {
          // Exchange token_id for JWTs
          const response = await authApi.callback(tokenId);
          accessToken = response.access_token || response.data?.access_token;
          refreshToken = response.refresh_token || response.data?.refresh_token;
        } catch (error) {
          console.error("Token exchange failed", error);
          setStatus("error");
          setMessage("Authentication failed during token exchange.");
          showToast("Authentication failed. Please try again.", "error");
          setTimeout(() => navigate("/login"), 2500);
          return;
        }
      }

      if (!accessToken) {
        setStatus("error");
        setMessage("Authentication failed — no token received.");
        showToast("Authentication failed. Please try again.", "error");
        setTimeout(() => navigate("/login"), 2500);
        return;
      }

      // Store tokens
      localStorage.setItem("auth_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      // Decode JWT payload to extract user_id ("sub" claim)
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const userId = payload.sub || payload.user_id;
        if (userId) localStorage.setItem("user_id", userId);
      } catch (e) {
        console.warn("Could not decode JWT payload:", e);
      }

      // Clean the tokens from the URL so they aren't in browser history
      window.history.replaceState({}, "", "/auth/callback");

      setStatus("success");
      setMessage("Signed in successfully!");
      showToast("Welcome! Choose a shop to continue.", "success");
      setTimeout(() => navigate("/shop-select"), 800);
    };

    handleAuth();
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans text-white">
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <h2 className="text-xl font-bold tracking-tight text-slate-200">{message}</h2>
            <p className="text-sm text-slate-500">Please wait…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-slate-200">{message}</h2>
            <p className="text-sm text-slate-500">Redirecting you now…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400" />
            <h2 className="text-xl font-bold tracking-tight text-slate-200">{message}</h2>
            <p className="text-sm text-slate-500">Taking you back to login…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
