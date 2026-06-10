import { X } from "lucide-react";
import AssistantList from "./AssistantList.jsx";

export default function AssistantSidebar({
  assistants,
  activeAssistantId,
  onSelectAssistant,
  isStudent,
  isOpen = false,
  onClose,
}) {
  const publicAssistants = assistants.filter((assistant) => assistant.is_public);
  const privateAssistants = assistants.filter((assistant) => !assistant.is_public);

  const handleSelectAssistant = (assistant) => {
    onSelectAssistant?.(assistant);
    onClose?.();
  };

  return (
    <>
      <button
        className={`assistant-sidebar__backdrop ${
          isOpen ? "assistant-sidebar__backdrop--open" : ""
        }`}
        type="button"
        aria-label="Закрити список асистентів"
        onClick={onClose}
      />

      <aside className={`assistant-sidebar ${isOpen ? "assistant-sidebar--open" : ""}`}>
        <div className="assistant-sidebar__top">
          <p className="assistant-sidebar__label">Асистенти</p>

          <button
            className="icon-button assistant-sidebar__close"
            type="button"
            aria-label="Закрити"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="assistant-sidebar__scroll">
          <section className="assistant-section assistant-section--static">
            <h2>Публічні асистенти</h2>
            <AssistantList
              assistants={publicAssistants}
              activeAssistantId={activeAssistantId}
              onSelectAssistant={handleSelectAssistant}
            />
          </section>

          {isStudent ? (
            <section className="assistant-section">
              <h2>Доступні Вам асистенти</h2>
              <AssistantList
                assistants={privateAssistants}
                activeAssistantId={activeAssistantId}
                onSelectAssistant={handleSelectAssistant}
              />
            </section>
          ) : (
            <div className="assistant-sidebar__hint">
              Увійдіть, щоб побачити асистентів, доступних вашому акаунту.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}