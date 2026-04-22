import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const shopApi = {
  createShop: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.SHOPS, { datas: data });
  },
  
  updateShop: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.SHOPS}/${data.id}`, { datas: data });
  }
};
