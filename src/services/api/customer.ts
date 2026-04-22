import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const customerApi = {
  createCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.CUSTOMERS, { datas: data });
  },
  
  updateCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.CUSTOMERS}/${data.id}`, { datas: data });
  }
};
