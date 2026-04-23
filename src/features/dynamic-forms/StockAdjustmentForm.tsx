import { useState } from 'react';
import { DynamicForm, FieldConfig } from '../../components/common/DynamicForm';
import { useBusinessApi } from '../../context/BusinessApiContext';

export const StockAdjustmentForm = () => {
  const { inventory } = useBusinessApi();
  const [successData, setSuccessData] = useState<any>(null);

  const fields: FieldConfig[] = [
    { name: 'shop_id', label: 'Shop ID', type: 'text', required: true },
    { 
      name: 'type', 
      label: 'Adjustment Type', 
      type: 'select', 
      required: true, 
      options: [
        { label: 'Addition', value: 'ADD' },
        { label: 'Deduction', value: 'DEDUCT' },
        { label: 'Damage', value: 'DAMAGE' }
      ]
    },
    { name: 'products_json', label: 'Products (JSON Array)', type: 'textarea', required: true },
    { name: 'reason', label: 'Reason (Extra)', type: 'text', required: false },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setSuccessData(null);
    let parsedProducts = [];
    try {
      if(data.products_json) {
         parsedProducts = JSON.parse(data.products_json);
      }
    } catch {
      throw new Error("Products must be a valid JSON array");
    }

    const finalData: any = { ...data, products: parsedProducts };
    delete finalData.products_json;
    
    // Use inventory api adjustStock, if it has no 'id' it will assume CREATE logic contextually
    const response = await inventory.createStockAdjustment(finalData);
    setSuccessData(response.datas);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Stock Adjustment</h2>
      <DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Submit Adjustment" />
      {successData && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success! Response Data:</h3>
          <pre className="text-sm mt-2">{JSON.stringify(successData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
