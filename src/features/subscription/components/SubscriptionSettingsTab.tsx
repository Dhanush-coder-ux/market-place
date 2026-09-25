import React, { useState, useEffect } from "react";
import { CheckCircle, ArrowUpRight, History, Loader2 } from "lucide-react";
import { subscriptionApi } from "@/services/api/subscription";
import { inventoryApi } from "@/services/api/inventory";
import { employeeApi } from "@/services/api/employee";
import { shopApi } from "@/services/api/shop";
import { SubscriptionData, TransactionItem } from "../types";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";

export const SubscriptionSettingsTab: React.FC = () => {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const shopId = localStorage.getItem("shop_id") || "default_shop";
  const navigate = useNavigate();
  const { showToast } = useToast();

  const extractList = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.datas)) return res.datas;
    if (Array.isArray(res.data?.inventories)) return res.data.inventories;
    if (Array.isArray(res.datas?.inventories)) return res.datas.inventories;
    if (Array.isArray(res.data?.employees)) return res.data.employees;
    if (Array.isArray(res.datas?.employees)) return res.datas.employees;
    if (Array.isArray(res.data?.shops)) return res.data.shops;
    if (Array.isArray(res.datas?.shops)) return res.datas.shops;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.employees)) return res.employees;
    if (Array.isArray(res.shops)) return res.shops;
    if (Array.isArray(res.inventories)) return res.inventories;
    if (typeof res.data === "object" && res.data !== null) {
      for (const key of Object.keys(res.data)) {
        if (Array.isArray(res.data[key])) return res.data[key];
      }
    }
    if (typeof res.datas === "object" && res.datas !== null) {
      for (const key of Object.keys(res.datas)) {
        if (Array.isArray(res.datas[key])) return res.datas[key];
      }
    }
    return [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sub, txs, invRes, empRes, shopsRes] = await Promise.all([
        subscriptionApi.getCurrentSubscription(shopId).catch(() => null),
        subscriptionApi.getTransactions(shopId).catch(() => []),
        inventoryApi.getInventoriesByShop(shopId, { limit: "1000" }).catch(() => null),
        employeeApi.getEmployeesByShop(shopId).catch(() => null),
        shopApi.getMyShops().catch(() => null),
      ]);

      const normalizeVariants = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "object") return Object.values(raw);
        return [];
      };

      let liveSkus = 0;
      const invItems = extractList(invRes);
      invItems.forEach((item: any) => {
        const datas = (item.additional_infos as any) || (item.datas as any) || {};
        const rawVariants = item.variant_infos || item.variants || datas.variant_infos || datas.variants || datas.combinations;
        const variants = normalizeVariants(rawVariants).filter((v: any) => v && (v.id !== null || v.sku || v.name || v.attributes));
        if (variants.length > 0) {
          liveSkus += variants.length;
        } else {
          liveSkus += 1;
        }
      });

      const empList = extractList(empRes);
      const liveEmployees = empList.length;

      const shopList = extractList(shopsRes);
      const liveLocations = Math.max(1, shopList.length);

      if (sub) {
        sub.usage = {
          ...sub.usage,
          current_skus: liveSkus,
          current_users: liveEmployees,
          current_locations: liveLocations,
        };
      }

      setSubData(sub);
      setTransactions(txs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel auto-renewal for your subscription?")) return;
    setCancelling(true);
    try {
      await subscriptionApi.cancelSubscription(shopId);
      showToast("Subscription cancellation scheduled at the end of billing cycle", "success");
      fetchData();
    } catch (e: any) {
      showToast(e?.message || "Failed to cancel subscription", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Loading subscription info...</span>
      </div>
    );
  }

  const isTrial = subData?.status === "trialing" || subData?.status === "trial_available";
  const isActive = subData?.status === "active";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── Active Subscription Card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                {isTrial ? "14-Day Free Trial" : subData?.status?.toUpperCase()}
              </span>
              {subData?.cancel_at_period_end && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Cancels at period end
                </span>
              )}
            </div>
            <h3 className="text-2xl font-black">{subData?.plan_name || "Basic Plan"}</h3>
            <p className="text-xs text-slate-300">
              {isTrial
                ? `Trial expires in ${subData?.trial_days_remaining || 0} days`
                : `Next billing cycle: ${subData?.current_period_end ? new Date(subData.current_period_end).toLocaleDateString() : "N/A"}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Upgrade / Change Plan</span>
              <ArrowUpRight size={14} />
            </button>
            {isActive && !subData?.cancel_at_period_end && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel Renewal
              </button>
            )}
          </div>
        </div>

        {/* Usage & Limits Breakdown */}
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-600">Active Users</span>
              <span className="text-xs font-black text-slate-900">
                {subData?.usage?.current_users || 1} / {subData?.limits?.max_users || 2}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((subData?.usage?.current_users || 1) / (subData?.limits?.max_users || 2)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-600">Store SKUs Capacity</span>
              <span className="text-xs font-black text-slate-900">
                {subData?.usage?.current_skus || 0} / {subData?.limits?.max_skus || 500}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((subData?.usage?.current_skus || 0) / (subData?.limits?.max_skus || 500)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-600">Store Locations</span>
              <span className="text-xs font-black text-slate-900">
                {subData?.usage?.current_locations || 1} / {subData?.limits?.max_locations || 1}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, ((subData?.usage?.current_locations || 1) / (subData?.limits?.max_locations || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Active Add-ons */}
        {subData?.addons && subData.addons.length > 0 && (
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Active Add-ons
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subData.addons.map((addon, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800">{addon.name}</span>
                    {addon.quantity > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                        x{addon.quantity}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-600">₹{addon.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction & Invoice History ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Billing & Payment History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payment transactions recorded yet. Free trial active.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Order / Receipt</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-mono text-slate-600">{tx.receipt || tx.razorpay_order_id}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800 capitalize">{tx.plan_id}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">₹{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        tx.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
