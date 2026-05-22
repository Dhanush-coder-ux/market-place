import { useEffect, useState } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StockMovementsTable } from "@/components/common/HistoryTables";

interface StockMovementTabProps {
  inventoryId: string;
  onNavigateToPurchase?: (id: string) => void;
}

const StockMovementTab = ({ inventoryId, onNavigateToPurchase }: StockMovementTabProps) => {
  const { getData } = useApi();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inventoryId) return;
    setLoading(true);

    getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/product/${SHOP_ID}/${inventoryId}`)
      .then(async (res) => {
        const rawData = res?.data || res?.datas || (Array.isArray(res) ? res : []);

        // Extract unique supplier IDs for purchase movements
        const supplierIds = [...new Set(rawData
          .filter((a: any) => a.movement_type === "DIRECT" || a.movement_type === "PURCHASE" || (a.movement_type || "").includes("PO_"))
          .map((a: any) => a.supplier_id || a.datas?.supplier_id || a.reference_id)
          .filter(Boolean))];
          
        const supplierNames: Record<string, string> = {};
        
        // Fetch supplier names in parallel
        await Promise.all(supplierIds.map(async (sid) => {
          try {
            const sres = await getData(`${ENDPOINTS.SUPPLIERS}/by/${SHOP_ID}/${sid}`);
            const s = Array.isArray(sres?.data) ? sres.data[0] : sres?.data;
            if (s) {
              supplierNames[sid as string] = s.name || s.datas?.supplier_name || s.supplier_name || String(sid);
            }
          } catch (e) {
            // ignore
          }
        }));

        const rows: any[] = [];
        
        rawData.forEach((a: any) => {
          const mType = a.movement_type || "";
          let displayType = "Adjustment";
          let source = "stock";
          if (mType === "DIRECT" || mType === "PURCHASE") { displayType = "Purchase"; source = "purchase"; }
          else if (mType === "SALES") { displayType = "Sales"; source = "sales"; }
          else if (mType === "RETURN" || mType === "SALE_RETURN") { displayType = "Return"; source = "return"; }
          else if (mType.includes("PO_")) { displayType = "PO Purchase"; source = "purchase"; }

          const sid = a.supplier_id || a.datas?.supplier_id || a.reference_id;
          let finalDesc = a.description || "";
          if (source === "purchase" && sid && supplierNames[sid]) {
            finalDesc = `Supplier: ${supplierNames[sid]}`;
          }

          const products = (a.products || []) as any[];
          const dateStr = String(a.adjusted_date || a.created_at || new Date().toISOString());

          products.forEach((prod: any) => {
            const isDecrement = prod.type === 'DECREMENT';
            const baseQty = Number(prod.stocks || 0);

            const baseRow = {
              id: a.id,
              date: dateStr,
              description: finalDesc,
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
      <StockMovementsTable rows={movements} loading={loading} onNavigateToPurchase={onNavigateToPurchase} />
    </div>
  );
};

export default StockMovementTab;
