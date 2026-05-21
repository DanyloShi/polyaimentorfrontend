import ChatComposer from "./ChatComposer.jsx";
import ChatHeader from "./ChatHeader.jsx";
import EmptyChatState from "./EmptyChatState.jsx";
import MessageList from "./MessageList.jsx";

export default function ChatPanel({ assistant, messages, loading, onSendMessage }) {
  return (
    <main className="chat-panel">
      <ChatHeader assistant={assistant} />
      <div className="chat-panel__body">
        {loading ? (
          <div className="chat-panel__loading">Завантаження чату...</div>
        ) : messages.length ? (
          <MessageList messages={messages} />
        ) : (
          <EmptyChatState assistant={assistant} />
        )}
      </div>
      <ChatComposer disabled={!assistant || loading} onSendMessage={onSendMessage} />
    </main>
  );
}
