import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

// --- Types & Interfaces ---

export interface FieldDefinition {
  type: "TEXT" | "DECIMAL" | "DROP-DOWN" | "DATE" | "NUMBER" | "TEXTAREA" | "LIST-DICT" | "EMAIL";
  conn_id: string;
  category: string;
  required: boolean;
  view_mode: "SHOW" | "HIDE";
  can_update: boolean;
  field_name: string;
  label_name: string;
  placeholder: string;
  field_description: string;
  category_description: string;
  values?: string[] | Record<string, FieldDefinition>;
}

export interface ServiceSchema {
  id: string;
  service_name: string;
  fields: Record<string, FieldDefinition>;
}

export interface FetchFieldsResponse {
  detail: {
    msg: string;
    status_code: number;
    success: boolean;
  };
  data: ServiceSchema[]; // Updated to reflect the array from your backend
}

interface InputBuilderContextType {
  fields: Record<string, FieldDefinition> | null;
  isLoading: boolean;
  error: string | null;
  fetchProductFields: () => Promise<void>;
  fetchStockAdjustmentFields: () => Promise<void>;
  fetchSupplierFields: () => Promise<void>;
  fetchPurchaseFields: () => Promise<void>;
  fetchGrnFields: () => Promise<void>;
  fetchProductionFields: () => Promise<void>;
  fetchCustomerFields: () => Promise<void>;
  fetchFieldsByServiceName: (serviceName: string) => Promise<void>; // Added generic fetcher
  fetchEmployeeFields: () => Promise<void>;
}

// --- Context Definition ---
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
export const InputBuilderContext = createContext<InputBuilderContextType | null>(null);

// --- Provider Component ---

export const InputBuilderProvider = ({ children }: { children: ReactNode }) => {
  const [fields, setFields] = useState<Record<string, FieldDefinition> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Core generic fetcher: 
   * Fetches the array from the backend and filters by the requested service_name
   */
  const fetchFieldsByServiceName = async (serviceName: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const result = await axios.get<FetchFieldsResponse>(
      `${VITE_BASE_URL}/fields/base`
    );

    if (result.data.detail.success) {
      const services = result.data.data;

      console.log(
        "Available services:",
        services.map((s) => s.service_name)
      );

      const targetService = services.find(
        (service) => service.service_name === serviceName
      );

      if (targetService) {
        setFields(targetService.fields);
          
      } else {
        console.warn(`Service ${serviceName} not found. Using PRODUCT as fallback.`);
        const fallback = services.find((s) => s.service_name === "PRODUCT");

        if (fallback) {
          setFields(fallback.fields);
          setError(`Service "${serviceName}" not found. Showing PRODUCT instead.`);
        } else {
          setFields(null);
          setError("No valid service found from backend.");
        }
      }
    } else {
      setError(result.data.detail.msg || "Failed to fetch fields.");
      setFields(null);
    }
  } catch (err: any) {
    setError(err.message || "An error occurred while fetching fields.");
    setFields(null);
  } finally {
    setIsLoading(false);
  }
};

  // --- Specific Fetchers (Kept for backward compatibility with your components) ---
  const fetchProductFields = () => fetchFieldsByServiceName("PRODUCT");
  const fetchStockAdjustmentFields = () => fetchFieldsByServiceName("STOCK_ADJUSTMENT");
  const fetchSupplierFields = () => fetchFieldsByServiceName("SUPPLIER");
  const fetchPurchaseFields = () => fetchFieldsByServiceName("PURCHASE");
  const fetchGrnFields = () => fetchFieldsByServiceName("GRN");
  const fetchProductionFields = () => fetchFieldsByServiceName("PRODUCTION");
  const fetchCustomerFields = () => fetchFieldsByServiceName("CUSTOMER");
  const fetchEmployeeFields = () => fetchFieldsByServiceName("EMPLOYEE");

  return (
    <InputBuilderContext.Provider 
      value={{ 
        fields, 
        isLoading, 
        error, 
        fetchProductFields, 
        fetchStockAdjustmentFields,
        fetchSupplierFields,
        fetchPurchaseFields,
        fetchGrnFields,
        fetchProductionFields,
        fetchCustomerFields,
        fetchFieldsByServiceName,
        fetchEmployeeFields,
      }}
    >
      {children}
    </InputBuilderContext.Provider>
  );
};

// --- Custom Hook ---

export const useInputBuilderContext = () => {
  const context = useContext(InputBuilderContext);
  if (!context) {
    throw new Error("useInputBuilderContext must be used within the InputBuilderProvider");
  }
  return context;
};

export default InputBuilderProvider;