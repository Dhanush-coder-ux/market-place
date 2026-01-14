import {  FileText, Layers, Package, Tag} from "lucide-react";
import { BiRupee } from "react-icons/bi";
import Input from "../../../components/ui/Input";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import ImageUpload from "@/components/common/ImageUpload";
import { useState } from "react";
import { GradientButton } from "@/components/ui/GradientButton";



const InventoryForm = () => {

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    currentStock: "", 
    category: "",
    currentPrice: "",
    sellingPrice: "",
    image: null as File | null 
  });

  const CATEGORIES = [
    { value: "electronics", label: "Electronics" },
    { value: "grocery", label: "Grocery" },
    { value: "clothing", label: "Clothing" },
  ];
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    
      setFormData({
      barcode: "",
      name: "",
      description: "",
      currentStock: "",
      category: "",
      currentPrice: "",
      sellingPrice: "",
      image: null,
    });
  };

  return (
    <div>
  

      <form onSubmit={handleSubmit}>
     
       
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="text-blue-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Product Details</h3>
              </div>

              {/* Product Code */}
              <div className="group space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode / SKU</label>
                <div className="relative">
                
                  <ReusableCombobox
                    options={CATEGORIES} 
                    value={formData.barcode}
                    onChange={(val) => setFormData(prev => ({ ...prev, barcode: val }))}
                    placeholder="Search or enter barcode"
                    searchPlaceholder="Search product barcode"
                  />
                </div>
              </div>

              {/* Product Name */}
              <div className="group space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                <div className="relative">
                  <Input
                    name="name" 
                    onChange={handleInputChange}
                    value={formData.name}
                    type="text"
                    placeholder="Enter item name..."
                    leftIcon={<Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />}
                    className="w-full pl-12 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
             <ImageUpload 
             label="Product Image"
             value={formData.image}
             onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
             />
          </div>

          {/* Description */}
          <div className="group space-y-2 mt-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the product features..."
                className="w-full pl-12 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
              />
            </div>
          </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">

            {/* Category */}
            <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 group">
              <label className="text-[10px] font-black text-gray-400 uppercase">Category</label>
              <div className="relative cursor-pointer">
                <ReusableSelect
                  value={formData.category}
                  options={CATEGORIES}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  placeholder="Select category"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Current Stock</label>
              <div className="flex items-center gap-2">
                <Input
                  name="currentStock"
                  onChange={handleInputChange}
                  value={formData.currentStock}
                  leftIcon={<Layers size={18} className="text-gray-400" />}
                  type="number"
                  placeholder="0"
                  className="w-full bg-transparent font-bold text-gray-700 outline-none"
                />
              </div>
            </div>

            {/* Current Price */}
            <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Currentt Price</label>
              <div className="flex items-center gap-1">
                <Input
                  name="currentPrice"
                  onChange={handleInputChange}
                  value={formData.currentPrice}
                  leftIcon={<BiRupee size={18} />}
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent font-bold text-gray-700 outline-none"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div className="p-2  rounded-2xl space-y-2 ">
              <label className="text-[10px] font-black text-gray-400 uppercase">Selling Price</label>
              <div className="flex items-center gap-1 text-white">
                <BiRupee size={18} className="text-blue-200" />
                <Input
                  name="sellingPrice"
                  onChange={handleInputChange}
                  value={formData.sellingPrice}
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent font-bold placeholder:text-blue-300 outline-none text-white"
                />
              </div>
            </div>

          </div>

          <div className=" flex justify-end gap-4 mt-5">
            <GradientButton>save & add more</GradientButton>
            <GradientButton>save</GradientButton>
            <GradientButton variant="danger">cancel</GradientButton>
          </div>
          
     
      </form>
    </div>
  );
};

export default InventoryForm;