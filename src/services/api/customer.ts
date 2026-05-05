import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const customerApi = {
  createCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.CUSTOMERS, data);
  },
  
  updateCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_update);
    console.log("Payload:", data);
    return await apiClient.put(`${ENDPOINTS.CUSTOMERS}`, data);
  },

  deleteCustomer: async (data: { id: string; shop_id: string }) => {
    validateMandatory(data, SCHEMAS.customer_delete);
    console.log("Payload:", data);
    return await apiClient.delete(`${ENDPOINTS.CUSTOMERS}`, data);
  }
};
