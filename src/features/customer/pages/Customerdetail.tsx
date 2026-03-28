import  { useState } from "react";
import {
    fmt,
    StatusBadge,

    Modal,
    Notification,
    FormInput,
    FormSelect,
    FormTextarea,
    InfoRow,
    SectionCard,
    AlertBanner,
    BottomActionBar,
    Invoice,
    PaymentEntry,
    ActivityEntry,
    PendingInvoice,
} from "./CustomerDetailComponents";
import { StatCard } from "@/components/common/StatsCard";

// ─── Static data ──────────────────────────────────────────────────────────────
const INVOICES: Invoice[] = [
    {
        id: "INV-2024-156",
        date: "April 18, 2024",
        products: "5 items • 12 units",
        amount: 18500,
        outstanding: 0,
        status: "Paid",
    },
    {
        id: "INV-2024-145",
        date: "April 12, 2024",
        products: "3 items • 8 units",
        amount: 12800,
        outstanding: 5300,
        status: "Partial",
    },
    {
        id: "INV-2024-132",
        date: "April 5, 2024",
        products: "7 items • 20 units",
        amount: 25400,
        outstanding: 10000,
        status: "Pending",
    },
    {
        id: "INV-2024-118",
        date: "March 28, 2024",
        products: "4 items • 10 units",
        amount: 15600,
        outstanding: 0,
        status: "Paid",
    },
];

const PENDING_INVOICES: PendingInvoice[] = [
    { id: "INV-2024-145", date: "April 12, 2024", amount: 5300 },
    { id: "INV-2024-132", date: "April 5, 2024", amount: 10000 },
];

const INITIAL_PAYMENTS: PaymentEntry[] = [
    {
        title: "Payment Received",
        amount: 18500,
        date: "April 20, 2024 • 2:30 PM",
        invoice: "INV-2024-156",
        method: "UPI",
    },
    {
        title: "Partial Payment Received",
        amount: 7500,
        date: "April 15, 2024 • 11:00 AM",
        invoice: "INV-2024-145",
        method: "Bank Transfer",
    },
];

const INITIAL_ACTIVITIES: ActivityEntry[] = [
    {
        icon: "📄",
        iconBg: "bg-blue-100",
        text: "<strong>Invoice INV-2024-156</strong> created for ₹18,500",
        time: "April 18, 2024 • 10:30 AM",
    },
    {
        icon: "💵",
        iconBg: "bg-emerald-100",
        text: "<strong>Payment received</strong> of ₹18,500 via UPI",
        time: "April 20, 2024 • 2:30 PM",
    },
];

const TABS = ["General Info", "Purchase History", "Payment Details", "Activity Log"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerDetail() {
    // ── Tab state ──
    const [activeTab, setActiveTab] = useState(0);

    // ── Modal visibility ──
    const [showPayment, setShowPayment] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // ── Notification ──
    const [notifText, setNotifText] = useState("");
    const [notifShow, setNotifShow] = useState(false);

    // ── Payment form ──
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [paymentDate, setPaymentDate] = useState("2024-04-25");
    const [paymentRef, setPaymentRef] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");

    // ── Dynamic data ──
    const [outstanding, setOutstanding] = useState(15300);
    const [payments, setPayments] = useState<PaymentEntry[]>(INITIAL_PAYMENTS);
    const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITIES);

    // ── Helpers ──
    function notify(msg: string) {
        setNotifText(msg);
        setNotifShow(true);
        setTimeout(() => setNotifShow(false), 3000);
    }

    function toggleInvoiceSelection(id: string) {
        setSelectedInvoices((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            const total = PENDING_INVOICES.filter((inv) => next.includes(inv.id)).reduce(
                (sum, inv) => sum + inv.amount,
                0
            );
            setPaymentAmount(total > 0 ? String(total) : "");
            return next;
        });
    }

    function handleSavePayment() {
        const amt = parseFloat(paymentAmount);
        if (!amt || amt <= 0) {
            alert("Please enter a valid payment amount");
            return;
        }
        if (selectedInvoices.length === 0) {
            alert("Please select at least one invoice");
            return;
        }

        const now = new Date().toLocaleString("en-IN", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });

        setOutstanding((o) => Math.max(0, o - amt));
        setPayments((p) => [
            {
                title: "Payment Received",
                amount: amt,
                date: now,
                invoice: selectedInvoices.join(", "),
                method: paymentMethod,
            },
            ...p,
        ]);
        setActivities((a) => [
            {
                icon: "💵",
                iconBg: "bg-emerald-100",
                text: `<strong>Payment received</strong> of ₹${amt.toLocaleString()} via ${paymentMethod}`,
                time: now,
            },
            ...a,
        ]);

        // Reset form
        setShowPayment(false);
        setPaymentAmount("");
        setPaymentRef("");
        setPaymentNotes("");
        setSelectedInvoices([]);
        notify(`Payment of ₹${amt.toLocaleString()} recorded successfully!`);
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); }
          to   { transform: translateX(0); }
        }
      `}</style>

            <div className="min-h-screen bg-[#F5F7FA] font-[Inter,sans-serif]">
                <div className="max-w-7xl mx-auto px-8 pt-8 pb-32">

                    {/* ── Page Header ── */}
    {/* ── Page Header ── */}
<div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200">
  
  {/* Avatar */}
  <div className="relative shrink-0">
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-[#4A6CF7] to-[#8B5CF6] rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-inner ring-4 ring-slate-50">
      Ak
    </div>
    {/* Optional: Online/Active indicator dot overlapping the avatar */}
    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full"></div>
  </div>

  {/* Info & Actions */}
  <div className="flex-1 w-full">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      
      {/* Customer Details */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ajith Kumar
          </h1>
          {/* Modernized Premium Badge */}
          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium
          </span>
        </div>
        
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[13px] sm:text-sm text-slate-500 font-medium">
          <span>Customer ID: <span className="text-slate-700">CUST-2024-1234</span></span>
          <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="flex items-center gap-1.5 text-emerald-600">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             Active Account
          </span>
        </div>
      </div>
      
      {/* Top-Level Quick Actions (Optional, but adds a professional touch) */}
      <div className="flex items-center gap-2 mt-2 md:mt-0">
         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Message
         </button>
         <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            Edit Profile
         </button>
      </div>

    </div>
  </div>
</div>

                    {/* ── Tabs ── */}
                    <div className="flex gap-8 border-b-2 border-slate-200 mb-6">
                        {TABS.map((tab, i) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(i)}
                                className={`pb-3 text-[15px] font-semibold border-b-2 -mb-[2px] transition-colors ${activeTab === i
                                        ? "text-[#4A6CF7] border-[#4A6CF7]"
                                        : "text-slate-500 border-transparent hover:text-[#4A6CF7]"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ── Stats Cards ── */}
                    <div className="grid grid-cols-4 gap-5 mb-6">
                        <StatCard icon="💰" label="Total Purchases" value="₹2,45,680" iconBg="bg-blue-100" />
                        <StatCard icon="⚠️" label="Outstanding Balance" value={fmt(outstanding)} iconBg="bg-red-100" />
                        <StatCard icon="📦" label="Total Orders" value="48" iconBg="bg-emerald-100" />
                        <StatCard icon="⭐" label="Lifetime Value" value="₹3,12,450" iconBg="bg-indigo-100" />
                    </div>

                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* TAB 0 — General Info                                            */}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {activeTab === 0 && (
                        <SectionCard>
                            {outstanding > 0 && (
                                <div className="mb-6">
                                    <AlertBanner
                                        icon="⚠️"
                                        title="Outstanding Payment Due"
                                        message={`This customer has an outstanding balance of ${fmt(outstanding)} across 2 invoices.`}
                                        variant="danger"
                                    />
                                </div>
                            )}

                            {/* Credit info */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-amber-900">💳 Credit Limit</span>
                                    <span className="text-2xl font-bold text-amber-600">₹50,000</span>
                                </div>
                                <div className="text-sm text-amber-800">
                                    Available Credit: ₹34,700 | Used: ₹15,300 (30.6%)
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-6">General Info</h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <InfoRow label="Full Name" value="Rajesh Kumar" />
                                    <InfoRow label="Email" value="rajesh.kumar@email.com" />
                                    <InfoRow label="Phone Number" value="+91 98765 43210" />
                                    <InfoRow label="GST Number" value="29ABCDE1234F1Z5" />
                                    <InfoRow label="Customer Type" value="Premium" />
                                </div>
                                <div className="space-y-6">
                                    <InfoRow
                                        label="Billing Address"
                                        value={
                                            <span className="leading-relaxed whitespace-pre-line">
                                                {"123, MG Road, Koramangala\nBangalore, Karnataka - 560034\nIndia"}
                                            </span>
                                        }
                                    />
                                    <InfoRow label="Shipping Address" value="Same as Billing Address" />
                                    <InfoRow label="Credit Terms" value="Net 30 Days" />
                                    <InfoRow label="Customer Since" value="January 15, 2024" />
                                    <InfoRow label="Last Purchase" value="April 18, 2024" />
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* TAB 1 — Purchase History                                        */}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {activeTab === 1 && (
                        <SectionCard>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
                                <div className="relative w-[300px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search invoices..."
                                        className="w-full h-10 pl-9 pr-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#4A6CF7]"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            {["Invoice #", "Date", "Products", "Amount", "Status", "Outstanding", "Actions"].map(
                                                (h) => (
                                                    <th
                                                        key={h}
                                                        className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider"
                                                    >
                                                        {h}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {INVOICES.map((inv) => (
                                            <tr
                                                key={inv.id}
                                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-4 py-4 font-bold text-[#4A6CF7]">{inv.id}</td>
                                                <td className="px-4 py-4 text-slate-700">{inv.date}</td>
                                                <td className="px-4 py-4 text-slate-600">{inv.products}</td>
                                                <td className="px-4 py-4 font-bold text-slate-900">{fmt(inv.amount)}</td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={inv.status} />
                                                </td>
                                                <td className={`px-4 py-4 font-bold ${inv.outstanding > 0 ? "text-red-600" : "text-slate-700"}`}>
                                                    {fmt(inv.outstanding)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    )}

                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* TAB 2 — Payment Details                                         */}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {activeTab === 2 && (
                        <SectionCard>
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h2>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-6">
                                    <InfoRow
                                        label="Total Received"
                                        value={<span className="text-2xl font-bold text-emerald-600">₹2,30,380</span>}
                                    />
                                    <InfoRow
                                        label="Total Outstanding"
                                        value={<span className="text-2xl font-bold text-red-600">{fmt(outstanding)}</span>}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <InfoRow label="Preferred Payment Method" value="UPI / Bank Transfer" />
                                    <InfoRow label="Average Payment Time" value="18 Days" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-5">Payment Timeline</h3>
                            <div className="relative pl-8">
                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                                {payments.map((p, i) => (
                                    <div key={i} className="relative mb-6">
                                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#4A6CF7]" />
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-slate-900">{p.title}</span>
                                                <span className="font-bold text-emerald-600">+{fmt(p.amount)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-1">{p.date}</div>
                                            <div className="text-sm text-slate-500">
                                                Invoice: {p.invoice} • Method: {p.method}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* TAB 3 — Activity Log                                            */}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {activeTab === 3 && (
                        <SectionCard>
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Activity Log</h2>
                            {activities.map((a, i) => (
                                <div key={i} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${a.iconBg}`}>
                                        {a.icon}
                                    </div>
                                    <div>
                                        <div
                                            className="text-sm text-slate-800 mb-1"
                                            dangerouslySetInnerHTML={{ __html: a.text }}
                                        />
                                        <div className="text-xs text-slate-500">{a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </SectionCard>
                    )}
                </div>

                {/* ── Bottom Action Bar ── */}
                <BottomActionBar
                    customerName="Rajesh Kumar"
                    actions={[
                        {
                            label: "View Statement",
                            icon: "📊",
                            variant: "secondary",
                            onClick: () => notify("Statement generated successfully!"),
                        },
                        {
                            label: "Send Invoice",
                            icon: "📧",
                            variant: "secondary",
                            onClick: () => setShowInvoice(true),
                        },
                        {
                            label: "Record Payment",
                            icon: "💰",
                            variant: "success",
                            onClick: () => setShowPayment(true),
                        },
                        {
                            label: "Edit Customer",
                            icon: "✏️",
                            variant: "primary",
                            onClick: () => setShowEdit(true),
                        },
                    ]}
                />

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* MODAL — Record Payment                                            */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Modal
                    show={showPayment}
                    onClose={() => setShowPayment(false)}
                    title="Record Payment"
                    footer={
                        <>
                            <button
                                onClick={() => setShowPayment(false)}
                                className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePayment}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                💰 Save Payment
                            </button>
                        </>
                    }
                >
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-2">Select Invoices</label>
                            <div className="border border-slate-200 rounded-lg max-h-[240px] overflow-y-auto">
                                {PENDING_INVOICES.map((inv) => (
                                    <label
                                        key={inv.id}
                                        className="flex items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer gap-3"
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={selectedInvoices.includes(inv.id)}
                                            onChange={() => toggleInvoiceSelection(inv.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-900 text-sm">{inv.id}</div>
                                            <div className="text-xs text-slate-500">{inv.date}</div>
                                        </div>
                                        <div className="font-bold text-red-500 text-sm">{fmt(inv.amount)}</div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Payment Amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e: any) => setPaymentAmount(e.target.value)}
                                placeholder="₹0.00"
                            />
                            <FormSelect
                                label="Payment Method"
                                options={["UPI", "Cash", "Bank Transfer", "Card", "Cheque"]}
                                value={paymentMethod}
                                onChange={(e: any) => setPaymentMethod(e.target.value)}
                            />
                        </div>

                        <FormInput
                            label="Payment Date"
                            type="date"
                            value={paymentDate}
                            onChange={(e: any) => setPaymentDate(e.target.value)}
                        />
                        <FormInput
                            label="Reference Number (Optional)"
                            type="text"
                            value={paymentRef}
                            onChange={(e: any) => setPaymentRef(e.target.value)}
                            placeholder="Transaction ID, Cheque #"
                        />
                        <FormTextarea
                            label="Notes (Optional)"
                            value={paymentNotes}
                            onChange={(e: any) => setPaymentNotes(e.target.value)}
                            placeholder="Add any notes..."
                        />
                    </div>
                </Modal>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* MODAL — Send Invoice                                              */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Modal
                    show={showInvoice}
                    onClose={() => setShowInvoice(false)}
                    title="Send Invoice"
                    footer={
                        <>
                            <button
                                onClick={() => setShowInvoice(false)}
                                className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowInvoice(false);
                                    notify("Invoice sent successfully to rajesh.kumar@email.com!");
                                }}
                                className="px-5 py-2.5 bg-[#4A6CF7] hover:bg-[#3651D4] text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                📧 Send Invoice
                            </button>
                        </>
                    }
                >
                    <div className="space-y-5">
                        <FormSelect
                            label="Select Invoice"
                            options={[
                                "INV-2024-145 - ₹12,800 (Partial)",
                                "INV-2024-132 - ₹25,400 (Pending)",
                            ]}
                        />
                        <FormInput label="Email Address" type="email" defaultValue="rajesh.kumar@email.com" />
                        <FormInput label="Subject" type="text" defaultValue="Invoice from Market Place" />
                        <FormTextarea
                            label="Message"
                            defaultValue={`Dear Rajesh Kumar,\n\nPlease find attached your invoice.\n\nThank you for your business!\n\nBest regards,\nMarket Place Team`}
                            style={{ minHeight: 120 }}
                        />
                    </div>
                </Modal>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* MODAL — Edit Customer                                             */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Modal
                    show={showEdit}
                    onClose={() => setShowEdit(false)}
                    title="Edit Customer"
                    footer={
                        <>
                            <button
                                onClick={() => setShowEdit(false)}
                                className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowEdit(false);
                                    notify("Customer details updated successfully!");
                                }}
                                className="px-5 py-2.5 bg-[#4A6CF7] hover:bg-[#3651D4] text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                💾 Save Changes
                            </button>
                        </>
                    }
                >
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label="First Name" type="text" defaultValue="Rajesh" />
                            <FormInput label="Last Name" type="text" defaultValue="Kumar" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label="Email" type="email" defaultValue="rajesh.kumar@email.com" />
                            <FormInput label="Phone" type="tel" defaultValue="+91 98765 43210" />
                        </div>
                        <FormInput label="GST Number" type="text" defaultValue="29ABCDE1234F1Z5" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Customer Type"
                                options={["Regular", "Premium", "VIP"]}
                                defaultValue="Premium"
                            />
                            <FormInput label="Credit Limit" type="number" defaultValue={50000} />
                        </div>
                    </div>
                </Modal>

                {/* ── Notification toast ── */}
                <Notification text={notifText} show={notifShow} variant="success" />
            </div>
        </>
    );
}