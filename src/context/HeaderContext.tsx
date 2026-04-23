import { createContext, useContext, useState, ReactNode } from "react";

interface HeaderContextType {
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<ReactNode | null>(null);

  return (
    <HeaderContext.Provider value={{ actions, setActions }}>
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
