import React, { useState } from 'react';
import { DynamicForm, FieldConfig } from '../../components/common/DynamicForm';
import { useBusinessApi } from '../../context/BusinessApiContext';

export const CreateEmployeeForm = () => {
  const { employee } = useBusinessApi();
  const [successData, setSuccessData] = useState<any>(null);

  const fields: FieldConfig[] = [
    { name: 'shop_id', label: 'Shop ID', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'text', required: true },
    { name: 'bio', label: 'Bio (Extra)', type: 'textarea', required: false },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setSuccessData(null);
    const response = await employee.createEmployee(data);
    setSuccessData(response.datas);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Create Employee</h2>
      <DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Create Employee" />
      {successData && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success! Response Data:</h3>
          <pre className="text-sm mt-2">{JSON.stringify(successData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
