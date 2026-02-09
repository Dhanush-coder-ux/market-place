import  { useState,} from 'react';
import { 
  Upload, 
  Search, 
  AlertCircle,
  Trash2
} from 'lucide-react';

// --- Types ---
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockStatus: 'In Stock' | 'Out of Stock';
  inStore: boolean;
  isLatest: boolean;
  images: string[];
}

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Accessories'];

// --- Mock Data ---
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    category: 'Electronics',
    price: 199.99,
    stockStatus: 'In Stock',
    inStore: true,
    isLatest: true,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80']
  },
  {
    id: '2',
    name: 'Cotton T-Shirt',
    category: 'Clothing',
    price: 24.50,
    stockStatus: 'In Stock',
    inStore: true,
    isLatest: true,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80']
  },
  {
    id: '3',
    name: 'Smart Watch',
    category: 'Electronics',
    price: 299.00,
    stockStatus: 'Out of Stock',
    inStore: false,
    isLatest: false,
    images: []
  },
  {
    id: '4',
    name: 'Ceramic Vase',
    category: 'Home',
    price: 45.00,
    stockStatus: 'In Stock',
    inStore: true,
    isLatest: false,
    images: []
  },
];

const ProductManagement = () => {
  // --- State ---
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Derived State ---
  const latestArrivalsCount = products.filter(p => p.isLatest).length;
  const isLimitReached = latestArrivalsCount >= 3;

  // --- Handlers ---

  // 1. Image Upload Logic
  const handleImageUpload = (id: string, files: FileList | null) => {
    if (!files) return;
    
    // Create local preview URLs for the uploaded files
    const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));

    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, images: [...p.images, ...newImageUrls] };
      }
      return p;
    }));
  };

  const removeImage = (productId: string, imageIndex: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) { // Fix: Should map correctly
        // implementation below
        return p; 
      }
      return p;
    }));
    
    // Correct implementation within map
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newImages = [...p.images];
        newImages.splice(imageIndex, 1);
        return { ...p, images: newImages };
      }
      return p;
    }));
  };

  // 2. Logic: Toggle Latest Arrival (with Limit Check)
  const toggleLatestArrival = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        // If we are unchecking, always allow
        if (p.isLatest) return { ...p, isLatest: false };
        
        // If we are checking, verify limit
        if (latestArrivalsCount < 3) {
          return { ...p, isLatest: true };
        }
        // Limit reached, do nothing (UI should be disabled anyway)
      }
      return p;
    }));
  };

  // 3. General Field Updates
  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* Header & Stats */}
      <div className=" mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Manager</h1>
          <p className="text-gray-500">Manage inventory and feature collections.</p>
        </div>
        
        {/* ⭐ IMPORTANT: Counter Feature */}
        <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 shadow-sm ${isLimitReached ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
          <div className={`p-2 rounded-full ${isLimitReached ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Latest Arrivals Limit</p>
            <p className={`text-lg font-bold ${isLimitReached ? 'text-amber-700' : 'text-blue-700'}`}>
              {latestArrivalsCount} / 3 Selected
            </p>
          </div>
        </div>
      </div>

     <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="space-y-6 lg:col-span-3">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="border px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Product Cards */}
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border transition-all ${product.inStore ? 'border-gray-200' : 'border-gray-100 opacity-75'}`}>
                
                {/* Card Header: Checkbox & Name */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={product.inStore}
                      onChange={(e) => updateProduct(product.id, 'inStore', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-gray-900">{product.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-600">{product.category}</span>
                  </div>
                  
                  {/* Stock Status Toggle */}
                  <button 
                    onClick={() => updateProduct(product.id, 'stockStatus', product.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock')}
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      product.stockStatus === 'In Stock' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {product.stockStatus}
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Inputs & Logic */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price ($)</label>
                      <input 
                        type="number"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg font-mono text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* ⭐ Latest Arrival Checkbox */}
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id={`latest-${product.id}`}
                          checked={product.isLatest}
                          disabled={!product.isLatest && isLimitReached}
                          onChange={() => toggleLatestArrival(product.id)}
                          className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label 
                          htmlFor={`latest-${product.id}`}
                          className={`font-medium ${!product.isLatest && isLimitReached ? 'text-gray-400' : 'text-indigo-900'}`}
                        >
                          Mark as Latest Arrival
                        </label>
                      </div>
                      <p className="text-xs text-indigo-600 mt-1 pl-8">
                        {!product.isLatest && isLimitReached ? 'Limit of 3 reached. Uncheck another to select.' : 'Shows in the "New" section.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Image Upload Area */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Images</label>
                    
                    {/* Image Grid */}
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                      {product.images.map((img, idx) => (
                        <div key={idx} className="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={img} alt="preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removeImage(product.id, idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Button */}
                      <label className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors bg-gray-50">
                        <Upload size={16} />
                        <span className="text-[10px] mt-1">Add</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(product.id, e.target.files)}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">Drag & drop supported via file dialog.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

     

      </div>
    </div>
  );
};

export default ProductManagement;