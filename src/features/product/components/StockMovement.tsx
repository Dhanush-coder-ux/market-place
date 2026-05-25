import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StockMovementsTable } from "@/components/common/HistoryTables";

interface StockMovementTabProps {
  inventoryId: string;
  product?: any;
  onViewDetails?: (id: string) => void;
}

const StockMovementTab = ({ inventoryId, product }: StockMovementTabProps) => {
  const { getData } = useApi();
  const navigate = useNavigate();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inventoryId) return;
    setLoading(true);

    getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/product/${SHOP_ID}/${inventoryId}`)
      .then(async (res) => {
        const rawData = res?.data || res?.datas || (Array.isArray(res) ? res : []);

        // Extract unique supplier IDs for purchase movements
        const sids = new Set<string>();
        rawData.forEach((a: any) => {
          const mType = a.movement_type || "";
          if (mType.includes("PO_")) {
            const sid = a.supplier_id || a.datas?.supplier_id || a.reference_id;
            if (sid) sids.add(sid);
          }
        });

        const supplierNames: Record<string, string> = {};
        if (sids.size > 0) {
          try {
            const supRes = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}?limit=100`);
            const suppliers = supRes?.data || [];
            suppliers.forEach((sup: any) => {
              if (sids.has(sup.id)) supplierNames[sup.id] = sup.name || sup.business_name;
            });
          } catch (e) {
            // ignore error
          }
        }

        const rows: any[] = [];
        const batchNameMap: Record<string, string> = {};

        // Build batchNameMap from the actual product definition
        if (product) {
          if (Array.isArray(product.batches)) {
            product.batches.forEach((b: any) => {
              if (b.id && b.name) batchNameMap[b.id] = b.name;
            });
          }
          if (Array.isArray(product.variants)) {
            product.variants.forEach((v: any) => {
              if (Array.isArray(v.batches)) {
                v.batches.forEach((b: any) => {
                  if (b.id && b.name) batchNameMap[b.id] = b.name;
                });
              }
            });
          }
        }

        // Also build from rawData as a fallback
        rawData.forEach((a: any) => {
          const products = Array.isArray(a.products) ? a.products : [];
          products.forEach((prod: any) => {
            if (prod.batches) {
              prod.batches.forEach((b: any) => {
                if (b.id && b.name) batchNameMap[b.id] = b.name;
              });
            }
            if (prod.variants) {
              prod.variants.forEach((v: any) => {
                if (v.batches) {
                  v.batches.forEach((b: any) => {
                    if (b.id && b.name) batchNameMap[b.id] = b.name;
                  });
                }
              });
            }
          });
        });

        rawData.forEach((a: any) => {
          const mType = a.movement_type || "";
          let displayType = "Adjustment";
          let source = "stock";
          if (mType === "DIRECT" || mType === "PURCHASE") { displayType = "Purchase"; source = "purchase"; }
          else if (mType.includes("PO_")) { displayType = "PO Purchase"; source = "purchase"; }
          else if (mType === "SALES") { displayType = "Sales"; source = "sales"; }
          else if (mType === "SALE_RETURN" || mType === "RETURN") { displayType = "Return"; source = "return"; }

          const sid = a.supplier_id || a.datas?.supplier_id || a.reference_id;
          let finalDesc = a.description || `Stock ${displayType}`;
          if (source === "purchase" && sid && supplierNames[sid]) {
            finalDesc = `Supplier: ${supplierNames[sid]}`;
          }

          const products = (a.products || []) as any[];
          const dateStr = String(a.adjusted_date || a.created_at || new Date().toISOString());

          products.forEach((prod: any) => {
            const isDecrement = prod.type === 'DECREMENT' || source === 'sales';
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
                      stocks: Number(b.stocks ?? v.stocks ?? baseQty),
                      receivedStocks: Number(b.stocks ?? v.stocks ?? baseQty),
                      stocksBefore: b.stocks_before ?? v.stocks_before ?? prod.stocks_before ?? null,
                      serials: sns
                    });
                  });
                } else {
                  rows.push({
                    ...baseRow,
                    variant: v.name || "",
                    batch: null,
                    stocks: Number(v.stocks ?? baseQty),
                    receivedStocks: Number(v.stocks ?? baseQty),
                    stocksBefore: v.stocks_before ?? prod.stocks_before ?? null,
                    serials: Array.isArray(v.serial_numbers?.serial_numbers) ? v.serial_numbers.serial_numbers : []
                  });
                }
              });
            } else if (prod.batches && prod.batches.length > 0) {
              prod.batches.forEach((b: any) => {
                const sns = Array.isArray(b.serial_numbers?.serial_numbers)
                  ? b.serial_numbers.serial_numbers
                  : (Array.isArray(prod.serial_numbers?.serial_numbers) ? prod.serial_numbers.serial_numbers : []);
                rows.push({
                  ...baseRow,
                  variant: null,
                  batch: b.name || "",
                  stocks: Number(b.stocks ?? baseQty),
                  receivedStocks: Number(b.stocks ?? baseQty),
                  stocksBefore: b.stocks_before ?? prod.stocks_before ?? null,
                  serials: sns
                });
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col gap-4">
      <StockMovementsTable 
        rows={movements} 
        loading={loading} 
        onViewDetails={(id) => navigate(`/purchases/${id}`)}
      />
    </div>
  );
};

export default StockMovementTab;
