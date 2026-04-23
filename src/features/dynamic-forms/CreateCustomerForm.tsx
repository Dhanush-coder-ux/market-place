import { useState } from 'react';
import { DynamicForm, FieldConfig } from '../../components/common/DynamicForm';
import { useBusinessApi } from '../../context/BusinessApiContext';

export const CreateCustomerForm = () => {
  const { customer } = useBusinessApi();
  const [successData, setSuccessData] = useState<any>(null);

  const fields: FieldConfig[] = [
    { name: 'shop_id', label: 'Shop ID', type: 'text', required: true },
    { name: 'name', label: 'Customer Name (Extra)', type: 'text', required: false },
    { name: 'email', label: 'Email (Extra)', type: 'email', required: false },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setSuccessData(null);
    const response = await customer.createCustomer(data);
    setSuccessData(response.datas);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Create Customer</h2>
      <DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Create Customer" />
      {successData && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success! Response Data:</h3>
          <pre className="text-sm mt-2">{JSON.stringify(successData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
