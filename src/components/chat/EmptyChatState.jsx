export default function EmptyChatState({ assistant }) {
  return (
    <section className="empty-chat">
      <h2>{assistant ? "Почніть діалог" : "Асистент не вибраний"}</h2>
      <p>{assistant ? "Напишіть перше питання, щоб отримати відповідь." : "Виберіть асистента зліва, щоб відкрити чат."}</p>
    </section>
  );
}
