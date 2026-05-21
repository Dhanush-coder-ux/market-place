import { useEffect, useState } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StockMovementsTable } from "@/components/common/HistoryTables";

interface StockMovementTabProps {
  inventoryId: string;
}

const StockMovementTab = ({ inventoryId }: StockMovementTabProps) => {
  const { getData } = useApi();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inventoryId) return;
    setLoading(true);
    
    // Only call the stock movement route, no other APIs
    getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/shop/${SHOP_ID}`, { inventory_id: inventoryId })
      .then((res) => {
        const rawData = res?.data || res?.datas || (Array.isArray(res) ? res : []);
        
        // Map rawData to the rows format expected by StockMovementsTable
        const rows: any[] = [];
        
        rawData.forEach((a: any) => {
          const mType = a.movement_type || "";
          let displayType = "Adjustment";
          let source = "stock";
          if (mType === "DIRECT" || mType === "PURCHASE") { displayType = "Purchase"; source = "purchase"; }
          else if (mType === "SALES") { displayType = "Sales"; source = "sales"; }
          else if (mType === "RETURN" || mType === "SALE_RETURN") { displayType = "Return"; source = "return"; }
          else if (mType.includes("PO_")) { displayType = "PO Purchase"; source = "purchase"; }

          const products = (a.products || []) as any[];
          const dateStr = String(a.adjusted_date || a.created_at || new Date().toISOString());

          products.forEach((prod: any) => {
            const isDecrement = prod.type === 'DECREMENT';
            const baseQty = Number(prod.stocks || 0);

            const baseRow = {
              id: a.id,
              date: dateStr,
              description: a.description || "",
              displayType,
              source,
              isInc: !isDecrement,
              uiId: a.ui_id,
            };

            if (prod.variants && prod.variants.length > 0) {
              prod.variants.forEach((v: any) => {
                if (v.batches && v.batches.length > 0) {
                  v.batches.forEach((b: any) => {
                    const sns = Array.isArray(b.serial_numbers?.serial_numbers) 
                      ? b.serial_numbers.serial_numbers 
                      : (Array.isArray(v.serial_numbers?.serial_numbers) ? v.serial_numbers.serial_numbers : []);
                    rows.push({
                      ...baseRow,
                      variant: v.name || "",
                      batch: b.name || "",
                      stocks: Number(b.stocks || v.stocks || baseQty),
                      receivedStocks: Number(b.stocks || v.stocks || baseQty),
                      stocksBefore: b.stocks_before ?? v.stocks_before ?? prod.stocks_before ?? null,
                      serials: sns
                    });
                  });
                } else {
                  rows.push({
                    ...baseRow,
                    variant: v.name || "",
                    batch: null,
                    stocks: Number(v.stocks || baseQty),
                    receivedStocks: Number(v.stocks || baseQty),
                    stocksBefore: v.stocks_before ?? prod.stocks_before ?? null,
                    serials: Array.isArray(v.serial_numbers?.serial_numbers) ? v.serial_numbers.serial_numbers : []
                  });
                }
              });
            } else {
              rows.push({
                ...baseRow,
                variant: null,
                batch: null,
                stocks: baseQty,
                receivedStocks: baseQty,
                stocksBefore: prod.stocks_before ?? null,
                serials: Array.isArray(prod.serial_numbers?.serial_numbers) ? prod.serial_numbers.serial_numbers : []
              });
            }
          });
        });
        
        // Sort newest first
        rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMovements(rows);
      })
      .catch(() => {
        setMovements([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [inventoryId, getData]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
      <StockMovementsTable rows={movements} loading={loading} />
    </div>
  );
};

export default StockMovementTab;
