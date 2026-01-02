import { Barcode, FileText, Layers, Package, Tag, Upload } from "lucide-react";
import Title from "../../../components/common/Title";
import { Link } from "react-router-dom";
import { BiRupee } from "react-icons/bi";
import Input from "../../../components/ui/Input";
import { FormButton } from "../components/HelperFunctions";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import FormCard from "@/components/common/FormCard";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem, inventorySelectors } from "../InventorySlice";


const InventoryForm = () => {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    currentStock: "", 
    category: "",
    costPrice: "",
    sellingPrice: "",
    image: null as File | null 
  });

  const CATEGORIES = [
    { value: "electronics", label: "Electronics" },
    { value: "grocery", label: "Grocery" },
    { value: "clothing", label: "Clothing" },
  ];

  const dispatch = useAppDispatch();
  const inventory =useAppSelector(inventorySelectors.selectAll)
  console.log(inventory);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    dispatch(addItem({
      id: Date.now().toString(),
      barcode: formData.barcode,
      name: formData.name,
      description: formData.description,
      currentStock: Number(formData.currentStock),
      category: formData.category,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      lowStockThreshold:0
      // imageUrl: formData.image ? URL.createObjectURL(formData.image) : undefined,
      
    }))
      setFormData({
      barcode: "",
      name: "",
      description: "",
      currentStock: "",
      category: "",
      costPrice: "",
      sellingPrice: "",
      image: null,
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to={'/inventory'} viewTransition>
          <Title title="Inventory" icon={<Package size={30} />} />
        </Link>
        <Title title="/ Inventory Management" />
      </div>

      <form onSubmit={handleSubmit}>
        <FormCard>
       
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="text-blue-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Product Details</h3>
              </div>

              {/* Product Code */}
              <div className="group space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode / SKU</label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
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
              <div className="group space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                <div className="relative">
                  <Input
                    name="name" 
                    onChange={handleInputChange}
                    value={formData.name}
                    type="text"
                    placeholder="Enter item name..."
                    leftIcon={<Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="lg:w-1/3 flex flex-col items-center justify-start">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Product Image</label>
              <div 
                className="relative w-full aspect-square max-w-[240px] group"
                onClick={() => fileInputRef.current?.click()} 
              >
                <div className="absolute inset-0 bg-blue-500/5 rounded-[30px] border-2 border-dashed border-blue-200 group-hover:border-blue-400 group-hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  {formData.image ? (
                     <div className="text-center">
                        <span className="text-sm font-bold text-blue-600 truncate px-4">{formData.image.name}</span>
                        <p className="text-[10px] text-gray-500">Click to change</p>
                     </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="text-blue-600" size={28} />
                      </div>
                      <span className="text-sm font-bold text-blue-600">Upload Image</span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">PNG, JPG up to 10MB</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg"
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="group space-y-2 mt-6">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the product features..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
              />
            </div>
          </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

            {/* Category */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 group">
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
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
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

            {/* Cost Price */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Cost Price</label>
              <div className="flex items-center gap-1">
                <Input
                  name="costPrice"
                  onChange={handleInputChange}
                  value={formData.costPrice}
                  leftIcon={<BiRupee size={18} />}
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent font-bold text-gray-700 outline-none"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div className="p-4 bg-blue-600 rounded-2xl border border-blue-700 space-y-2 shadow-lg shadow-blue-200">
              <label className="text-[10px] font-black text-blue-100 uppercase">Selling Price</label>
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

          <div className="mt-8">
            <FormButton label="Save Inventory"  />
          </div>
          
        </FormCard>
      </form>
    </div>
  );
};

export default InventoryForm;