export default function ChatHeader({ assistant }) {
  return (
    <header className="chat-header">
      <h1>{assistant?.title || "Оберіть асистента"}</h1>
    </header>
  );
}
