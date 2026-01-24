import React from "react";
import type { SearchActionCardProps } from "../types";
import Input from "./Input";
import { Search, Package, PackageX, AlertTriangle, MoreVertical, Upload, Download} from "lucide-react"; 
import { ReusableSelect } from "./ReusableSelect";
import DropDown from "../common/Dropdown";



const SearchActionCard: React.FC<SearchActionCardProps> = ({
  searchValue,
  onSearchChange,
  placeholder = "Search inventory",
 
}) => {
 const InvetoryOption = [
    
    { label: "hightstock", value: "HIGHTSTOCK", icon: <Package size={16} color="green" /> },
    { label: "lowstock", value: "LOWSTOCK", icon: <PackageX size={16} color="red" />   },
    { label: "outofstock", value: "OUTOFSTOCK", icon: <AlertTriangle size={16} color="orange" /> },
]
//    const EmployeeStatus = [
    
//     { label: "accepted", value: "HIGHTSTOCK", icon: <UserCircle2 size={16} color="green" /> },
//     { label: "not accepted", value: "LOWSTOCK", icon: <UserX size={16} color="red" />   },
  
// ]
   const ImportExport = [
    
    { label: "import", icon: <Upload size={16} color="green" />, onClick: () => console.log("import clicked") },
    { label: "export", icon: <Download size={16} color="red" />, onClick: () => console.log("export clicked") },
  
]
  return (
    <div className="flex flex-col gap-3 w-full">
    
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        
      {/* left side */}
        <div className="max-w-2xl sm:flex-1">
          <Input
            name="search"
            value={searchValue}
            onChange={onSearchChange}
            placeholder={placeholder}
            leftIcon={<Search size={18} className="text-gray-400" />} 
            className="w-full bg-white"
          />
        </div>
  {/* right side */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">


          <div className="relative">
           
             <div className="relative">
                <ReusableSelect
                    onValueChange={() => ""}
                    options={InvetoryOption}
                   placeholder="Filter"
                />
             </div>
          </div>
          <div className="">
          
          <DropDown
          triggerIcon={<MoreVertical size={20} className="text-gray-500"/>}
          items={ImportExport}  
          
          />
          </div>
       
          
        </div>
      </div>
   
    </div>
  );
};

export default SearchActionCard;