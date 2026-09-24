import { ENDPOINTS } from "@/services/endpoints";

let refreshPromise: Promise<string | null> | null = null;

export const getGatewayBaseUrl = (): string => {
  let url = (import.meta.env.VITE_GATEWAY_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

export const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return false;
    // 30 second safety margin
    return payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
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
    try {
      const parts = refreshToken.split(".");
      if (parts.length === 3) {
        const p = JSON.parse(atob(parts[1]));
        if (p.version) tokenVersion = p.version;
      }
    } catch {
      // ignore
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
