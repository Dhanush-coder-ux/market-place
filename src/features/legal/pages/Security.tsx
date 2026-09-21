import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Key, Lock, Server, Database } from "lucide-react";

const Security = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-500/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-10 h-16 flex items-center justify-between">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-black text-base shadow-sm">
              ★
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight leading-none block">
                RetailerPro
              </span>
              <span className="text-[9.5px] font-extrabold tracking-widest text-slate-400 uppercase leading-none block mt-0.5">
                FROM ANTARIS SOFTWARE
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all shadow-xs active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 sm:py-14 space-y-8">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={13} />
            <span>Enterprise Security & Reliability</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Platform Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            How RetailerPro safeguards your store data, transactions, and business continuity.
          </p>
        </div>

        {/* Security Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
              <Lock size={20} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">End-to-End Encryption</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              All communications between counter devices, mobile apps, and servers are protected with TLS 1.3 encryption. Databases and backups use AES-256 encryption at rest.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <Key size={20} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Argon2id & DAuth SSO</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Passwords use memory-hard Argon2id hashing algorithms. Sessions utilize cryptographically signed JWT tokens with device fingerprint validation.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
              <Server size={20} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">High-Availability Cloud Uptime</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Multi-region database clustering with automatic failover ensures 99.9% uptime for continuous counter billing, inventory syncing, and order processing.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs">
              <Database size={20} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Automated Daily Backups</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Point-in-time recovery and automated daily backups guarantee that your stock adjustments, invoices, and ledgers remain intact and recoverable.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2026 Antaris Software Pvt Ltd. All rights reserved.</span>
          <div className="flex items-center gap-4 font-semibold">
            <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Security;
