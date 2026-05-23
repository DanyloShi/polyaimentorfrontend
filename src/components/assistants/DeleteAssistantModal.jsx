import { X } from "lucide-react";

export default function DeleteAssistantModal({ assistant, deleting, onCancel, onConfirm }) {
  if (!assistant) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !deleting && onCancel()}>
      <section className="login-modal teacher-delete-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button login-modal__close" type="button" aria-label="Закрити" onClick={onCancel} disabled={deleting}>
          <X size={18} />
        </button>

        <h2>Видалити асистента?</h2>
        <p>
          Асистент <strong>{assistant.title}</strong> буде видалений назавжди. Цю дію не можна скасувати.
        </p>

        <div className="teacher-delete-modal__actions">
          <button className="button button--ghost" type="button" onClick={onCancel} disabled={deleting}>
            Скасувати
          </button>
          <button className="button teacher-button--danger" type="button" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Видалення..." : "Видалити асистента"}
          </button>
        </div>
      </section>
    </div>
  );
}