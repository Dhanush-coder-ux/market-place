import React, { createContext, useContext, useState, useEffect } from "react";
import { shopApi } from "@/services/api/shop";
import { getShopId, SHOP_ID } from "@/services/endpoints";

type PurchaseSettings = {
  directPurchase: boolean;
  poGrn: boolean;
  productionEntry: boolean;
  gstType: "registered" | "non-registered";
};

type PurchaseContextType = {
  settings: PurchaseSettings;
  toggleSetting: (key: keyof Omit<PurchaseSettings, "gstType">) => void;
  setGstType: (type: "registered" | "non-registered") => void;
};

const defaultSettings: PurchaseSettings = {
  directPurchase: true, // ON by default
  poGrn: false,
  productionEntry: false,
  gstType: "registered",
};

const PurchaseSettingsContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<PurchaseSettings>(() => {
    const saved = localStorage.getItem("purchaseSettings");
    if (!saved) return defaultSettings;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem("purchaseSettings", JSON.stringify(settings));
  }, [settings]);

  // Synchronize GST registration status from the backend shop record
  useEffect(() => {
    const currentShopId = getShopId() || SHOP_ID;
    if (currentShopId && currentShopId !== "string") {
      shopApi
        .getShopById(currentShopId)
        .then((res: any) => {
          const shop = res?.data || res;
          if (shop?.business_infos?.gst_infos) {
            const isReg = !!shop.business_infos.gst_infos.registered;
            setSettings((prev) => ({
              ...prev,
              gstType: isReg ? "registered" : "non-registered",
            }));
          }
        })
        .catch((err) => {
          console.warn("Could not sync shop GST registration in PurchaseSettingsProvider:", err);
        });
    }
  }, []);

  const toggleSetting = React.useCallback((key: keyof Omit<PurchaseSettings, "gstType">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] } as any));
  }, []);

  const setGstType = React.useCallback((type: "registered" | "non-registered") => {
    setSettings((prev) => ({ ...prev, gstType: type }));
  }, []);

  return (
    <PurchaseSettingsContext.Provider value={{ settings, toggleSetting, setGstType }}>
      {children}
    </PurchaseSettingsContext.Provider>
  );
};

export const usePurchaseSettings = () => {
  const context = useContext(PurchaseSettingsContext);
  if (!context) throw new Error("usePurchaseSettings must be used within a PurchaseSettingsProvider");
  return context;
};