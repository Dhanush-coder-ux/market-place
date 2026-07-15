import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ActionMenuProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: number;
}

interface ActionMenuItemProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  icon,
  onClick,
  danger,
  disabled,
  children,
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold transition-colors ${
      disabled
        ? "text-slate-300 cursor-not-allowed"
        : danger
        ? "text-red-600 hover:bg-red-50"
        : "text-slate-700 hover:bg-slate-50"
    }`}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </button>
);

export const ActionMenuDivider: React.FC = () => (
  <div className="my-1 border-t border-slate-100" />
);

const ActionMenu: React.FC<ActionMenuProps> = ({
  triggerRef,
  open,
  onClose,
  children,
  align = "right",
  width = 168,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const el = triggerRef.current as HTMLElement;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = menuRef.current?.offsetHeight ?? 140;
    const showAbove = spaceBelow < menuHeight + 8;

    const top = showAbove
      ? rect.top + window.scrollY - menuHeight - 4
      : rect.bottom + window.scrollY + 4;

    const left =
      align === "right"
        ? Math.min(rect.right + window.scrollX - width, window.innerWidth - width - 8)
        : rect.left + window.scrollX;

    setPos({ top, left });
    setReady(true);
  }, [open, triggerRef, align, width]);

  useEffect(() => {
    if (!open) setReady(false);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          width,
          zIndex: 9999,
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(-4px)",
          transition: "opacity 120ms ease, transform 120ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-left font-sans"
      >
        {children}
      </div>
    </>,
    document.body
  );
};

export default ActionMenu;
