export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api";
export const GOOGLE_AUTH_START_URL =
  import.meta.env.VITE_GOOGLE_AUTH_START_URL || `${API_BASE_URL}/auth/google/start`;

export const endpoints = {
  session: "/auth/session",
  logout: "/auth/logout",
  guest: "/auth/guest",
  googleStart: "/auth/google/start",
  publicAssistants: "/assistants/public",
  privateAssistants: "/assistants/",
  assistantAccess: (assistantId) => `/assistants/${assistantId}/access`,
  documents: "/documents/",
  uploadDocument: "/documents/upload",
  deleteDocument: (sourceId) => `/documents/${sourceId}`,
  startConversation: "/chat/start",
  conversationByAssistant: (assistantId) => `/chat/by-assistant?assistant_id=${encodeURIComponent(assistantId)}`,
  messages: (conversationId) => `/chat/${conversationId}/messages`,
  models: "/models/",
  modelById: (modelId) => `/models/${modelId}`,
  adminSafetyEvents: "/admin/safety-events/",
  assistantSystemPrompt: (assistantId) => `/prompts/assistants/${assistantId}/system`,
};