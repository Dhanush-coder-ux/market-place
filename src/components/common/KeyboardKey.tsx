import React from "react";

interface KeyboardKeyProps {
  combo?: string;
  keys?: string[];
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// Detect Mac platform
const isMac = typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

export const formatKeyPart = (part: string): { display: string; symbol?: string } => {
  const p = part.toLowerCase().trim();
  switch (p) {
    case "ctrl":
    case "control":
      return isMac ? { display: "⌘", symbol: "cmd" } : { display: "Ctrl" };
    case "cmd":
    case "command":
    case "meta":
      return { display: "⌘", symbol: "cmd" };
    case "alt":
    case "option":
      return isMac ? { display: "⌥", symbol: "opt" } : { display: "Alt" };
    case "shift":
      return { display: isMac ? "⇧" : "Shift", symbol: "shift" };
    case "enter":
    case "return":
      return { display: isMac ? "↵" : "Enter" };
    case "escape":
    case "esc":
      return { display: "Esc" };
    case "space":
      return { display: "Space" };
    case "arrowup":
    case "up":
      return { display: "↑" };
    case "arrowdown":
    case "down":
      return { display: "↓" };
    case "arrowleft":
    case "left":
      return { display: "←" };
    case "arrowright":
    case "right":
      return { display: "→" };
    case "backspace":
      return { display: "⌫" };
    case "delete":
    case "del":
      return { display: "Del" };
    case "tab":
      return { display: "Tab" };
    case "/":
    case "slash":
      return { display: "/" };
    default:
      return { display: p.toUpperCase() };
  }
};

export const KeyboardKey: React.FC<KeyboardKeyProps> = ({
  combo,
  keys,
  size = "sm",
  className = "",
}) => {
  const parts = keys || (combo ? combo.split("+").map((s) => s.trim()) : []);

  if (parts.length === 0) return null;

  const sizeClasses = {
    xs: "px-1 py-0.5 text-[9px] min-w-[16px] h-4",
    sm: "px-1.5 py-0.5 text-[10.5px] min-w-[20px] h-5",
    md: "px-2 py-1 text-xs min-w-[24px] h-6.5",
    lg: "px-2.5 py-1.5 text-sm min-w-[28px] h-8",
  };

  return (
    <span className={`inline-flex items-center gap-1 select-none font-mono ${className}`}>
      {parts.map((part, idx) => {
        const { display } = formatKeyPart(part);
        return (
          <React.Fragment key={idx}>
            <kbd
              className={`inline-flex items-center justify-center font-bold tracking-tight text-slate-700 bg-white border border-slate-300 rounded shadow-[0_1.5px_0_1px_rgba(0,0,0,0.08)] ${sizeClasses[size]}`}
            >
              {display}
            </kbd>
            {idx < parts.length - 1 && (
              <span className="text-[10px] font-bold text-slate-400 leading-none">+</span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default KeyboardKey;

