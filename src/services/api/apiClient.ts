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

export const apiClient = {
  get: (endpoint: string, params?: Record<string, string>) => request({ method: "GET", endpoint, params }),
  post: (endpoint: string, body: unknown) => request({ method: "POST", endpoint, body }),
  put: (endpoint: string, body: unknown) => request({ method: "PUT", endpoint, body }),
  delete: (endpoint: string) => request({ method: "DELETE", endpoint }),
};
