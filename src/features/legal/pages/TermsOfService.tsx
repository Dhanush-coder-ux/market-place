import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

const TermsOfService = () => {
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
            <FileText size={13} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Effective Date: January 1, 2026 | Last Updated: September 2026
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service govern your access to and use of RetailerPro, a comprehensive business management platform operated by Antaris Software Private Limited ("Antaris", "we", "us"). By creating an account, onboarding a shop, or using the service, you agree to be bound by these terms. If you are accepting on behalf of a business entity, you confirm you are authorized to bind that entity.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">2. Description of the Platform</h2>
            <p>
              RetailerPro provides cloud-native tools for retail store management, including high-speed counter billing and POS invoicing, barcode catalog management, multi-branch inventory tracking, supplier ledgers, customer credit management, analytics reporting, and self-hosted digital storefronts.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">3. 0% Commission Policy</h2>
            <p>
              RetailerPro operates on a zero-commission model for independent retailer transactions. You receive 100% of order values from your customer sales without hidden percentage cutoffs or listing fees. Any optional third-party payment gateway processing fees or delivery logistics are settled directly and transparently.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">4. Account Security & User Obligations</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>You must provide accurate, current registration details during shop onboarding and staff user invitations.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>You are responsible for safeguarding your credentials, OTP devices, and granting role permissions to authorized employees only.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>You agree to promptly notify Antaris support of any suspected security incident or unauthorized access to your store database.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">5. Billing, Invoicing & GST Compliance</h2>
            <p>
              Merchants are solely responsible for ensuring accurate product pricing, applicable tax rates (GST / HSN codes), and statutory compliance for commercial invoices generated using the platform.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">6. Data Ownership & Availability</h2>
            <p>
              You retain 100% ownership of your business data, product records, and customer lists. You can export complete sales histories and ledger reports at any time. Scheduled maintenance will be announced in advance, with continuous high availability guaranteed by redundant cloud failover clustering.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>© 2026 Antaris Software Pvt Ltd. All rights reserved.</span>
            <div className="flex items-center gap-4 font-semibold">
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              <Link to="/security" className="text-blue-600 hover:underline">Security</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
