import React from 'react';

type AntBadgeType = 'pill' | 'mini' | 'tag' | 'otag' | 'dash';

interface AntBadgeProps {
  variant: 
    | 'tx-purchase' | 'tx-sales' | 'tx-sales-return' | 'tx-purchase-return' | 'tx-opening' | 'tx-adjustment'
    | 'dt-purchase' | 'dt-sales' | 'dt-sales-return' | 'dt-purchase-return' | 'dt-opening' | 'dt-adjustment'
    | 'lb-gst' | 'lb-variant' | 'lb-batch' | 'lb-serial' | 'lb-brand' | 'lb-product-active' | 'lb-product-archived' | 'lb-store-online' | 'lb-store-offline'
    | 'ps-completed' | 'ps-draft' | 'ps-cancelled'
    | 'pay-paid' | 'pay-partial' | 'pay-pending' | 'pay-outstanding-increment' | 'pay-outstanding-decrement' | 'pay-outstanding-direct'
    | 'stk-in-stock' | 'stk-low-stock' | 'stk-out-of-stock' | 'stk-never-stocked' | 'stk-not-tracked'
    | 'flag-overdue' | 'meta-version' | 'tag-returned' | 'meta-corrected' | 'meta-variant' | string;
  type?: AntBadgeType;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export const AntBadge: React.FC<AntBadgeProps> = ({
  variant,
  type = 'pill',
  children,
  icon,
  className = '',
  dot = false,
  pulse = false
}) => {
  let baseClass = '';
  let inlineStyles: React.CSSProperties = {};
  
  // Note: we fetch CSS variable values directly
  if (type === 'pill') {
    baseClass = 'ant-pill';
    inlineStyles = {
      backgroundColor: `var(--${variant}-bg, var(--${variant}))`,
      borderColor: `var(--${variant}-bd)`,
      color: `var(--${variant}-tx)`
    };
  } else if (type === 'mini') {
    baseClass = 'ant-mini';
    inlineStyles = {
      color: `var(--${variant}-tx)`
    };
  } else if (type === 'tag') {
    baseClass = 'ant-vtag';
    inlineStyles = {
      backgroundColor: `var(--${variant}-bg, var(--${variant}))`,
      borderColor: `var(--${variant}-bd)`,
      color: `var(--${variant}-tx)`
    };
  } else if (type === 'otag') {
    baseClass = 'ant-otag';
    inlineStyles = {
      borderColor: `var(--${variant}-bd)`,
      color: `var(--${variant}-tx)`
    };
  } else if (type === 'dash') {
    baseClass = 'ant-pill ant-dash';
    inlineStyles = {
      borderColor: `var(--${variant}-bd)`,
      color: `var(--${variant}-tx)`
    };
  }

  // Handle dot colors
  const hasDot = dot || ['ps-completed', 'ps-draft', 'ps-cancelled', 'pay-paid', 'pay-partial', 'pay-pending', 'stk-in-stock', 'stk-low-stock', 'stk-out-of-stock', 'stk-never-stocked'].includes(variant) || variant.startsWith('dt-') || (variant.startsWith('tx-') && dot);
  
  let dotStyles: React.CSSProperties = {};
  if (hasDot) {
    dotStyles = {
      backgroundColor: `var(--${variant}-dot)`
    };
  }

  return (
    <span className={`${baseClass} ${className}`} style={inlineStyles}>
      {icon && icon}
      {hasDot && <span className={`ant-dot ${pulse ? 'animate-pulse' : ''}`} style={dotStyles} />}
      {children}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{
  status?: string;
  outstanding?: number;
  grandTotal?: number;
  className?: string;
}> = ({ status, outstanding, grandTotal, className }) => {
  let displayStatus = (status || "UNPAID").toUpperCase();

  if (displayStatus !== "CANCELLED" && displayStatus !== "CANCELED" && displayStatus !== "CANCEL") {
    if (outstanding !== undefined && grandTotal !== undefined && grandTotal > 0) {
      if (outstanding <= 0) {
        displayStatus = "PAID";
      } else if (outstanding > 0 && grandTotal > outstanding) {
        displayStatus = "PARTIAL";
      } else if (outstanding >= grandTotal) {
        displayStatus = "UNPAID";
      }
    }

    if (displayStatus === "OUTSTANDING") {
      displayStatus = "UNPAID";
    }
  }

  let variant: any = "pay-pending";
  if (displayStatus === "PAID" || displayStatus === "COMPLETED") {
    variant = "pay-paid";
  } else if (displayStatus === "PARTIAL" || displayStatus === "PARTIALLY_PAID" || displayStatus === "PARTIALLY PAID") {
    variant = "pay-partial";
  } else if (displayStatus === "UNPAID" || displayStatus === "DUE" || displayStatus === "PENDING") {
    variant = "pay-pending";
  } else if (displayStatus === "CANCELLED" || displayStatus === "CANCELED" || displayStatus === "CANCEL") {
    variant = "ps-cancelled";
    displayStatus = "CANCELLED";
  }

  const label = displayStatus === "PARTIALLY_PAID" || displayStatus === "PARTIALLY PAID" ? "PARTIAL" : displayStatus;

  return <AntBadge variant={variant} type="pill" dot className={className}>{label}</AntBadge>;
};

