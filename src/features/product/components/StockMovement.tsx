import { useEffect, useState } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StockMovementsTable } from "@/components/common/HistoryTables";

interface StockMovementTabProps {
  inventoryId: string;
  product?: any;
  onNavigateToPurchase?: (id: string) => void;
  onNavigateToSale?: (id: string) => void;
}

const StockMovementTab = ({ inventoryId, product, onNavigateToPurchase, onNavigateToSale }: StockMovementTabProps) => {
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

        // Filter out SALES because the backend returns corrupted products array for SALES adjustments
        const filteredRawData = rawData.filter((a: any) => a.movement_type !== "SALES" && a.movement_type !== "SALE_RETURN" && a.movement_type !== "RETURN");

        filteredRawData.forEach((a: any) => {
          const mType = a.movement_type || "";
          let displayType = "Adjustment";
          let source = "stock";
          if (mType === "DIRECT" || mType === "PURCHASE") { displayType = "Purchase"; source = "purchase"; }
          else if (mType.includes("PO_")) { displayType = "PO Purchase"; source = "purchase"; }

          const sid = a.supplier_id || a.datas?.supplier_id || a.reference_id;
          let finalDesc = a.description || `Stock ${displayType}`;
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

        // Fetch Orders for SALES and SALE_RETURN because backend S_ADJUSTMENTS is corrupted for Sales
        try {
          const ordRes = await getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
          const ordData = (ordRes?.data || []) as any[];
          const productOrders = ordData.filter((o: any) =>
            (o.status === "COMPLETED" || o.status === "Completed" || o.status === "completed") &&
            (o.items || []).some((i: any) => i.inventory_id === inventoryId)
          );

          productOrders.forEach((o: any) => {
            const dateStr = String(o.created_at || new Date().toISOString());
            const displayType = o.origin === "Sales Return" ? "Return" : "Sales";
            const source = o.origin === "Sales Return" ? "return" : "sales";

            const prodItems = (o.items || []).filter((i: any) => i.inventory_id === inventoryId);

            prodItems.forEach((prod: any) => {
              const qty = Number(prod.quantity || 0);
              const isInc = source === "return"; // Return increases stock, Sales decreases stock

              rows.push({
                id: o.id,
                date: dateStr,
                description: `Customer: ${o.customer_id === "walk-in" ? "Walk-in" : o.customer_id}`,
                displayType,
                source,
                isInc,
                uiId: o.ui_id,
                variant: prod.variant_id || null,
                batch: prod.batch_id ? (batchNameMap[prod.batch_id] || prod.batch_id) : null,
                stocks: qty,
                receivedStocks: qty,
                stocksBefore: null,
                serials: prod.serial_numbers || []
              });
            });
          });
        } catch (e) {
          // ignore order fetch error
        }

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
        onNavigateToPurchase={onNavigateToPurchase} 
        onNavigateToSale={onNavigateToSale} 
        availableStock={product?.stocks}
      />
    </div>
  );
};

export default StockMovementTab;
