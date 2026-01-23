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
  additionalSettings: Record<string, string>;
}