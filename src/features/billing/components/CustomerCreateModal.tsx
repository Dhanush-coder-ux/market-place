import React, { useState } from "react";
import { Modal, Input, Form, InputNumber, Switch } from "antd";
import { User, Phone, Mail, CreditCard } from "lucide-react";

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: any) => void;
  initialName?: string;
  isSubmitting?: boolean;
}

const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialName = "",
  isSubmitting = false,
}) => {
  const [form] = Form.useForm();
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onCreated(values);
    } catch (err) {
      console.error("Validation failed:", err);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <User size={18} />
          </div>
          <span className="font-bold">Create New Customer</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okText="Create Customer"
      cancelText="Cancel"
      centered
      width={450}
      styles={{
        mask: { backdropFilter: "blur(4px)", background: "rgba(15,23,42,0.3)" },
        body: { borderRadius: "16px", padding: "24px" }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: initialName, is_active: true, credit_limit: 0 }}
        className="mt-6"
      >
        <Form.Item
          label={<span className="text-xs font-bold text-slate-500  ">Full Name</span>}
          name="name"
          rules={[{ required: true, message: "Please enter customer name" }]}
        >
          <Input 
            prefix={<User size={14} className="text-slate-400 mr-1" />}
            placeholder="John Doe" 
            className="h-11 rounded-xl border-slate-200"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold text-slate-500  ">Mobile Number</span>}
          name="mobile_number"
          rules={[{ required: true, message: "Please enter mobile number" }]}
        >
          <Input 
            prefix={<Phone size={14} className="text-slate-400 mr-1" />}
            placeholder="9876543210" 
            className="h-11 rounded-xl border-slate-200"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold text-slate-500  ">Email Address</span>}
          name="email"
        >
          <Input 
            prefix={<Mail size={14} className="text-slate-400 mr-1" />}
            placeholder="john@example.com" 
            className="h-11 rounded-xl border-slate-200"
          />
        </Form.Item>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Account Active</span>
            <span className="text-[10px] text-slate-400">Allow credit and history tracking</span>
          </div>
          <Form.Item name="is_active" valuePropName="checked" noStyle>
            <Switch 
              checked={isActive} 
              onChange={setIsActive}
              className={isActive ? "bg-indigo-600" : "bg-slate-300"}
            />
          </Form.Item>
        </div>

        {isActive && (
          <Form.Item
            label={<span className="text-xs font-bold text-slate-500  ">Credit Limit (₹)</span>}
            name="credit_limit"
            className="animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <InputNumber
              prefix={<CreditCard size={14} className="text-slate-400 mr-1" />}
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value!.replace(/₹\s?|(,*)/g, "") as any}
              className="w-full h-11 rounded-xl border-slate-200 flex items-center"
              placeholder="0.00"
              min={0}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CustomerCreateModal;
