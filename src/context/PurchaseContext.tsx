import React, { createContext, useContext, useState, useEffect } from "react";

type PurchaseSettings = {
  directPurchase: boolean;
  poGrn: boolean;
  productionEntry: boolean;
};

type PurchaseContextType = {
  settings: PurchaseSettings;
  toggleSetting: (key: keyof PurchaseSettings) => void;
};

const defaultSettings: PurchaseSettings = {
  directPurchase: true, // ON by default
  poGrn: false,
  productionEntry: false,
};

const PurchaseSettingsContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<PurchaseSettings>(() => {
    const saved = localStorage.getItem("purchaseSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("purchaseSettings", JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key: keyof PurchaseSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PurchaseSettingsContext.Provider value={{ settings, toggleSetting }}>
      {children}
    </PurchaseSettingsContext.Provider>
  );
};

export const usePurchaseSettings = () => {
  const context = useContext(PurchaseSettingsContext);
  if (!context) throw new Error("usePurchaseSettings must be used within a PurchaseSettingsProvider");
  return context;
};