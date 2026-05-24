import { apiRequest } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import { clearGuestToken, createGuestSession, getGuestToken, isGuestTokenError } from "./session.js";

export async function getConversationForAssistant(assistantId) {
  try {
    return await apiRequest(endpoints.conversationByAssistant(assistantId));
  } catch (error) {
    const message = String(error.message || "").toLowerCase();

    if (message.includes("not found") || message.includes("401") || message.includes("authorization")) {
      return {
        conversation_id: null,
        assistant_id: assistantId,
        messages: [],
      };
    }

    throw error;
  }
}

export async function sendMessageToAssistant({ assistantId, conversationId, message }) {
  async function executeSend() {
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const started = await apiRequest(endpoints.startConversation, {
        method: "POST",
        body: JSON.stringify({ assistant_id: assistantId }),
      });
      activeConversationId = started.conversation_id;
    }

    await apiRequest(endpoints.messages(activeConversationId), {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    return await apiRequest(endpoints.conversationByAssistant(assistantId));
  }

  if (!getGuestToken()) {
    await createGuestSession(assistantId);
  }

  try {
    return await executeSend();
  } catch (error) {
    if (!isGuestTokenError(error)) {
      throw error;
    }

    clearGuestToken();
    await createGuestSession(assistantId);
    return await executeSend();
  }
}
