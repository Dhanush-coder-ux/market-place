import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign, AlertCircle, Package, Star, CreditCard,
  FileText, Banknote, Search, Mail, Wallet, Pencil, Save,
  MailIcon, X, Edit2,
} from "lucide-react";
import {
  fmt, StatusBadge, Modal, Notification, FormInput, FormSelect,
  FormTextarea, InfoRow, SectionCard, AlertBanner, BottomActionBar,
  Invoice, PaymentEntry, ActivityEntry, PendingInvoice,
} from "./CustomerDetailComponents";
import { StatCard } from "@/components/common/StatsCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { BiSolidUserAccount } from "react-icons/bi";
import { useApi } from "@/context/ApiContext";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { ENDPOINTS } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { CustomerRecord } from "@/types/api";

// ── Search bar ──────────────────────────────────────────────────────────────
const CustomerSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      getData(ENDPOINTS.CUSTOMERS, { limit: "8", offset: "1", q: query }).then((res) => {
        if (res) setResults(Array.isArray(res.data) ? res.data : [res.data]);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search customer by name / ID…"
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => { navigate(`/customers/${c.id}`); setQuery(""); setOpen(false); }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 border-slate-100 transition-colors"
            >
              <p className="text-sm font-medium text-slate-800 truncate">
                {String(c.datas?.name ?? c.datas?.full_name ?? c.datas?.customer_name ?? "—")}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{c.id}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Static payment / activity data (frontend-only feature) ──────────────────
const PENDING_INVOICES: PendingInvoice[] = [];
const INITIAL_PAYMENTS: PaymentEntry[] = [];
const INITIAL_ACTIVITIES: ActivityEntry[] = [];
const TABS = ["General Info", "Payment Details", "Activity Log"];

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();
  const { fields, fetchCustomerFields } = useInputBuilderContext();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);

  // Tab & modal state
  const [activeTab, setActiveTab] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // Notification
  const [notifText, setNotifText] = useState("");
  const [notifShow, setNotifShow] = useState(false);

  // Payment form
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [outstanding, setOutstanding] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>(INITIAL_PAYMENTS);
  const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITIES);

  useEffect(() => { fetchCustomerFields(); }, []);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.CUSTOMERS}/by/${id}`).then((res) => {
      if (res) setCustomer(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  function notify(msg: string) {
    setNotifText(msg);
    setNotifShow(true);
    setTimeout(() => setNotifShow(false), 3000);
  }

  function handleSavePayment() {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) { alert("Please enter a valid payment amount"); return; }
    const now = new Date().toLocaleString("en-IN", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true });
    setOutstanding((o) => Math.max(0, o - amt));
    setPayments((p) => [{ title: "Payment Received", amount: amt, date: now, invoice: selectedInvoices.join(", ") || "—", method: paymentMethod }, ...p]);
    setActivities((a) => [{
      icon: <Banknote className="w-5 h-5 text-emerald-600" />, iconBg: "bg-emerald-100",
      text: `<strong>Payment received</strong> of ₹${amt.toLocaleString()} via ${paymentMethod}`, time: now,
    }, ...a]);
    setShowPayment(false);
    setPaymentAmount(""); setPaymentRef(""); setPaymentNotes(""); setSelectedInvoices([]);
    notify(`Payment of ₹${amt.toLocaleString()} recorded successfully!`);
  }

  if (recordLoading) {
    return <div className="p-12 flex justify-center"><Loader /></div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Customer not found.</p>
        <div className="flex justify-center"><CustomerSearch /></div>
      </div>
    );
  }

  const datas = customer.datas ?? {};
  const name = String(datas.name ?? datas.full_name ?? datas.customer_name ?? "Unknown Customer");
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Build labeled field list
  const infoFields = fields
    ? Object.entries(fields)
        .filter(([, def]) => def.view_mode === "SHOW")
        .map(([key, def]) => ({ label: def.label_name, value: String(datas[key] ?? "—") }))
    : Object.entries(datas).map(([k, v]) => ({ label: k, value: String(v ?? "—") }));

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] font-[Inter,sans-serif]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-32">

          {/* Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-semibold text-white shadow-inner ring-4 ring-slate-50">
                {initials}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full" />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h1 className="heading-page text-slate-700 tracking-tight">{name}</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[13px] text-slate-500 font-medium">
                    <span>ID: <span className="text-slate-700 font-mono text-xs">{customer.id}</span></span>
                    <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Account
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0 flex-wrap">
                  <CustomerSearch />
                  <GradientButton icon={<MailIcon className="h-4 w-4" />} variant="outline">Message</GradientButton>
                  <GradientButton
                    icon={<Edit2 className="h-4 w-4" />}
                    variant="outline"
                    onClick={() => navigate(`/customers/${id}/edit`)}
                  >
                    Edit Profile
                  </GradientButton>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b-2 border-slate-200 mb-6 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`pb-3 text-[15px] font-semibold border-b-2 -mb-[2px] transition-colors whitespace-nowrap ${activeTab === i ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-blue-500"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <StatCard icon={DollarSign} label="Total Purchases" value="—" iconBg="bg-blue-100" />
            <StatCard icon={AlertCircle} label="Outstanding Balance" value={fmt(outstanding)} iconBg="bg-red-100" />
            <StatCard icon={Package} label="Total Orders" value="—" iconBg="bg-emerald-100" />
            <StatCard icon={Star} label="Lifetime Value" value="—" iconBg="bg-blue-100" />
          </div>

          {/* TAB 0 — General Info */}
          {activeTab === 0 && (
            <SectionCard>
              {outstanding > 0 && (
                <div className="mb-6">
                  <AlertBanner icon={AlertCircle} title="Outstanding Payment Due"
                    message={`This customer has an outstanding balance of ${fmt(outstanding)}.`}
                    variant="danger"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold text-slate-700 mb-6">General Info</h2>
              {infoFields.length === 0 ? (
                <p className="text-sm text-slate-500">No customer data available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {infoFields.slice(0, Math.ceil(infoFields.length / 2)).map((f) => (
                      <InfoRow key={f.label} label={f.label} value={f.value} />
                    ))}
                  </div>
                  <div className="space-y-6">
                    {infoFields.slice(Math.ceil(infoFields.length / 2)).map((f) => (
                      <InfoRow key={f.label} label={f.label} value={f.value} />
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* TAB 1 — Payment Details */}
          {activeTab === 1 && (
            <SectionCard>
              <h2 className="text-xl font-semibold text-slate-700 mb-6">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <InfoRow label="Total Outstanding" value={<span className="text-2xl font-semibold text-red-600">{fmt(outstanding)}</span>} />
                </div>
                <div className="space-y-6">
                  <InfoRow label="Preferred Payment Method" value="—" />
                </div>
              </div>
              <h3 className="heading-sub text-slate-700 mb-5">Payment Timeline</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                  {payments.map((p, i) => (
                    <div key={i} className="relative mb-6">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-[3px] border-blue-500" />
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-slate-700">{p.title}</span>
                          <span className="font-semibold text-emerald-600">+{fmt(p.amount)}</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{p.date}</div>
                        <div className="text-sm text-slate-500">Invoice: {p.invoice} • Method: {p.method}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {/* TAB 2 — Activity Log */}
          {activeTab === 2 && (
            <SectionCard>
              <h2 className="text-xl font-semibold text-slate-700 mb-6">Activity Log</h2>
              {activities.length === 0 ? (
                <p className="text-sm text-slate-500">No activity recorded yet.</p>
              ) : (
                activities.map((a, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${a.iconBg}`}>
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-sm text-slate-800 mb-1" dangerouslySetInnerHTML={{ __html: a.text }} />
                      <div className="text-xs text-slate-500">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </SectionCard>
          )}
        </div>

        {/* Bottom Action Bar */}
        <BottomActionBar
          customerName={name}
          actions={[
            { label: "Send Invoice", icon: <Mail className="w-4 h-4" />, variant: "secondary", onClick: () => setShowInvoice(true) },
            { label: "Record Payment", icon: <Wallet className="w-4 h-4" />, variant: "success", onClick: () => setShowPayment(true) },
            { label: "Edit Customer", icon: <Pencil className="w-4 h-4" />, variant: "primary", onClick: () => navigate(`/customers/${id}/edit`) },
          ]}
        />

        {/* MODAL — Record Payment */}
        <Modal show={showPayment} onClose={() => setShowPayment(false)} title="Record Payment"
          footer={
            <>
              <button onClick={() => setShowPayment(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePayment} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">
                <Wallet className="w-4 h-4" /> Save Payment
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Payment Amount" type="number" value={paymentAmount} onChange={(e: any) => setPaymentAmount(e.target.value)} placeholder="₹0.00" />
              <FormSelect label="Payment Method" options={["UPI", "Cash", "Bank Transfer", "Card", "Cheque"]} value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} />
            </div>
            <FormInput label="Payment Date" type="date" value={paymentDate} onChange={(e: any) => setPaymentDate(e.target.value)} />
            <FormInput label="Reference Number (Optional)" type="text" value={paymentRef} onChange={(e: any) => setPaymentRef(e.target.value)} placeholder="Transaction ID, Cheque #" />
            <FormTextarea label="Notes (Optional)" value={paymentNotes} onChange={(e: any) => setPaymentNotes(e.target.value)} placeholder="Add any notes..." />
          </div>
        </Modal>

        {/* MODAL — Send Invoice */}
        <Modal show={showInvoice} onClose={() => setShowInvoice(false)} title="Send Invoice"
          footer={
            <>
              <button onClick={() => setShowInvoice(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setShowInvoice(false); notify("Invoice sent successfully!"); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold">
                <Mail className="w-4 h-4" /> Send Invoice
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <FormInput label="Email Address" type="email" defaultValue={String(datas.email ?? "")} />
            <FormInput label="Subject" type="text" defaultValue="Invoice from Market Place" />
            <FormTextarea label="Message" defaultValue={`Dear ${name},\n\nPlease find attached your invoice.\n\nThank you!\n\nBest regards,\nMarket Place Team`} style={{ minHeight: 120 }} />
          </div>
        </Modal>

        <Notification text={notifText} show={notifShow} variant="success" />
      </div>
    </>
  );
}
