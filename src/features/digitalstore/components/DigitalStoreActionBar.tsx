import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DigitalStoreActionBarProps {
  status?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Portals action buttons and status badges into the Digital Store's
 * fixed bottom action bar container.
 */
export function DigitalStoreActionBar({ status, children }: DigitalStoreActionBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  const statusEl = document.getElementById("digital-store-bottom-status");
  const actionsEl = document.getElementById("digital-store-bottom-actions");

  return (
    <>
      {status && statusEl ? createPortal(status, statusEl) : null}
      {children && actionsEl ? createPortal(children, actionsEl) : null}
    </>
  );
}

export default DigitalStoreActionBar;
