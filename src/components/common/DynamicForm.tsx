import React, { useState } from 'react';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'date';
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface DynamicFormProps {
  fields: FieldConfig[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
  submitLabel?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  initialData = {},
  submitLabel = 'Submit'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Basic type coercion for numbers if input type is number
    const parsedValue = type === 'number' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate mandatory fields handled locally in form to avoid unnecessary API calls
      const missingFields = fields
        .filter(f => f.required && (formData[f.name] === undefined || formData[f.name] === ''))
        .map(f => f.label || f.name);

      if (missingFields.length > 0) {
        throw new Error(`Please fill out required fields: ${missingFields.join(', ')}`);
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto p-4 bg-white shadow rounded">
      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {fields.map(field => (
        <div key={field.name} className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          
          {field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="p-2 border rounded focus:ring shadow-sm"
              required={field.required}
            >
              <option value="" disabled>Select {field.label}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
             <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="p-2 border rounded focus:ring shadow-sm"
              required={field.required}
            />
          ) : (
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="p-2 border rounded focus:ring shadow-sm"
              required={field.required}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : submitLabel}
      </button>
    </form>
  );
};
