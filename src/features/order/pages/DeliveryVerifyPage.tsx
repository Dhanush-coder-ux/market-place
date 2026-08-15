import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Truck, ShieldCheck, AlertTriangle, Loader2, Package } from "lucide-react";
import { orderApi } from "@/services/api/order";

const DeliveryVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const shopId = searchParams.get("shop_id") || "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
    if (codeValue.length < 6 || !orderId || !shopId) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await orderApi.verifyDelivery({ shop_id: shopId, order_id: orderId, code: codeValue });
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.response?.data?.detail || e?.message || "Invalid or expired code. Please try again.");
    }
  };

  if (!orderId || !shopId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-lg font-black text-slate-800 mb-2">Invalid Link</h1>
          <p className="text-sm text-slate-500 font-medium">This delivery verification link is invalid or expired. Please request a new link from the delivery person.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Brand / icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/10">
            <Package className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Delivery Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {status === "success" ? (
            /* Success State */
            <div className="px-8 py-10 flex flex-col items-center gap-4 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 mb-2">Delivered! 🎉</h2>
                <p className="text-sm text-slate-500 font-medium">Your delivery has been successfully confirmed. Thank you!</p>
              </div>
              <div className="w-full mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <p className="text-emerald-700 font-semibold text-sm">Order status updated to <span className="font-black">DELIVERED</span></p>
              </div>
            </div>
          ) : (
            /* Verify Form */
            <>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Confirm Your Delivery</p>
                    <p className="text-[10px] text-amber-600/70 font-medium">Order ID: {orderId.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-7 space-y-6">
                <div className="text-center">
                  <h1 className="text-lg font-black text-slate-800 mb-1">Enter Delivery Code</h1>
                  <p className="text-xs text-slate-500 font-medium">Enter the 6-digit code provided by the delivery person</p>
                </div>

                {/* OTP Boxes */}
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
                      className={`w-11 text-center text-xl font-black rounded-xl border-2 outline-none transition-all duration-200 focus:scale-110
                        ${status === "error"
                          ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400"
                          : d
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm shadow-amber-100"
                            : "border-slate-200 bg-slate-50 text-slate-800 focus:border-amber-400 focus:bg-amber-50/50"
                        }`}
                      style={{ height: "56px" }}
                    />
                  ))}
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleVerify}
                  disabled={codeValue.length < 6 || status === "loading"}
                  className="w-full h-13 flex items-center justify-center gap-2 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200
                    bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-300 active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{ height: "48px" }}
                >
                  {status === "loading" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Verify Delivery</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/50 text-[10px] font-medium mt-6">Powered by Hyperlocal · Secure Delivery Verification</p>
      </div>
    </div>
  );
};

export default DeliveryVerifyPage;
