import AssistantListItem from "./AssistantListItem.jsx";

export default function AssistantList({ assistants, activeAssistantId, onSelectAssistant }) {
  if (!assistants.length) {
    return <p className="assistant-list__empty">Немає асистентів</p>;
  }

  return (
    <div className="assistant-list">
      {assistants.map((assistant) => (
        <AssistantListItem
          key={assistant.id}
          assistant={assistant}
          active={assistant.id === activeAssistantId}
          onClick={() => onSelectAssistant(assistant)}
        />
      ))}
    </div>
  );
}
