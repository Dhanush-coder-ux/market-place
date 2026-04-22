import React, { useState } from 'react';
import { DynamicForm, FieldConfig } from '../../components/common/DynamicForm';
import { useBusinessApi } from '../../context/BusinessApiContext';

export const PurchaseEntryForm = () => {
  const { inventory } = useBusinessApi();
  const [successData, setSuccessData] = useState<any>(null);

  const fields: FieldConfig[] = [
    { name: 'shop_id', label: 'Shop ID', type: 'text', required: true },
    { 
      name: 'type', 
      label: 'Purchase Type', 
      type: 'select', 
      required: true, 
      options: [
        { label: 'PO Create', value: 'PO_CREATE' },
        { label: 'PO Update', value: 'PO_UPDATE' },
        { label: 'Direct', value: 'DIRECT' }
      ]
    },
    { name: 'supplier_id', label: 'Supplier ID', type: 'text', required: true },
    { name: 'supplier_name', label: 'Supplier Name', type: 'text', required: true },
    { name: 'products_json', label: 'Products (JSON Array)', type: 'textarea', required: true }, // Simple implementation
    { name: 'notes', label: 'Notes (Extra)', type: 'textarea', required: false },
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

    // Prepare exactly as flat input. validateMandatory expects "products", so we add it. 
    // The "validation" doesn't care if it's arrays or objects as long as it exists.
    const finalData = { ...data, products: parsedProducts };
    delete finalData.products_json;

    // Based on requirement, purchase flows through inventory api
    const response = await inventory.createPurchase(finalData);
    setSuccessData(response.datas);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Purchase Entry</h2>
      <DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Submit Purchase" />
      {successData && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success! Response Data:</h3>
          <pre className="text-sm mt-2">{JSON.stringify(successData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
