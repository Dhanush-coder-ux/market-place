import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/context/ToastContext";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get("token");

      if (!token) {
        showToast("Authentication failed. No token provided.", "error");
        navigate("/login");
        return;
      }

      try {
        // Save the JWT token to localStorage for subsequent API requests
        localStorage.setItem("auth_token", token);
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.user_id) {
            localStorage.setItem("user_id", payload.user_id);
          }
          if (payload.shop_id) {
            localStorage.setItem("shop_id", payload.shop_id);
          }
        } catch (e) {
          console.error("Failed to parse token payload:", e);
        }

        setStatus("Authentication successful! Redirecting...");
        showToast("Successfully signed in", "success");

        // Redirect to shop selection page
        navigate("/shop-select");
      } catch (error) {
        console.error("Auth callback error:", error);
        showToast("Authentication failed. Please try again.", "error");
        navigate("/login");
      }
    };

    handleAuth();
  }, [searchParams, navigate, showToast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <h2 className="text-xl font-bold tracking-tight text-slate-300">{status}</h2>
      </div>
    </div>
  );
};

export default AuthCallback;
