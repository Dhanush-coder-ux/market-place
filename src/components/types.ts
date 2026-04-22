import type React from "react";
import { ReactNode } from "react";


export interface TitleProps {
  title: string;
  subtitle?: string; 
  icon?: ReactNode;   
  actions?: ReactNode;
}

export type GradientButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  icon?:React.ReactNode
  variant?: "gradient" | "outline";
};

export interface InputProps {
  name?:string
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  label?: string;
  required?: boolean;
    
}


export type InfoCardProps = {
  value: number | string;
  title: string;
  subtitle?: string;
  valueColor?: string;
};

export type SearchActionCardProps = {
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  FilterOption?: string;
  maxWidth?:string

};

// for table type 
export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => ReactNode;
}
export type TableProps = {
  columns: TableColumn[];
  data: Record<string, any>[];
  rowKey?: string;
  onRowClick?: (row: any) => void;
  className?: string;
};

// for drawer
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// for detail view 
export interface DetailField {
  icon?: React.ReactNode;
  label: string;
  value: string | number | React.ReactNode;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

export interface DetailViewProps {
  title?: string;
  subtitle?: string;
  sections: DetailSection[];
  onEdit?: () => void;
  onDelete?: () => void;
}

// for search select reusable component 
export interface ComboboxOption {
  value: string
  label: string
}

export interface ReusableComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}
// for seleect reusable 
export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode // Optional icon from props
}

export interface ReusableSelectProps {
  options: SelectOption[]
  required?:React.ReactNode
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  error?: string
}
export interface ImageUploadProps {
  label?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  accept?: string;
}