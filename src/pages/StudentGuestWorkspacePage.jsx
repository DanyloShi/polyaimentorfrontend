import { useEffect, useState } from "react";
import AssistantSidebar from "../components/assistants/AssistantSidebar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ChatPanel from "../components/chat/ChatPanel.jsx";
import AppHeader from "../components/header/AppHeader.jsx";
import { getAssistantsForSession } from "../services/assistants.js";
import { getConversationForAssistant, sendMessageToAssistant } from "../services/chat.js";
import { clearGuestToken, createGuestSession, getGuestToken, logoutSession } from "../services/session.js";

const ACTIVE_ASSISTANT_KEY = "polyai_active_assistant_id";

export default function StudentGuestWorkspacePage({ session, onSessionChange, onNavigate }) {
  const [assistants, setAssistants] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (!chatError) return;

    const timeoutId = window.setTimeout(() => {
      setChatError("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [chatError]);

  const loadConversationForAssistant = async (assistant) => {
    if (!assistant) {
      setConversation(null);
      return;
    }

    setLoadingChat(true);

    try {
      const loadedConversation = await getConversationForAssistant(assistant.id);
      setConversation(loadedConversation);
    } catch (error) {
      setConversation({
        conversation_id: null,
        assistant_id: assistant.id,
        messages: [],
      });
      setChatError(String(error.message || "Не вдалося завантажити чат."));
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const loadedAssistants = await getAssistantsForSession(session);
      if (cancelled) return;

      setAssistants(loadedAssistants);

      const savedAssistantId = window.localStorage.getItem(ACTIVE_ASSISTANT_KEY);
      const firstAssistant =
        loadedAssistants.find((assistant) => assistant.id === savedAssistantId) ||
        loadedAssistants[0] ||
        null;

      setActiveAssistant(firstAssistant);

      if (firstAssistant) {
        await loadConversationForAssistant(firstAssistant);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleLogout = async () => {
    window.localStorage.removeItem(ACTIVE_ASSISTANT_KEY);
    clearGuestToken();
    onSessionChange(await logoutSession());
  };

  const handleSendMessage = async (message) => {
    if (!activeAssistant || sendingMessage) return false;

    const optimisticConversation = {
      conversation_id: conversation?.conversation_id || null,
      assistant_id: activeAssistant.id,
      messages: [
        ...(conversation?.messages || []),
        {
          message_id: `temp-${Date.now()}`,
          role: "user",
          content: message,
        },
      ],
    };

    setConversation(optimisticConversation);
    setSendingMessage(true);

    try {
      if (!session?.authenticated && !getGuestToken()) {
        await createGuestSession(activeAssistant.id);
      }

      const updatedConversation = await sendMessageToAssistant({
        assistantId: activeAssistant.id,
        conversationId: conversation?.conversation_id,
        message,
      });

      setConversation(updatedConversation);
      return true;
    } catch (error) {
      setChatError(String(error.message || "Не вдалося надіслати повідомлення."));
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectAssistant = (assistant) => {
    window.localStorage.setItem(ACTIVE_ASSISTANT_KEY, assistant.id);
    setActiveAssistant(assistant);
    loadConversationForAssistant(assistant);
  };

  const canSeePrivateAssistants = session?.authenticated && session?.role !== "guest";

  return (
    <div className="workspace">
      <AppHeader
        session={session}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
        onNavigate={onNavigate}
      />

      {chatError ? <div className="chat-toast">{chatError}</div> : null}

      <div className="workspace__content">
        <AssistantSidebar
          assistants={assistants}
          activeAssistantId={activeAssistant?.id}
          isStudent={canSeePrivateAssistants}
          onSelectAssistant={handleSelectAssistant}
        />
        <ChatPanel
          assistant={activeAssistant}
          loading={loadingChat}
          isAssistantThinking={sendingMessage}
          messages={conversation?.messages || []}
          onSendMessage={handleSendMessage}
        />
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}