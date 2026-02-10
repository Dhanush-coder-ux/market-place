import { ReceiptIcon } from "lucide-react";
import Title from "../../../components/common/Title";
import BillingTable from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";
import BillingDetailView from "../components/BillingDetailView";
import Drawer from "@/components/common/Drawer";
import { useState } from "react";

const Billing = () => {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { qty: 4, tprice: 20 },
    { qty: 2, tprice: 150 }
  ];

  return (

    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden gap-4">


      <div className="shrink-0">
        <Title icon={<ReceiptIcon size={30} />} title="Billing" />
      </div>

      <div className="flex flex-1 overflow-hidden gap-6 pb-4">

        <div className="flex-1 overflow-y-auto  rounded-xl">
          <BillingTable />
        </div>
        <div className="w-[360px] lg:w-[400px] shrink-0 h-full">
          <BillingHeader items={items} setIsOpen={setIsOpen} />
        </div>

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