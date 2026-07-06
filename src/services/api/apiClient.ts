const BASE_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

interface RequestOptions {
  method: string;
  endpoint: string;
  body?: unknown;
  params?: Record<string, string>;
}

const parseError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return body?.detail?.msg ?? body?.detail ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

async function request(options: RequestOptions): Promise<any> {
  const { method, endpoint, body, params } = options;
  
  let url = `${BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }
  
  return await res.json();
}

/**
 * Send a multipart/form-data request (used for file uploads).
 * Does NOT set Content-Type — the browser auto-sets it with the boundary.
 */
async function requestFormData(endpoint: string, formData: FormData): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return await res.json();
}

export const apiClient = {
  get: (endpoint: string, params?: Record<string, string>) => request({ method: "GET", endpoint, params }),
  post: (endpoint: string, body: unknown, params?: Record<string, string>) => request({ method: "POST", endpoint, body, params }),
  put: (endpoint: string, body: unknown, params?: Record<string, string>) => request({ method: "PUT", endpoint, body, params }),
  delete: (endpoint: string, body?: unknown) => request({ method: "DELETE", endpoint, body }),
  /** DELETE with query params instead of body (e.g. image delete by URL) */
  deleteWithParams: (endpoint: string, params?: Record<string, string>) => request({ method: "DELETE", endpoint, params }),
  /** POST multipart form-data for file uploads */
  postFormData: (endpoint: string, formData: FormData) => requestFormData(endpoint, formData),
};
