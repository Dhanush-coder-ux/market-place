import { createContext, useContext, ReactNode } from 'react';
import { inventoryApi, inventoryCustomFieldsApi } from '../services/api/inventory';
import { customerApi } from '../services/api/customer';
import { employeeApi } from '../services/api/employee';
import { supplierApi } from '../services/api/supplier';
import { shopApi } from '../services/api/shop';
import { authApi } from '../services/api/auth';
import { analyticsApi } from '../services/api/analytics';
import { purchaseApi } from '../services/api/purchase';
import { purchaseCustomFieldsApi } from '../services/api/purchaseCustomFields';
import { supplierCustomFieldsApi } from '../services/api/supplierCustomFields';

type BusinessApiType = {
  inventory: typeof inventoryApi;
  inventoryCustomFields: typeof inventoryCustomFieldsApi;
  customer: typeof customerApi;
  employee: typeof employeeApi;
  supplier: typeof supplierApi;
  supplierCustomFields: typeof supplierCustomFieldsApi;
  shop: typeof shopApi;
  auth: typeof authApi;
  analytics: typeof analyticsApi;
  purchase: typeof purchaseApi;
  purchaseCustomFields: typeof purchaseCustomFieldsApi;
};

const defaultContext: BusinessApiType = {
  inventory: inventoryApi,
  inventoryCustomFields: inventoryCustomFieldsApi,
  customer: customerApi,
  employee: employeeApi,
  supplier: supplierApi,
  supplierCustomFields: supplierCustomFieldsApi,
  shop: shopApi,
  auth: authApi,
  analytics: analyticsApi,
  purchase: purchaseApi,
  purchaseCustomFields: purchaseCustomFieldsApi,
};

const BusinessApiContext = createContext<BusinessApiType>(defaultContext);

export const BusinessApiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <BusinessApiContext.Provider value={defaultContext}>
      {children}
    </BusinessApiContext.Provider>
  );
};

export const useBusinessApi = () => {
  return useContext(BusinessApiContext);
};
