import React, { useState, useRef, useEffect } from "react";
import {
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Trophy,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

type Status =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "LOST"
  | "NOT-ACTIVATED"
  | "WON"
  | "FULL PAYMENT RECEIVED"
  | "NOT PAID"
  | "ACTIVATED"
  | "COMPLETED"
  | "INCOMPLETED"
  | "OPEN";

interface StatusBadgeProps {
  status: Status;
  onStatusChange: (status: Status) => void;
  isEditable?: boolean;
}

interface StatusConfig {
  color: string;
  icon: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onStatusChange,
  isEditable = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const config: Record<Status, StatusConfig> = {
    NEW: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <UserPlus size={14} />,
    },
    CONTACTED: {
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock size={14} />,
    },
    QUALIFIED: {
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: <Circle size={14} />,
    },
    LOST: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <XCircle size={14} />,
    },
    "NOT-ACTIVATED": {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <XCircle size={14} />,
    },
    WON: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: <Trophy size={14} />,
    },
    "FULL PAYMENT RECEIVED": {
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 size={14} />,
    },
    "NOT PAID": {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertCircle size={14} />,
    },
    ACTIVATED: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle2 size={14} />,
    },
    COMPLETED: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle2 size={14} />,
    },
    INCOMPLETED: {
      color: "bg-orange-100 text-orange-700 border-orange-200",
      icon: <AlertCircle size={14} />,
    },
    OPEN: {
      color: "bg-yellow-100 text-yellow-700 border-gray-200",
      icon: <Circle size={14} />,
    },
  };

  const current = config[status] || config.OPEN;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        disabled={!isEditable}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider
          transition-all duration-200
          ${current.color}
          ${isEditable ? "hover:shadow-md cursor-pointer" : "cursor-default"}
        `}
      >
        {current.icon}
        {status}

        {isEditable && (
          <ChevronDown
            size={12}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && isEditable && (
        <div className="absolute left-0 mt-2 w-40 z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {Object.keys(config).map((key) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange(key as Status);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className={config[key as Status].color.split(" ")[1]}>
                {config[key as Status].icon}
              </span>
              {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;