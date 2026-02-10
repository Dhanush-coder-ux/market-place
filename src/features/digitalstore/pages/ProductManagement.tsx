import { useState } from 'react';
import { Upload, Search, AlertCircle, Trash2, Tag } from 'lucide-react';

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

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', category: 'Electronics', price: 199.99, stockStatus: 'In Stock', inStore: true, isLatest: true, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'] },
  { id: '2', name: 'Cotton T-Shirt', category: 'Clothing', price: 24.50, stockStatus: 'In Stock', inStore: true, isLatest: true, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&q=80'] },
  { id: '3', name: 'Smart Watch', category: 'Electronics', price: 299.00, stockStatus: 'Out of Stock', inStore: false, isLatest: false, images: [] },
  { id: '4', name: 'Ceramic Vase', category: 'Home', price: 45.00, stockStatus: 'In Stock', inStore: true, isLatest: false, images: [] },
];

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const latestArrivalsCount = products.filter(p => p.isLatest).length;
  const isLimitReached = latestArrivalsCount >= 3;

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleImageUpload = (id: string, files: FileList | null) => {
    if (!files) return;
    const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
    setProducts(prev => prev.map(p => p.id === id ? { ...p, images: [...p.images, ...newImageUrls] } : p));
  };

  const removeImage = (productId: string, imageIndex: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newImages = p.images.filter((_, i) => i !== imageIndex);
        return { ...p, images: newImages };
      }
      return p;
    }));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden text-sm">
      {/* Top Bar - Compact */}
      <div className="w-full bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Product Inventory</h1>
          <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${isLimitReached ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
            <AlertCircle size={14} className={isLimitReached ? 'text-amber-600' : 'text-blue-600'} />
            <span className="text-xs font-bold">Latest: {latestArrivalsCount}/3</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="border px-3 py-1.5 rounded-lg bg-white outline-none"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className={`bg-white rounded-lg border flex items-center p-3 gap-4 transition-all hover:shadow-md ${!product.inStore ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}>
            
            {/* Status & Basic Info */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <input 
                type="checkbox" 
                checked={product.inStore}
                onChange={(e) => updateProduct(product.id, 'inStore', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="overflow-hidden">
                <p className="font-bold truncate text-gray-900">{product.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{product.category}</p>
              </div>
            </div>

            {/* Price & Stock */}
            <div className="flex items-center gap-4 min-w-[180px]">
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input 
                  type="number"
                  value={product.price}
                  onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                  className="w-full pl-5 pr-2 py-1 border rounded bg-gray-50 text-xs font-mono"
                />
              </div>
              <button 
                onClick={() => updateProduct(product.id, 'stockStatus', product.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock')}
                className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap font-bold ${
                  product.stockStatus === 'In Stock' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}
              >
                {product.stockStatus}
              </button>
            </div>

            {/* Latest Arrival Logic */}
            <div className="flex-1 max-w-[220px]">
              <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${product.isLatest ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
                <input 
                  type="checkbox"
                  checked={product.isLatest}
                  disabled={!product.isLatest && isLimitReached}
                  onChange={() => {
                    if (product.isLatest) updateProduct(product.id, 'isLatest', false);
                    else if (!isLimitReached) updateProduct(product.id, 'isLatest', true);
                  }}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className={`text-[11px] font-medium ${product.isLatest ? 'text-indigo-700' : 'text-gray-500'}`}>
                   Latest Arrival
                </span>
              </label>
            </div>

            {/* Images - Side-scrolling mini list */}
            <div className="flex items-center gap-2 overflow-x-auto min-w-[200px] border-l pl-4">
              {product.images.map((img, idx) => (
                <div key={idx} className="relative group w-10 h-10 rounded border overflow-hidden shrink-0">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removeImage(product.id, idx)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <label className="w-10 h-10 rounded border-2 border-dashed flex items-center justify-center text-gray-300 hover:text-blue-500 hover:border-blue-400 cursor-pointer shrink-0">
                <Upload size={14} />
                <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(product.id, e.target.files)} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductManagement;