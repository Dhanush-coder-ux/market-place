import React, { createContext, useContext, useState, useCallback } from 'react';
import { QuickCreateProductModal } from './QuickCreateProductModal';
import { QuickCreateSupplierModal } from './QuickCreateSupplierModal';

type QuickCreateType = 'PRODUCT' | 'SUPPLIER';

interface QuickCreateState {
  type: QuickCreateType | null;
  isOpen: boolean;
  onSuccess?: (data: any) => void;
  initialData?: any;
}

interface QuickCreateContextType {
  openQuickCreate: (type: QuickCreateType, onSuccess?: (data: any) => void, initialData?: any) => void;
  closeQuickCreate: () => void;
}

const QuickCreateContext = createContext<QuickCreateContextType | undefined>(undefined);

export const QuickCreateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuickCreateState>({
    type: null,
    isOpen: false,
  });

  const openQuickCreate = useCallback((type: QuickCreateType, onSuccess?: (data: any) => void, initialData?: any) => {
    setState({ type, isOpen: true, onSuccess, initialData });
  }, []);

  const closeQuickCreate = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSuccess = (data: any) => {
    if (state.onSuccess) {
      state.onSuccess(data);
    }
    closeQuickCreate();
  };

  const value = React.useMemo(() => ({ openQuickCreate, closeQuickCreate }), [openQuickCreate, closeQuickCreate]);

  return (
    <QuickCreateContext.Provider value={value}>
      {children}
      
      {state.type === 'PRODUCT' && (
        <QuickCreateProductModal
          isOpen={state.isOpen}
          onClose={closeQuickCreate}
          onSuccess={handleSuccess}
          initialName={state.initialData?.name}
        />
      )}

      {state.type === 'SUPPLIER' && (
        <QuickCreateSupplierModal
          isOpen={state.isOpen}
          onClose={closeQuickCreate}
          onSuccess={handleSuccess}
          initialName={state.initialData?.name}
        />
      )}
    </QuickCreateContext.Provider>
  );
};

export const useQuickCreate = () => {
  const context = useContext(QuickCreateContext);
  if (context === undefined) {
    throw new Error('useQuickCreate must be used within a QuickCreateProvider');
  }
  return context;
};
