import { Info } from "lucide-react";
import { Tooltip } from "../../../components/common/Tootlip";
import { Required } from "@/components/ui/Require";

const FieldLabel = ({
  label,
  tooltip,
  required = false,
}: {
  label: string;
  tooltip: string;
  required?: boolean;
}) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
        {label}
        {required && <Required />}
      </span>

      <Tooltip message={tooltip}>
        <Info
          size={14}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
        />
      </Tooltip>
    </div>
  );
};

export default FieldLabel;
