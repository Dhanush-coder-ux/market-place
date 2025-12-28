export type InventoryInfoCardProps = {
  value: number;
  label: string;
  subvalue:string;
};


export type InventoryHeaderProps = {
  totalCount: number;
  lowestStockValue: number;
  lowestStockLabel: string;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type HelperFunction = {
  label: string;
  onClick?: () => void; 
};

export type LowStockNotificationProps = {
    lowestStockValue:number;
    show:boolean
    onClose:()=>void;
}