import { getToken } from "./auth";

export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
// export const API_BASE_URL = "https://zbkv8n9p-8000.inc1.devtunnels.ms/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}