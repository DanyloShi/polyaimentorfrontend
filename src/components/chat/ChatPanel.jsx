import ChatComposer from "./ChatComposer.jsx";
import ChatHeader from "./ChatHeader.jsx";
import EmptyChatState from "./EmptyChatState.jsx";
import MessageList from "./MessageList.jsx";

function ThinkingIndicator() {
  return (
    <div className="thinking-indicator" aria-live="polite" aria-label="Асистент формує відповідь">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function ChatPanel({ assistant, messages, loading, isAssistantThinking, error, onSendMessage }) {
  return (
    <main className="chat-panel">
      <ChatHeader assistant={assistant} />

      <div className="chat-panel__body">
        {error ? <div className="chat-panel__error">{error}</div> : null}

        {messages.length ? <MessageList messages={messages} /> : <EmptyChatState assistant={assistant} />}

        {loading ? <div className="chat-panel__loading">Завантаження чату...</div> : null}
        {isAssistantThinking ? <ThinkingIndicator /> : null}
      </div>

      <ChatComposer
        disabled={!assistant || loading}
        submitDisabled={isAssistantThinking}
        onSendMessage={onSendMessage}
      />
    </main>
  );
}