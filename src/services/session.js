import { apiRequest } from "../api/client.js";
import { endpoints, GOOGLE_AUTH_START_URL } from "../api/endpoints.js";

const GUEST_TOKEN_KEY = "polyai_guest_token";

function isGuestTokenErrorMessage(message) {
  const normalized = String(message || "").toLowerCase();
  return normalized.includes("guest token invalid") || normalized.includes("guest token expired");
}

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
    const session = await apiRequest(endpoints.session);

    if (session?.authenticated && session?.role !== "guest") {
      clearGuestToken();
    }

    return session;
  } catch (error) {
    const message = String(error.message || "");
    const normalized = message.toLowerCase();

    if (isGuestTokenErrorMessage(message)) {
      clearGuestToken();
      return { authenticated: false, role: "guest", user_id: null };
    }

    if (message.includes("Provide either guest token or bearer/cookie token")) {
      clearGuestToken();

      try {
        const session = await apiRequest(endpoints.session);

        if (session?.authenticated && session?.role !== "guest") {
          clearGuestToken();
        }

        return session;
      } catch (retryError) {
        if (String(retryError.message || "").includes("401")) {
          return { authenticated: false, role: "guest", user_id: null };
        }

        return { authenticated: false, role: "guest", user_id: null };
      }
    }

    if (normalized.includes("401")) {
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

  clearGuestToken();
  return { authenticated: false, role: "guest", user_id: null };
}

export function buildGoogleLoginUrl() {
  clearGuestToken();

  const url = new URL(GOOGLE_AUTH_START_URL, window.location.origin);
  url.searchParams.set("return_to", "/");
  return url.toString();
}

export function isGuestTokenError(error) {
  return isGuestTokenErrorMessage(error?.message || "");
}
