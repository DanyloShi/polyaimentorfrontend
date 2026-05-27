import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import MessageList from "../components/chat/MessageList.jsx";
import AppHeader from "../components/header/AppHeader.jsx";

export default function StudentChatPage({
  session,
  onLogout,
  onNavigate,
  basePath,
  getChat,
  title = "Чат студента",
}) {
  const params = new URLSearchParams(window.location.search);
  const assistantId = params.get("assistant_id") || "";
  const studentId = params.get("student_id") || "";
  const studentEmail = params.get("student_email") || studentId || "student";
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      setLoading(true);
      try {
        const loadedMessages = await getChat(assistantId, studentId);
        if (!cancelled) {
          setMessages(
            (loadedMessages || []).map((message, index) => ({
              ...message,
              message_id: message.message_id || message.id || `${message.role}-${index}`,
            })),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [assistantId, getChat, studentId]);

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} showPanelShortcut={false} />

      <main className="teacher-chat-page">
        <header className="teacher-chat-topbar">
          <button className="icon-button teacher-chat-back" type="button" aria-label="Назад" onClick={() => onNavigate(basePath)}>
            <ArrowLeft size={18} />
          </button>

          <div className="teacher-chat-meta">
            <span>{title}</span>
            <strong>{studentEmail}</strong>
          </div>
        </header>

        <section className="teacher-chat-full" aria-label={`${title} ${studentEmail}`}>
          <div className="chat-panel__body teacher-chat-body">
            {messages.length ? (
              <MessageList messages={messages} />
            ) : (
              <div className="teacher-chat-empty">
                {loading ? "Завантаження чату..." : "Повідомлень ще немає."}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}