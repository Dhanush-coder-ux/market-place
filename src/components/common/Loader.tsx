import { Loader2 } from "lucide-react";

interface LoaderProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Loader({ className, style }: LoaderProps) {
  return (
    <div style={{ padding: "20px", textAlign: "center", ...style }} className="flex justify-center items-center">
      <Loader2 className={`animate-spin ${className || "h-8 w-8 text-blue-600"}`} />
    </div>
  );
}
