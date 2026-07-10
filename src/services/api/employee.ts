import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const employeeApi = {
  createEmployee: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.EMPLOYEES, data);
  },
  
  updateEmployee: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_update);
    console.log("Payload:", data);
    return await apiClient.put(`${ENDPOINTS.EMPLOYEES}`, data);
  },

  deleteEmployee: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_delete);
    return await apiClient.delete(`${ENDPOINTS.EMPLOYEES}/${data.shop_id}/${data.id}`);
  },

  getEmployees: async (params?: Record<string, string>) => {
    return await apiClient.get(ENDPOINTS.EMPLOYEES, params);
  },
  
  getEmployeeById: async (shop_id: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.EMPLOYEES}/by/${shop_id}/${id}`);
  },
  
  getEmployeesByShop: async (shop_id: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.EMPLOYEES}/by/shop/${shop_id}`, params);
  },
  
  verifyToken: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_verify_token);
    return await apiClient.post(`${ENDPOINTS.EMPLOYEES}/verify/token`, data);
  },

  resendVerificationEmail: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_resend_verify);
    return await apiClient.post(`${ENDPOINTS.EMPLOYEES}/verify/resend`, data);
  }
};
