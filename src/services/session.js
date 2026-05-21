import { apiRequest } from "../api/client.js";
import { endpoints, GOOGLE_AUTH_START_URL } from "../api/endpoints.js";

const GUEST_TOKEN_KEY = "polyai_guest_token";

export function getGuestToken() {
  return window.localStorage.getItem(GUEST_TOKEN_KEY) || "";
}

export function clearGuestToken() {
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

export async function createGuestSession(assistantId = null) {
  const data = await apiRequest(endpoints.guest, {
    method: "POST",
    body: JSON.stringify({ assistant_id: assistantId }),
  });

  if (data?.guest_token) {
    window.localStorage.setItem(GUEST_TOKEN_KEY, data.guest_token);
  }

  return data;
}

export async function getCurrentSession() {
  try {
    return await apiRequest(endpoints.session);
  } catch (error) {
    if (String(error.message || "").includes("401")) {
      return { authenticated: false, role: "guest", user_id: null };
    }
    return { authenticated: false, role: "guest", user_id: null };
  }
}

export async function logoutSession() {
  try {
    await apiRequest(endpoints.logout, { method: "POST" });
  } catch {
    // no-op
  }
  return { authenticated: false, role: "guest", user_id: null };
}

export function buildGoogleLoginUrl() {
  const url = new URL(GOOGLE_AUTH_START_URL, window.location.origin);
  url.searchParams.set("return_to", "/");
  return url.toString();
}
