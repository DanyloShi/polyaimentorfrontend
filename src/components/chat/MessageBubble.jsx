export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`message-bubble ${isUser ? "message-bubble--user" : "message-bubble--assistant"}`}>
      <p>{message.content}</p>
    </article>
  );
}
