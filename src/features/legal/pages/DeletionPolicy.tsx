import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, ShieldAlert, Clock, FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";

const DeletionPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-rose-500/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-10 h-16 pt-[env(safe-area-inset-top)] flex items-center justify-between">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              ★
            </div>
            <div className="min-w-0">
              <span className="font-black text-lg text-slate-900 tracking-tight leading-none block truncate">
                inventQ
              </span>
              <span className="text-[9.5px] font-extrabold tracking-widest text-slate-400 uppercase leading-none block mt-0.5 truncate">
                FROM ANTARIS SOFTWARE
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shadow-xs active:scale-95 shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden xs:inline sm:inline">Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-14 pb-[max(24px,env(safe-area-inset-bottom))] space-y-6 sm:space-y-8">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <Trash2 size={13} />
            <span>Statutory Compliance & Data Lifecycle</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Account &amp; Shop Deletion Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Effective Date: January 1, 2026 | Compliant with Information Technology Rules, 2021 &amp; DPDP Act, 2023
          </p>
        </div>

        {/* Executive Highlights Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
              <ShieldAlert size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Soft Deletion First</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your storefront, catalog, and POS are unpublished immediately upon owner verification.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              <Clock size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">180-Day Legal Escrow</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audit logs are safeguarded for 180 days per Rule 3(1)(h) of the IT Rules 2021 before permanent purge.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Scale size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Tax &amp; GST Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Commercial tax invoices are archived to satisfy mandatory statutory retention under the CGST Act 2017.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-6 sm:space-y-8 text-sm leading-relaxed text-slate-700">
          
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-rose-600" />
              1. Purpose &amp; Statutory Scope
            </h2>
            <p>
              This Account &amp; Shop Deletion Policy outlines the technical and legal procedures governing the decommissioning, soft deletion, statutory retention, and permanent eradication of merchant shop data on the <strong>InventQ</strong> retail operating platform (operated by Antaris Software Pvt Ltd).
            </p>
            <p>
              This policy is formulated in strict compliance with applicable laws of the Republic of India:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>The Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong> — specifically Rule 3(1)(h) regarding statutory preservation of user registration records and cyber security incident logs.</li>
              <li><strong>The Digital Personal Data Protection (DPDP) Act, 2023</strong> — Section 12 governing data principals' Right to Correction and Erasure of Personal Data.</li>
              <li><strong>The Central Goods and Services Tax (CGST) Act, 2017</strong> — Section 36 mandating statutory retention of accounts, commercial tax invoices, and financial transaction records.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              2. Shop Deletion vs. User Account Deletion
            </h2>
            <p>
              On the InventQ platform, a distinction exists between a <strong>Shop/Storefront Entity</strong> and a <strong>User/Merchant Identity Account</strong>:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">Shop / Storefront Deletion:</span>
                <span className="text-xs text-slate-600">
                  Decommissions a specific retail business location, POS billing registry, catalog, and digital store. The owner's login credentials remain active, allowing them to manage their remaining stores or create a new storefront at any time.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">Full User Account Deletion:</span>
                <span className="text-xs text-slate-600">
                  Permanently deletes the merchant's global profile, revokes single-sign-on (SSO) tokens, and initiates soft deletion across all associated storefronts owned by the merchant.
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              3. Verification Safeguards: 2FA Email OTP
            </h2>
            <p>
              Shop deletion is an irreversible action that affects business operations and employees. To ensure unauthorized actors or rogue staff cannot delete a store:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Exclusive Owner Authority:</strong> Only authenticated users holding the strict <code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono text-xs">OWNER</code> role can request or authorize shop deletion. Employees and managers are barred from this action.</li>
              <li><strong>High-Entropy One-Time Password (OTP):</strong> A cryptographically randomized 6-digit OTP is generated and transmitted directly to the store owner's verified email address.</li>
              <li><strong>10-Minute Ephemeral Validity:</strong> The OTP code expires automatically after 10 minutes (600 seconds) and is consumed on first use to prevent replay attacks.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              4. Immediate Effects of Soft Deletion
            </h2>
            <p>
              Upon successful OTP verification, the system executes an immediate <strong>Soft Delete</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong>Digital Storefront Unpublishing:</strong> Your store URL and online marketplace profile are taken offline immediately. Search indexes and geofenced discovery will no longer return your store.</li>
              <li><strong>Point of Sale (POS) Lockout:</strong> POS billing terminals, registers, and inventory movement modules are locked to prevent new transactional discrepancies.</li>
              <li><strong>Staff Access Revocation:</strong> Active access sessions for all staff, billers, and administrators linked to the shop are invalidated immediately.</li>
              <li><strong>Customer In-Flight Orders:</strong> Any active customer orders marked in-flight or out-for-delivery should be fulfilled or refunded prior to initiating deletion. Customers maintain access to receipts for past completed orders.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              5. The 180-Day Statutory Preservation Escrow
            </h2>
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle size={16} />
                <span>Statutory Compliance Notice: Rule 3(1)(h) of the IT Rules, 2021</span>
              </div>
              <p>
                In compliance with the mandate prescribed by the Government of India under Rule 3(1)(h) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, an intermediary is legally obligated to retain user registration details, authentication logs, and audit trails for a minimum statutory period of <strong>180 days</strong> following the cancellation or withdrawal of registration.
              </p>
            </div>
            <p>
              During this 180-day retention window:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The store data is kept in an isolated, encrypted cold escrow state.</li>
              <li>The store is completely invisible to customers, staff, and the public.</li>
              <li>No commercial operations or new billing can take place.</li>
              <li>Data is accessed solely in the event of a formal, lawful order issued by an authorized government agency or judicial court of competent jurisdiction.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              6. Mandatory Retention of Commercial Tax &amp; GST Invoices
            </h2>
            <p>
              Under <strong>Section 36 of the Central Goods and Services Tax (CGST) Act, 2017</strong>, every registered person is required to retain books of accounts and records, including all generated tax invoices, credit notes, and supplier ledgers, for a minimum period of <strong>72 months (6 years)</strong> from the due date of furnishing the relevant annual return.
            </p>
            <p>
              Accordingly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>InventQ retains generated GST tax invoice receipts, financial totals, and transaction identifiers in immutable cloud archives to ensure legal compliance for tax audits.</li>
              <li>Non-statutory personal data is segregated and scrubbed.</li>
              <li>Merchants are advised to download and export their complete sales, purchase, and GST reports from the <strong>Sales &amp; Purchases</strong> tabs prior to initiating shop deletion.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              7. Subscription Cancellation &amp; Payments
            </h2>
            <p>
              When a shop deletion is executed:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Any active SaaS subscription plans (Basic, Pro, Digital Store Add-ons) associated with the deleted shop are scheduled for immediate cancellation.</li>
              <li>Auto-debit mandates configured via payment gateway partners (Razorpay / UPI Autopay) are halted for subsequent billing periods.</li>
              <li>A final account statement and GST invoice for past payments are emailed to the registered owner's email address.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              8. Permanent Cryptographic Eradication (Stage 2)
            </h2>
            <p>
              Upon the expiration of the 180-day statutory log preservation period:
            </p>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>All product catalogs, custom categories, and operational parameters are purged permanently.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Store assets, including uploaded logos and banner images, are deleted from cloud storage buckets.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Database backups containing the deleted shop identifiers rotate out according to standard 30-day snapshot lifecycles.</span>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              9. Grievance Redressal &amp; Data Protection Officer
            </h2>
            <p>
              In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Section 10 of the DPDP Act, 2023, the details of the designated Grievance Officer and Data Protection Officer are as follows:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs sm:text-sm text-slate-700">
              <p><strong>Designation:</strong> Data Protection &amp; Grievance Redressal Officer</p>
              <p><strong>Entity:</strong> Antaris Software Pvt Ltd / InventQ Platform</p>
              <p><strong>Address:</strong> Bengaluru, Karnataka, India</p>
              <p><strong>Email:</strong> <a href="mailto:grievance@inventq.in" className="text-blue-600 underline">grievance@inventq.in</a> / <a href="mailto:privacy@inventq.in" className="text-blue-600 underline">privacy@inventq.in</a></p>
              <p><strong>Response Turnaround:</strong> Acknowledged within 24 hours; redressed within 15 days as mandated by statutory guidelines.</p>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>© 2026 Antaris Software Pvt Ltd. All rights reserved.</span>
            <div className="flex items-center gap-4 font-semibold">
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              <Link to="/security" className="text-blue-600 hover:underline">Security</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeletionPolicy;
