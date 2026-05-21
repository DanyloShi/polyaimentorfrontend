export default function AssistantListItem({ assistant, active, onClick }) {
  return (
    <button className={`assistant-row ${active ? "assistant-row--active" : ""}`} type="button" onClick={onClick}>
      <span>{assistant.title}</span>
    </button>
  );
}
