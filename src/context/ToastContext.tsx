import { createContext, useContext, useCallback, ReactNode } from "react";
import { Toaster, dynaura, type ToastOptions } from "dynaura";
import "dynaura/styles.css";
import "./ToastContext.css";

export type ToastType = "success" | "error" | "info" | "warning" | "loading" | "progress";

export interface ToastContextType {
  /**
   * Main toast function - backwards compatible with all existing showToast(msg, type) calls across the entire codebase.
   */
  showToast: (
    message: string | any,
    type?: ToastType,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show a success toast with title, optional description, and extra options */
  showSuccess: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show an error toast with title, optional description, and extra options */
  showError: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show an info toast */
  showInfo: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show a warning toast */
  showWarning: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /**
   * Show a dynamic island progress bar toast (progress between 0..1 or 0..100)
   * Returns the toast id to allow calling updateProgress / completeProgress
   */
  showProgress: (
    title: string,
    progress?: number,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Update an ongoing progress toast */
  updateProgress: (
    id: string,
    progress: number,
    title?: string,
    description?: string
  ) => void;

  /** Complete an ongoing progress toast into a success toast with celebration */
  completeProgress: (
    id: string,
    title?: string,
    description?: string
  ) => void;

  /** Fail an ongoing progress toast into an error toast */
  failProgress: (
    id: string,
    title?: string,
    description?: string
  ) => void;

  /**
   * Track an asynchronous promise with auto morphing from loading -> success/error
   */
  showPromise: <T>(
    promise: Promise<T>,
    options: {
      loading: string | ToastOptions;
      success: string | ToastOptions | ((data: T) => string | ToastOptions);
      error: string | ToastOptions | ((err: any) => string | ToastOptions);
    }
  ) => Promise<T>;

  /** Dismiss a specific toast or current toast */
  dismissToast: (id?: string) => void;

  /** Clear all toasts */
  clearToasts: () => void;

  /** Direct dynaura instance */
  dynaura: typeof dynaura;
}

// ─── Message Extractor Helper ─────────────────────────────────────────────────

export function compactToastText(input: unknown, maxLen: number = 300): string {
  if (input === null || input === undefined) return "";
  let clean = String(input).trim();

  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen - 1).trimEnd() + "…";
  }
  return clean;
}

export function extractMessage(message: unknown): { title: string; description?: string } {
  if (typeof message === "string") {
    let trimmed = message.trim();

    // If string contains multiple lines, use first line as title and rest as description
    if (trimmed.includes("\n")) {
      const [first, ...rest] = trimmed.split("\n");
      const title = compactToastText(first, 180);
      const desc = compactToastText(rest.join("\n").trim(), 400);
      return { title, description: desc || undefined };
    }

    // Check for "Prefix: details" (e.g. "Validation Error: Email already exists")
    const colonIdx = trimmed.indexOf(": ");
    if (colonIdx > 0 && colonIdx <= 60 && !trimmed.slice(0, colonIdx).includes("http")) {
      const title = compactToastText(trimmed.slice(0, colonIdx), 180);
      const desc = compactToastText(trimmed.slice(colonIdx + 2), 400);
      if (desc) {
        return { title, description: desc };
      }
    }

    // Check for "First part; details" (e.g. "Payment failed; please try another card")
    const semiIdx = trimmed.indexOf("; ");
    if (semiIdx > 0 && semiIdx <= 60) {
      const title = compactToastText(trimmed.slice(0, semiIdx), 180);
      const desc = compactToastText(trimmed.slice(semiIdx + 2), 400);
      if (desc) {
        return { title, description: desc };
      }
    }

    // If string is long (> 60 chars) without newlines or colons,
    // split intelligently at sentence boundary if one exists early on
    if (trimmed.length > 60) {
      const sentenceEnd = trimmed.search(/[.!?]\s+/);
      if (sentenceEnd > 15 && sentenceEnd <= 70) {
        const title = compactToastText(trimmed.slice(0, sentenceEnd + 1), 180);
        const desc = compactToastText(trimmed.slice(sentenceEnd + 2), 400);
        if (desc) {
          return { title, description: desc };
        }
      }
    }

    // Otherwise allow title up to 180 characters, which wraps naturally in the UI
    return { title: compactToastText(trimmed, 180) };
  }

  if (message && typeof message === "object") {
    const obj = message as Record<string, any>;
    const titleCandidate =
      obj.title ||
      obj.msg ||
      obj.message ||
      obj.description ||
      obj.detail?.msg ||
      obj.detail?.description ||
      (typeof obj.detail === "string" ? obj.detail : null) ||
      (obj.error ? String(obj.error) : null) ||
      "Notification";

    const descCandidate =
      obj.description && obj.description !== titleCandidate
        ? String(obj.description)
        : obj.detail?.description && obj.detail.description !== titleCandidate
        ? String(obj.detail.description)
        : obj.detail && typeof obj.detail === "string" && obj.detail !== titleCandidate
        ? obj.detail
        : undefined;

    return {
      title: compactToastText(titleCandidate, 180),
      description: descCandidate ? compactToastText(descCandidate, 400) : undefined,
    };
  }

  return { title: compactToastText(String(message || ""), 180) };
}

// Normalize progress between 0 and 1
function normalizeProgress(p: number | undefined): number {
  if (p === undefined || isNaN(p)) return 0;
  const val = p > 1 ? p / 100 : p;
  return Math.max(0, Math.min(1, val));
}

// Global rate limiter to avoid spamming the same notification on double clicks
const recentToastsMap = new Map<string, number>();

function shouldRateLimit(key: string, cooldownMs = 1200): boolean {
  const now = Date.now();
  const last = recentToastsMap.get(key) || 0;
  if (now - last < cooldownMs) return true;
  recentToastsMap.set(key, now);
  // Clean map when it grows large
  if (recentToastsMap.size > 200) {
    for (const [k, ts] of recentToastsMap.entries()) {
      if (now - ts > 10000) recentToastsMap.delete(k);
    }
  }
  return false;
}

// ─── Standalone Global Notification Helper ────────────────────────────────────
// Can be called anywhere (even outside React components, e.g. in API interceptors)
export const toast = {
  show: (message: string | any, type: ToastType = "success", options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(message);
    const title = compactToastText(options?.title || extracted.title, 180);
    const description = (options?.description || extracted.description)
      ? compactToastText(options?.description || extracted.description, 400)
      : undefined;

    if (!title) return "";

    const key = `${type}:${title}:${description || ""}`;
    if (shouldRateLimit(key)) return "";

    const opts: ToastOptions = {
      duration: options?.duration ?? (type === "error" ? 6000 : 3800),
      ...options,
      title,
      description,
    };

    switch (type) {
      case "error":
        return dynaura.error(opts);
      case "warning":
        return dynaura.warning(opts);
      case "info":
        return dynaura.info(opts);
      case "loading":
        return dynaura.loading({ ...opts, duration: null });
      case "progress":
        return dynaura.loading({ ...opts, progress: normalizeProgress(options?.progress), duration: null });
      case "success":
      default:
        return dynaura.success(opts);
    }
  },

  success: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "success", options);
  },

  error: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "error", options);
  },

  info: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "info", options);
  },

  warning: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "warning", options);
  },

  progress: (
    title: string,
    progress: number = 0,
    description?: string,
    options?: Partial<ToastOptions>
  ): string => {
    const norm = normalizeProgress(progress);
    return dynaura.loading({
      progress: norm,
      duration: null,
      ...options,
      title: compactToastText(title, 180),
      description: description ? compactToastText(description, 400) : undefined,
    });
  },

  updateProgress: (
    id: string,
    progress: number,
    title?: string,
    description?: string
  ): void => {
    const norm = normalizeProgress(progress);
    dynaura.update(id, {
      progress: norm,
      ...(title ? { title: compactToastText(title, 180) } : {}),
      ...(description !== undefined ? { description: compactToastText(description, 400) } : {}),
    });
  },

  complete: (
    id: string,
    title: string = "Complete",
    description?: string
  ): void => {
    dynaura.update(id, {
      type: "success",
      title: compactToastText(title, 180),
      description: description ? compactToastText(description, 400) : undefined,
      progress: undefined,
      duration: 4000,
      confetti: true,
    });
  },

  fail: (
    id: string,
    title: string = "Failed",
    description?: string
  ): void => {
    dynaura.update(id, {
      type: "error",
      title: compactToastText(title, 180),
      description: description ? compactToastText(description, 400) : undefined,
      progress: undefined,
      duration: 6000,
    });
  },

  promise: dynaura.promise,
  dismiss: dynaura.dismiss,
  clear: dynaura.clear,
};

// ─── React Context ────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = useCallback(
    (message: string | any, type: ToastType = "success", options?: Partial<ToastOptions>): string => {
      return toast.show(message, type, options);
    },
    []
  );

  const showSuccess = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.success(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showError = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.error(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showInfo = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.info(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showWarning = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.warning(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showProgress = useCallback(
    (title: string, progress: number = 0, description?: string, options?: Partial<ToastOptions>): string => {
      return toast.progress(title, progress, description, options);
    },
    []
  );

  const updateProgress = useCallback(
    (id: string, progress: number, title?: string, description?: string): void => {
      toast.updateProgress(id, progress, title, description);
    },
    []
  );

  const completeProgress = useCallback(
    (id: string, title?: string, description?: string): void => {
      toast.complete(id, title, description);
    },
    []
  );

  const failProgress = useCallback(
    (id: string, title?: string, description?: string): void => {
      toast.fail(id, title, description);
    },
    []
  );

  const showPromise = useCallback(
    <T,>(
      promise: Promise<T>,
      options: {
        loading: string | ToastOptions;
        success: string | ToastOptions | ((data: T) => string | ToastOptions);
        error: string | ToastOptions | ((err: any) => string | ToastOptions);
      }
    ): Promise<T> => {
      return dynaura.promise(promise, options);
    },
    []
  );

  const dismissToast = useCallback((id?: string) => {
    dynaura.dismiss(id);
  }, []);

  const clearToasts = useCallback(() => {
    dynaura.clear();
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showProgress,
        updateProgress,
        completeProgress,
        failProgress,
        showPromise,
        dismissToast,
        clearToasts,
        dynaura,
      }}
    >
      {/* Dynamic Island Global Toaster mounted across all pages */}
      <Toaster
        position="top"
        theme="light"
        queue={true}
        offset={18}
      />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export { dynaura };
