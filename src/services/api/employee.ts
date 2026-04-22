import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const employeeApi = {
  createEmployee: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.EMPLOYEES, { datas: data });
  },
  
  updateEmployee: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.employee_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.EMPLOYEES}/${data.id}`, { datas: data });
  }
};
