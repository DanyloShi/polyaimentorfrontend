import { Folder, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import AssistantShareModal from "./AssistantShareModal.jsx";

function ShareGlyph(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M7 13H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

function groupAssistants(assistants, groups) {
  const groupsById = new Map(groups.map((group) => [group.id, { ...group, assistants: [] }]));
  const ungrouped = [];

  assistants.forEach((assistant) => {
    const group = assistant.assistant_group_id ? groupsById.get(assistant.assistant_group_id) : null;
    if (group) {
      group.assistants.push(assistant);
    } else {
      ungrouped.push(assistant);
    }
  });

  return {
    groups: [...groupsById.values()],
    ungrouped,
  };
}

export default function AssistantTreeList({
  assistants,
  groups,
  activeAssistantId,
  onSelectAssistant,
  onDeleteAssistant,
  onEditGroup,
}) {
  const grouped = groupAssistants(assistants, groups);
  const [shareAssistant, setShareAssistant] = useState(null);

  if (!assistants.length && !groups.length) {
    return <p className="teacher-muted">Асистентів ще немає.</p>;
  }

  const renderAssistant = (assistant, nested = false) => (
    <div
      className={`teacher-assistant-row ${nested ? "teacher-assistant-row--nested" : ""} ${assistant.id === activeAssistantId ? "teacher-assistant-row--active" : ""}`}
      key={assistant.id}
    >
      <button className="teacher-assistant" type="button" onClick={() => onSelectAssistant(assistant)}>
        {assistant.title}
      </button>

      <div className="teacher-assistant__actions">
        <button
          className="icon-button teacher-icon-button--share"
          type="button"
          aria-label="Поширити асистента"
          onClick={() => setShareAssistant(assistant)}
        >
          <ShareGlyph className="teacher-share-glyph" />
        </button>

        <button
          className="icon-button teacher-icon-button--danger"
          type="button"
          aria-label="Видалити асистента"
          onClick={() => onDeleteAssistant(assistant)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="teacher-assistant-tree">
        {grouped.groups.map((group) => (
          <section className="teacher-assistant-group" key={group.id}>
            <div className="teacher-assistant-group__header">
              <div className="teacher-assistant-group__title">
                <Folder size={16} />
                <span>{group.title}</span>
              </div>
              <button className="icon-button" type="button" aria-label="Редагувати групу" onClick={() => onEditGroup(group)}>
                <Pencil size={15} />
              </button>
            </div>

            <div className="teacher-assistant-group__items">
              {group.assistants.length ? (
                group.assistants.map((assistant) => renderAssistant(assistant, true))
              ) : (
                <p className="teacher-assistant-group__empty">Немає асистентів</p>
              )}
            </div>
          </section>
        ))}

        {grouped.ungrouped.length ? (
          <section className="teacher-assistant-group teacher-assistant-group--plain">
            {grouped.groups.length ? <p className="teacher-assistant-group__label">Без групи</p> : null}
            {grouped.ungrouped.map((assistant) => renderAssistant(assistant))}
          </section>
        ) : null}
      </div>

      <AssistantShareModal
        assistant={shareAssistant}
        onClose={() => setShareAssistant(null)}
      />
    </>
  );
}