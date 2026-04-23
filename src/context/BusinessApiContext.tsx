import { createContext, useContext, ReactNode } from 'react';
import { inventoryApi } from '../services/api/inventory';
import { customerApi } from '../services/api/customer';
import { employeeApi } from '../services/api/employee';
import { supplierApi } from '../services/api/supplier';
import { shopApi } from '../services/api/shop';

type BusinessApiType = {
  inventory: typeof inventoryApi;
  customer: typeof customerApi;
  employee: typeof employeeApi;
  supplier: typeof supplierApi;
  shop: typeof shopApi;
};

const defaultContext: BusinessApiType = {
  inventory: inventoryApi,
  customer: customerApi,
  employee: employeeApi,
  supplier: supplierApi,
  shop: shopApi,
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
