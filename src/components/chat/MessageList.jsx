import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, children }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.message_id} message={message} />
      ))}
      {children}
    </div>
  );
}
