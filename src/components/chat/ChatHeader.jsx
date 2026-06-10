import { PanelLeft } from "lucide-react";

export default function ChatHeader({ assistant, onOpenSidebar }) {
  return (
    <header className="chat-header">
      <button
        className="icon-button chat-header__toggle"
        type="button"
        aria-label="Відкрити список асистентів"
        onClick={onOpenSidebar}
      >
        <PanelLeft size={18} />
      </button>

      <h1>{assistant?.title || "Оберіть асистента"}</h1>
    </header>
  );
}