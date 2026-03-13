import { useState, useCallback } from "react";
import Title from "../../../components/common/Title";
import BillingTable from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";
import BillingDetailView from "../components/BillingDetailView";
import Drawer from "@/components/common/Drawer";
import { BillingItem, InvoicePayload } from "../types";
import { createEmptyRow } from "../components/BillingTable";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReceiptIcon } from "lucide-react";


const Billing = () => {
  // ── Shared state ────────────────────────────────────────────────────────────
  // Lifted from BillingTable so BillingHeader always reflects the live cart.
  const [items, setItems] = useState<BillingItem[]>([createEmptyRow()]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);

  // ── Stable callback so BillingTable never re-renders unnecessarily ──────────
  const handleItemsChange = useCallback((next: BillingItem[]) => {
    setItems(next);
  }, []);

  // ── Receive the full invoice payload when the cashier taps "Generate" ───────
  const handleInvoiceReady = useCallback((payload: InvoicePayload) => {
    // TODO: POST payload to your backend / print service here.
    console.log("[Billing] Invoice payload ready:", payload);
  }, []);

  return (
    <div className="flex flex-col min-h-screen gap-4">

      <div className="shrink-0 flex justify-between">
        <Title title="Billing" subtitle="Manage and track your billing details" />
  
        <GradientButton
        onClick={()=>setIsModelOpen(true)}
        icon={<ReceiptIcon size={16}/>}
        >
       Verify Billing
        </GradientButton>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6 pb-4">

        {/* Left: line-item table */}
        <div className="flex-1 overflow-y-auto rounded-xl">
          <BillingTable
            items={items}
            onItemsChange={handleItemsChange}
          />
        </div>

        {/* Right: invoice summary + customer + payment */}
        {/* <div className="w-[360px] lg:w-[400px] shrink-0 h-full rounded-xl"> */}
        <FloatingFormCard
        isOpen={isModelOpen}
        title="invoice summary + customer + payment"
        onClose={()=>setIsModelOpen(false)}
        maxWidth="max-w-5xl"

        >
             <BillingHeader
            items={items}
            setIsOpen={setIsModelOpen}
            onInvoiceReady={handleInvoiceReady}
          />

        </FloatingFormCard>
       
        {/* </div> */}

      </div>

      <Drawer
        isOpen={isOpen}
        title="Billing Details"
        onClose={() => setIsOpen(false)}
      >
        <BillingDetailView />
      </Drawer>

    </div>
  );
};

export default Billing;