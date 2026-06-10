import { useEffect, useRef } from "react";
import ChatComposer from "./ChatComposer.jsx";
import ChatHeader from "./ChatHeader.jsx";
import EmptyChatState from "./EmptyChatState.jsx";
import MessageList from "./MessageList.jsx";

function ThinkingIndicator() {
  return (
    <div
      className="thinking-indicator"
      aria-live="polite"
      aria-label="Асистент формує відповідь"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

export default function ChatPanel({
  assistant,
  messages,
  loading,
  isAssistantThinking,
  onSendMessage,
  onOpenSidebar,
}) {
  const bodyRef = useRef(null);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isAssistantThinking]);

  return (
    <main className="chat-panel">
      <ChatHeader assistant={assistant} onOpenSidebar={onOpenSidebar} />

      <div ref={bodyRef} className="chat-panel__body">
        {messages.length ? (
          <MessageList messages={messages}>
            {isAssistantThinking ? <ThinkingIndicator /> : null}
          </MessageList>
        ) : (
          <EmptyChatState assistant={assistant} />
        )}
        {loading ? <div className="chat-panel__loading">Завантаження чату...</div> : null}
      </div>

      <ChatComposer
        disabled={!assistant || loading}
        submitDisabled={isAssistantThinking}
        onSendMessage={onSendMessage}
      />
    </main>
  );
}