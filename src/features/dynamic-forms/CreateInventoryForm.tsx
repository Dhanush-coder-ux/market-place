import { useState } from 'react';
import { DynamicForm, FieldConfig } from '../../components/common/DynamicForm';
import { useBusinessApi } from '../../context/BusinessApiContext';

export const CreateInventoryForm = () => {
  const { inventory } = useBusinessApi();
  const [successData, setSuccessData] = useState<any>(null);

  const fields: FieldConfig[] = [
    { name: 'shop_id', label: 'Shop ID', type: 'text', required: true },
    { name: 'barcode', label: 'Barcode', type: 'text', required: true },
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'stocks', label: 'Stocks', type: 'number', required: true },
    { name: 'buy_price', label: 'Buy Price', type: 'number', required: true },
    { name: 'sell_price', label: 'Sell Price', type: 'number', required: true },
    { name: 'extra_field_example', label: 'Extra Field (Optional)', type: 'text', required: false },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setSuccessData(null);
    const response = await inventory.createInventory(data);
    setSuccessData(response.datas);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Create Inventory</h2>
      <DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Create Inventory" />
      {successData && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success! Response Data:</h3>
          <pre className="text-sm mt-2">{JSON.stringify(successData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
