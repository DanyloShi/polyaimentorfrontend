import AssistantList from "./AssistantList.jsx";

export default function AssistantSidebar({ assistants, activeAssistantId, onSelectAssistant, isStudent }) {
  const publicAssistants = assistants.filter((assistant) => assistant.is_public);
  const privateAssistants = assistants.filter((assistant) => !assistant.is_public);

  return (
    <aside className="assistant-sidebar">
      <div className="assistant-sidebar__top">
        <p className="assistant-sidebar__label">Асистенти</p>
      </div>

      <div className="assistant-sidebar__scroll">
        <section className="assistant-section assistant-section--static">
          <h2>Публічні асистенти</h2>
          <AssistantList assistants={publicAssistants} activeAssistantId={activeAssistantId} onSelectAssistant={onSelectAssistant} />
        </section>

        {isStudent ? (
          <section className="assistant-section">
            <h2>Доступні Вам асистенти</h2>
            <AssistantList assistants={privateAssistants} activeAssistantId={activeAssistantId} onSelectAssistant={onSelectAssistant} />
          </section>
        ) : (
          <div className="assistant-sidebar__hint">Увійдіть, щоб побачити асистентів, доступних вашому акаунту.</div>
        )}
      </div>
    </aside>
  );
}
