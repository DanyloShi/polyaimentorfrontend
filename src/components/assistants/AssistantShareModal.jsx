import { Check, Copy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function buildAssistantShareLink(assistant) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  if (!assistant || !origin) {
    return "";
  }

  // Тимчасовий frontend-only формат.
  // Коли з'явиться API, заміни це на реальне share-посилання.
  return `${origin}/share/assistants/${assistant.id}`;
}

async function copyText(value) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("input");
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

export default function AssistantShareModal({ assistant, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => buildAssistantShareLink(assistant), [assistant]);

  useEffect(() => {
    setCopied(false);
  }, [assistant]);

  if (!assistant) return null;

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await copyText(shareLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="login-modal teacher-share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-share-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button login-modal__close"
          type="button"
          aria-label="Закрити"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2 id="assistant-share-title">Поширити асистента</h2>
        <p>
          Асистент <strong>{assistant.title}</strong>. Поки що це frontend-only
          посилання без підключеного API.
        </p>

        <label className="teacher-share-modal__field">
          <span>Посилання</span>
          <input type="text" value={shareLink} readOnly />
        </label>

        <div className="teacher-share-modal__actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Закрити
          </button>

          <button className="button button--dark" type="button" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Скопійовано" : "Копіювати посилання"}
          </button>
        </div>
      </section>
    </div>
  );
}