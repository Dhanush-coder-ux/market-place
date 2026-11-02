import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/context/ToastContext";
import {
  UserPlus,
  ArrowRight,
  Store,
  ShieldCheck,
  CheckCircle2,
  Check
} from "lucide-react";

const Signup = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const autoTriggered = useRef(false);

  const handleSSOSignup = async () => {
    setLoading(true);
    try {
      const response = await authApi.getSignupUrl();
      const url =
        response?.signup_url ||
        response?.url ||
        response?.data?.signup_url ||
        response?.data?.url ||
        response?.signin_url;

      if (typeof url === "string" && url.startsWith("http")) {
        window.location.href = url;
      } else {
        showToast("Unable to reach authentication service. Please click below to try again.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to initialize DAuth signup. Please try again.", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoTriggered.current) {
      autoTriggered.current = true;
      handleSSOSignup();
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-slate-50 text-slate-800 selection:bg-[#286038]/20">
      {/* =========================================================================
          LEFT PANEL: Showcase & Branding
          ========================================================================= */}
      <aside className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-[#103020] via-[#184227] to-[#0a1e14] p-8 sm:p-12 text-white flex-col justify-between shrink-0 relative overflow-hidden">
        {/* Subtle background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#286038]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C49850]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C49850] text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-[#C49850]/20">
              Q
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">inventQ</h1>
              <p className="text-[11px] text-[#A8C898] uppercase tracking-wider font-semibold">Retail & POS Platform</p>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-[#A8C898] backdrop-blur-sm">
              <Store size={14} className="text-[#C49850]" />
              <span>Instant Multi-Store Onboarding</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Scale your retail business with zero friction.
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              Create your account in under 30 seconds via DAuth SSO. Your secure credentials will be verified and delivered straight to your inbox.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-10 space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2 text-[#C49850] font-bold text-sm">
              <ShieldCheck size={18} />
              <span>DAuth SSO & OTP Registration</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Fast, enterprise-grade registration with email OTP verification, password generation, and encrypted profile management.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2 text-[#A8C898] font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>Automated Credentials Email</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Your account password will be securely generated and sent to your registered email for future password sign-in.
            </p>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <Check size={13} className="text-[#88B878]" /> Free 14-day full access
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <Check size={13} className="text-[#88B878]" /> No credit card required
          </span>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT PANEL: Pure DAuth Signup
          ========================================================================= */}
      <main className="flex-1 w-full min-h-screen lg:min-h-0 bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-between items-center overflow-y-auto">
        <div className="w-full max-w-[392px] my-auto space-y-6">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 pt-2 pb-1">
            <img
              src="/logo/colored.png"
              alt="inventQ"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-[24px] sm:text-[26px] font-bold text-slate-900 tracking-tight">
              Create your account
            </h2>
            <p className="text-[13px] sm:text-[13.5px] text-slate-500">
              Join merchants managing inventory and billing with inventQ.
            </p>
          </div>

          {/* Main Action Hook Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F8F4] text-[#286038] border border-[#A8C898] flex items-center justify-center font-bold shrink-0">
                <UserPlus size={19} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">DAuth Registration</h3>
                <p className="text-xs text-slate-500">Fast sign up with email/mobile OTP verification</p>
              </div>
            </div>

            <button
              onClick={handleSSOSignup}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#286038] to-[#103020] hover:from-[#103020] hover:to-[#083020] active:from-[#083020] active:to-[#083020] text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-lg shadow-[#286038]/25 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  <span>Connecting to DAuth…</span>
                </>
              ) : (
                <>
                  <span>Sign up with DAuth</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Already have an account link */}
            <div className="pt-2 border-t border-slate-200/60 text-center">
              <span className="text-xs text-slate-600">Already have an account? </span>
              <Link to="/login" className="text-xs font-bold text-[#286038] hover:underline inline-flex items-center gap-0.5">
                Sign in here &rarr;
              </Link>
            </div>

            <p className="text-[11px] text-center text-slate-400 leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-[#286038] font-semibold hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#286038] font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
