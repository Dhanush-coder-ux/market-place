import React, { useEffect, useState, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';

interface NavigationBlockerProps {
  shouldBlock?: boolean;
  data?: any;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export const NavigationBlocker: React.FC<NavigationBlockerProps> = ({ shouldBlock, data, isLoading, isSubmitting }) => {
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef<string | null>(null);

  useEffect(() => {
    if (data === undefined) return;
    if (isLoading) return;

    const str = JSON.stringify(data);
    if (initialDataRef.current === null) {
      initialDataRef.current = str;
    } else {
      setIsDirty(initialDataRef.current !== str);
    }
  }, [data, isLoading]);

  const activeBlock = (shouldBlock !== undefined ? shouldBlock : isDirty) && !isSubmitting;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      activeBlock && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle native window/tab close or refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeBlock) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to show native browser prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeBlock]);

  return (
    <ConfirmDialog
      isOpen={blocker.state === 'blocked'}
      onClose={() => {
        if (blocker.state === 'blocked') {
          blocker.reset();
        }
      }}
      onConfirm={() => {
        if (blocker.state === 'blocked') {
          blocker.proceed();
        }
      }}
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost."
      confirmText="Leave Page"
      cancelText="Stay"
      type="warning"
    />
  );
};
