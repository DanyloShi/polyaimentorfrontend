import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.message_id} message={message} />
      ))}
    </div>
  );
}
