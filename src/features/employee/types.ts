export type EmployeeHeaderProps = {
  accepted: number;
  notAccepted: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export interface EmployeeFormData {
  name: string;
  email: string;
  role: string;
  mobile_number?: string;
  department?: string;
  joined_date?: string;
  shop_id?: string;
  additional_infos?: Record<string, any>;
  additionalSettings?: Record<string, string>;
}