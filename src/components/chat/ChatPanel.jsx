import ChatComposer from "./ChatComposer.jsx";
import ChatHeader from "./ChatHeader.jsx";
import EmptyChatState from "./EmptyChatState.jsx";
import MessageList from "./MessageList.jsx";

export default function ChatPanel({ assistant, messages, loading, error, onSendMessage }) {
  return (
    <main className="chat-panel">
      <ChatHeader assistant={assistant} />
      <div className="chat-panel__body">
        {error ? <div className="chat-panel__error">{error}</div> : null}
        {messages.length ? <MessageList messages={messages} /> : <EmptyChatState assistant={assistant} />}
        {loading ? <div className="chat-panel__loading">Завантаження чату...</div> : null}
      </div>
      <ChatComposer disabled={!assistant || loading} onSendMessage={onSendMessage} />
    </main>
  );
}
