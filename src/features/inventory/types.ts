export type InventoryInfoCardProps = {
  value: number;
  label: string;
  subvalue:string;
};


export type InventoryHeaderProps = {
  totalCount: number;
  lowestStockValue: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type HelperFunction = {
  label: string;
  onClick?: ()=>void; 
};

export type LowStockNotificationProps = {
    lowestStockValue:number;
    show:boolean
    onClose:()=>void;
}
// for state management
export interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  description:string;
  currentStock:number;
  category:string;
  sellingPrice:number;
  costPrice: number;
  lowStockThreshold: number;
}

export interface InventoryState {
  loading: boolean;
  error: string | null;
  ids: string[];
  entities: Record<string, InventoryItem>;
}