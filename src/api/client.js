import { API_BASE_URL } from "./endpoints.js";

function getStoredGuestToken() {
  return window.localStorage.getItem("polyai_guest_token") || "";
}

export async function readResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error((typeof body === "string" ? body : body?.message || body?.detail) || `HTTP ${response.status}`);
  }

  return body;
}
