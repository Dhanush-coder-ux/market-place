import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface HeaderContextType {
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
  bottomActions: ReactNode | null;
  setBottomActions: (actions: ReactNode | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<ReactNode | null>(null);
  const [bottomActions, setBottomActions] = useState<ReactNode | null>(null);

  const value = useMemo(() => ({ 
    actions, 
    setActions, 
    bottomActions, 
    setBottomActions 
  }), [actions, bottomActions]);

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
};
