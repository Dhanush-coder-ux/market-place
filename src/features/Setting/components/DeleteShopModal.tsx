import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  X,
  Mail,
  ShieldAlert,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { shopApi } from "@/services/api/shop";
import { useToast } from "@/context/ToastContext";

interface DeleteShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
}

export const DeleteShopModal: React.FC<DeleteShopModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
}) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Modal steps: 1 = Warning & Reason, 2 = OTP Input, 3 = Success Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown when on step 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Reset state on modal open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReason("");
      setOtp("");
      setLoading(false);
      setResendTimer(60);
      setCanResend(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1 -> Request OTP
  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const res = await shopApi.requestShopDeletion(shopId);
      const data = res?.data ?? res;
      const email = data?.masked_email || "your registered owner email";
      setMaskedEmail(email);
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
      showToast(`Verification code sent to ${email}`, "success");
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.msg || err?.message || "Failed to send verification code";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      const res = await shopApi.requestShopDeletion(shopId);
      const data = res?.data ?? res;
      const email = data?.masked_email || maskedEmail;
      setMaskedEmail(email);
      setResendTimer(60);
      setCanResend(false);
      showToast(`New verification code sent to ${email}`, "success");
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.msg || err?.message || "Failed to resend verification code";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Confirm Deletion with OTP
  const handleConfirmDeletion = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      showToast("Please enter the complete 6-digit verification code", "error");
      return;
    }

    setLoading(true);
    try {
      await shopApi.confirmShopDeletion(shopId, {
        otp: otp.trim(),
        reason: reason.trim() || "Owner requested shop deletion",
      });

      setStep(3);
      showToast("Shop successfully soft-deleted", "success");

      // Clear local shop session cache
      const storedShopId = localStorage.getItem("shop_id");
      if (storedShopId === shopId) {
        localStorage.removeItem("shop_id");
        localStorage.removeItem("shop_name");
        localStorage.removeItem("shop_logo");
        localStorage.removeItem("selected_shop_name");
      }

      // Automatically redirect after 1.5 seconds
      setTimeout(() => {
        window.location.href = "/shop-select";
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail?.msg ||
        err?.response?.data?.detail ||
        err?.message ||
        "Invalid or expired verification code";
      showToast(typeof msg === "string" ? msg : "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Accent Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-50 via-rose-50/50 to-white border-b border-rose-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {step === 1 && "Delete Shop & Decommission Storefront"}
                {step === 2 && "Authorize Shop Deletion"}
                {step === 3 && "Shop Successfully Decommissioned"}
              </h2>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {shopName} ({shopId})
              </span>
            </div>
          </div>
          {step !== 3 && (
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* STEP 1: Warning & Explanation */}
          {step === 1 && (
            <>
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle size={16} />
                  <span>Important: This action is destructive</span>
                </div>
                <p className="leading-relaxed">
                  Soft deleting this shop will immediately:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-rose-800/90 text-xs leading-normal">
                  <li>Take your digital store, marketplace catalog, and ordering links offline.</li>
                  <li>Lock Point of Sale (POS) terminals and revoke all staff access.</li>
                  <li>Cancel active recurring SaaS subscription plans and add-on billing.</li>
                  <li>
                    Initiate a <strong>180-day statutory log preservation escrow</strong> under Rule 3(1)(h) of the Indian IT Rules, 2021 before permanent cryptographic erasure.
                  </li>
                </ul>
              </div>

              {/* Deletion Reason Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for Deletion <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">Select a primary reason...</option>
                  <option value="Closing physical retail store">Closing physical retail store</option>
                  <option value="Switching to another system">Switching to another system</option>
                  <option value="Consolidating into another branch">Consolidating into another branch</option>
                  <option value="Test / demonstration store">Test / demonstration store</option>
                  <option value="Other business reasons">Other business reasons</option>
                </select>
              </div>

              {/* Link to Deletion Policy */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Lock size={13} className="text-slate-400" />
                  <span>Governed by DPDP Act 2023 &amp; IT Rules 2021</span>
                </div>
                <Link
                  to="/deletion-policy"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  <span>Read Deletion Policy</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending Code...</span>
                  ) : (
                    <>
                      <span>Send OTP to Owner Email</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800 text-xs sm:text-sm">
                  <Mail size={16} />
                  <span>Enter 6-Digit Owner Verification Code</span>
                </div>
                <p className="leading-relaxed">
                  We dispatched a verification code to <strong className="font-mono text-slate-900">{maskedEmail}</strong>.
                  Please check your inbox (and spam folder) and enter the 6-digit code below to confirm deletion.
                </p>
              </div>

              {/* OTP Input Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 text-center text-2xl font-mono font-black tracking-[0.4em] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50/50 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span>Code valid for 10 minutes</span>
                  </span>

                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Resend Code</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Resend in <strong className="font-mono text-slate-600">{resendTimer}s</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletion}
                  disabled={loading || otp.length < 6}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <span>Confirm &amp; Soft-Delete Shop</span>
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Shop Successfully Deleted
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your shop <strong>{shopName}</strong> has been soft-deleted and unpublished from all channels.
                  Audit logs and mandatory tax records have entered the 180-day statutory escrow before final purge.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 max-w-sm mx-auto">
                Redirecting to store selection in a few seconds...
              </div>

              <button
                type="button"
                onClick={() => navigate("/shop-select")}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Go to Store Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
