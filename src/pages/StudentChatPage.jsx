import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      const loadedMessages = await getChat(assistantId, studentId);
      if (!cancelled) {
        setMessages(loadedMessages);
      }
    }

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [assistantId, getChat, studentId]);

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} />

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
          <div className="teacher-student-chat__messages teacher-student-chat__messages--full">
            {messages.length === 0 ? <p className="teacher-muted">Повідомлень ще немає.</p> : null}
            {messages.map((message) => (
              <article className={`teacher-chat-message teacher-chat-message--${message.role}`} key={message.id || message.message_id}>
                {message.content}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
