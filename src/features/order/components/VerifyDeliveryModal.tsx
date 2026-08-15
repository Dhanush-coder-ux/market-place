import { useState, useRef, useEffect } from "react";
import { Truck, X, Copy, Check, Share2, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { orderApi } from "@/services/api/order";
import { SHOP_ID } from "@/services/endpoints";

interface VerifyDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  billNo: string;
  customerName: string;
  onVerified: () => void;
}

export const VerifyDeliveryModal: React.FC<VerifyDeliveryModalProps> = ({
  isOpen,
  onClose,
  orderId,
  billNo,
  customerName,
  onVerified,
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setStatus("idle");
      setErrorMsg("");
      setCopied(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const codeValue = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setStatus("idle");
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleVerify = async () => {
    if (codeValue.length < 6) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await orderApi.verifyDelivery({ shop_id: SHOP_ID, order_id: orderId, code: codeValue });
      setStatus("success");
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1800);
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.response?.data?.detail || e?.message || "Invalid or expired code.");
    }
  };

  const shareUrl = `${window.location.origin}/verify-delivery?order_id=${orderId}&shop_id=${SHOP_ID}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Verify Delivery</p>
                <h2 className="text-white text-base font-black">#{billNo}</h2>
                <p className="text-white/80 text-xs font-medium mt-0.5">{customerName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-slate-800">Delivery Confirmed!</p>
                <p className="text-sm text-slate-500 font-medium mt-1">Order marked as <span className="text-emerald-600 font-bold">Delivered</span></p>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Enter 6-digit OTP</p>
                <p className="text-xs text-slate-500 font-medium">Ask the customer for their delivery code, or share the link for them to verify.</p>
              </div>

              {/* OTP Input */}
              <div className="flex items-center gap-2 justify-center" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-11 text-center text-lg font-black rounded-xl border-2 outline-none transition-all duration-200 focus:scale-105
                      ${status === "error"
                        ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400"
                        : d
                          ? "border-amber-400 bg-amber-50 text-amber-700 focus:border-amber-500"
                          : "border-slate-200 bg-slate-50 text-slate-800 focus:border-amber-400 focus:bg-amber-50/50"
                      }`}
                    style={{ height: "52px" }}
                  />
                ))}
              </div>

              {/* Error */}
              {status === "error" && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
                </div>
              )}

              {/* Share Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer Verify Link</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-mono truncate flex-1">{shareUrl}</p>
                  <button
                    onClick={handleCopyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200
                      ${copied
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                      }`}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleVerify}
                disabled={codeValue.length < 6 || status === "loading"}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200
                  bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-100 hover:from-amber-600 hover:to-orange-600
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Confirm Delivery</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyDeliveryModal;
