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
