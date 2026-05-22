import { useEffect, useState } from "react";
import AssistantSidebar from "../components/assistants/AssistantSidebar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ChatPanel from "../components/chat/ChatPanel.jsx";
import AppHeader from "../components/header/AppHeader.jsx";
import { getAssistantsForSession } from "../services/assistants.js";
import { getConversationForAssistant, sendMessageToAssistant } from "../services/chat.js";
import { clearGuestToken, createGuestSession, getGuestToken, logoutSession } from "../services/session.js";

export default function StudentGuestWorkspacePage({ session, onSessionChange, onNavigate }) {
  const [assistants, setAssistants] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const loadConversationForAssistant = async (assistant) => {
    if (!assistant) {
      setConversation(null);
      return;
    }

    setLoadingChat(true);
    try {
      const loadedConversation = await getConversationForAssistant(assistant.id);
      setConversation(loadedConversation);
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
      const firstAssistant = loadedAssistants[0] || null;
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
    clearGuestToken();
    onSessionChange(await logoutSession());
  };

  const handleSendMessage = async (message) => {
    if (!activeAssistant) return;

    setLoadingChat(true);

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
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSelectAssistant = (assistant) => {
    if (!session?.authenticated && activeAssistant?.id !== assistant.id) {
      clearGuestToken();
    }
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
          messages={conversation?.messages || []}
          onSendMessage={handleSendMessage}
        />
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
