import { ENDPOINTS } from "@/services/endpoints";

let refreshPromise: Promise<string | null> | null = null;

export const getGatewayBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Check runtime window.__ENV__ if present
    const runtimeEnv = (window as any).__ENV__?.VITE_GATEWAY_URL;
    if (runtimeEnv && typeof runtimeEnv === "string" && runtimeEnv.trim()) {
      let rUrl = runtimeEnv.trim().replace(/\/+$/, "");
      if (!rUrl.endsWith("/api")) rUrl += "/api";
      return rUrl;
    }

    // Auto-detect production / development domain so build-time static env doesn't lock to localhost
    if (host !== "localhost" && host !== "127.0.0.1") {
      if (host.includes("dev.inventq.in") || host.includes("dev.app.inventq.in")) {
        return "https://dev.gateway.inventq.in/api";
      }
      if (host.includes("inventq.in")) {
        return "https://gateway.inventq.in/api";
      }
    }
  }

  let url = (import.meta.env.VITE_GATEWAY_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

/**
 * Safely parse standard Base64URL encoded JWT payload across all browsers
 */
export const parseJwtPayload = (token: string | null): any => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  // 30 second safety margin
  return payload.exp * 1000 <= Date.now() + 30_000;
};

export const clearAuthAndRedirect = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    window.location.href = "/login";
  }
};

export const refreshTokens = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    clearAuthAndRedirect();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    let tokenVersion = "1";
    const p = parseJwtPayload(refreshToken);
    if (p?.version) {
      tokenVersion = String(p.version);
    }

    try {
      const gatewayUrl = getGatewayBaseUrl();
      const res = await fetch(`${gatewayUrl}${ENDPOINTS.AUTH_TOKEN_REFRESH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, version: tokenVersion }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 400) {
          clearAuthAndRedirect();
        }
        return null;
      }

      const data = await res.json();
      if (!data?.access_token) {
        clearAuthAndRedirect();
        return null;
      }

      localStorage.setItem("auth_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      // Dispatch custom event to notify any active listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-token-refreshed", { detail: { token: data.access_token } }));
      }

      return data.access_token as string;
    } catch (err) {
      console.error("Token refresh network failure:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const ensureFreshToken = async (): Promise<string | null> => {
  const currentToken = localStorage.getItem("auth_token");
  if (isJwtExpired(currentToken)) {
    return await refreshTokens();
  }
  return currentToken;
};
