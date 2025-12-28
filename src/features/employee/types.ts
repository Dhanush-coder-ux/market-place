export type EmployeeHeaderProps = {
  accepted: number;
  notAccepted: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
