import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

// --- Types & Interfaces ---

export interface SearchConfig {
  /** Key in each option object to use as the display label */
  labelKey: string;
  /** Key in each option object to use as the form value */
  valueKey: string;
  /** Allow selecting multiple values */
  multiple?: boolean;
  /** If provided, SearchSelect will call this URL for async search (GET ?q=...) */
  fetch_url?: string;
}

export interface FieldDefinition {
  type:
    | "TEXT"
    | "DECIMAL"
    | "DROP-DOWN"
    | "DATE"
    | "NUMBER"
    | "TEXTAREA"
    | "LIST-DICT"
    | "EMAIL"
    | "BOOLEAN"
    | "DICT"
    | "SEARCH-SELECT"; // ← NEW
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
  /**
   * For DROP-DOWN / SEARCH-SELECT (static): string[]
   * For SEARCH-SELECT (static objects): Record<string, unknown>[]
   * For LIST-DICT: Record<string, FieldDefinition>
   */
  values?: string[] | Record<string, unknown>[] | Record<string, FieldDefinition>;
  /**
   * Only relevant when type === "SEARCH-SELECT".
   * Controls how the SearchSelect component maps option objects.
   */
  search_config?: SearchConfig;
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
  /** Backend may return a single schema object OR an array of them */
  data: ServiceSchema | ServiceSchema[];
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
  fetchEmployeeFields: () => Promise<void>;
  /** Generic fetcher — resolves by service_name */
  fetchFieldsByServiceName: (serviceName: string) => Promise<void>;
}

// --- Context Definition ---
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
export const InputBuilderContext = createContext<InputBuilderContextType | null>(null);

// --- Provider Component ---
export const InputBuilderProvider = ({ children }: { children: ReactNode }) => {
  const [fields, setFields] = useState<Record<string, FieldDefinition> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFieldsByServiceName = async (serviceName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await axios.get<FetchFieldsResponse>(
        `${VITE_BASE_URL}/fields/base/by/s-name/${serviceName}`
      );

      if (result.data.detail.success) {
        const responseData = result.data.data;

        if (Array.isArray(responseData)) {
          const target = responseData.find((s) => s.service_name === serviceName);
          if (target) {
            setFields(target.fields);
          } else {
            setError(`Service "${serviceName}" not found in response.`);
            setFields(null);
          }
        } else {
          // Single object returned directly
          setFields(responseData.fields);
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

  // --- Named convenience wrappers ---
  const fetchProductFields         = () => fetchFieldsByServiceName("PRODUCT");
  const fetchStockAdjustmentFields = () => fetchFieldsByServiceName("STOCK-ADJUSTMENT");
  const fetchSupplierFields        = () => fetchFieldsByServiceName("SUPPLIER");
  const fetchPurchaseFields        = () => fetchFieldsByServiceName("PURCHASE-DIRECT");
  const fetchGrnFields             = () => fetchFieldsByServiceName("PURCHASE-GRN");
  const fetchProductionFields      = () => fetchFieldsByServiceName("PURCHASE-PRODUCTION");
  const fetchCustomerFields        = () => fetchFieldsByServiceName("CUSTOMER");
  const fetchEmployeeFields        = () => fetchFieldsByServiceName("EMPLOYEE");

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
        fetchEmployeeFields,
        fetchFieldsByServiceName,
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
    throw new Error("useInputBuilderContext must be used within InputBuilderProvider");
  }
  return context;
};

export default InputBuilderProvider;