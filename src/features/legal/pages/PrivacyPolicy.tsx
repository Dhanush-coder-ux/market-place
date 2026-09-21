import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

const PrivacyPolicy = () => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Lock size={13} />
            <span>Privacy & Data Safeguards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Effective Date: January 1, 2026 | Last Updated: September 2026
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">1. Information We Collect</h2>
            <p>
              We collect information strictly necessary to power your store operations, secure staff logins, and process customer orders:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Account Credentials:</strong> Store owner name, phone number, email address, and authentication hashes.</li>
              <li><strong>Store & Business Records:</strong> Store name, GSTIN, catalog items, supplier ledgers, inventory balances, and billing transactions.</li>
              <li><strong>Device & Security Telemetry:</strong> IP addresses, browser agents, and login audit timestamps to prevent unauthorized access.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">2. How We Use & Safeguard Your Data</h2>
            <p>
              Your store records and customer data belong exclusively to you. We do not sell, rent, or commercialize your transactional data to advertisers or third-party marketplaces. All data is encrypted in transit using TLS 1.3 and at rest with AES-256 standards.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">3. Authentication & DAuth Infrastructure</h2>
            <p>
              Authentication is managed via DAuth SSO infrastructure with multi-factor authentication (MFA) and Argon2id password hashing. Passwords are never stored or transmitted in plain text.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">4. Your Data Ownership & Export Rights</h2>
            <p>
              You maintain complete ownership of your store inventory, transactions, and customer balances. You can export complete accounting and sales reports in standard CSV and PDF formats at any time.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>© 2026 Antaris Software Pvt Ltd. All rights reserved.</span>
            <div className="flex items-center gap-4 font-semibold">
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              <Link to="/security" className="text-blue-600 hover:underline">Security</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
