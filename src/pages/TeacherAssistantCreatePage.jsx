import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import AppHeader from "../components/header/AppHeader.jsx";
import { getAssistantCreateOptions } from "../services/teacher.js";

export default function TeacherAssistantCreatePage({
  session,
  onLogout,
  onNavigate,
  createAssistant,
  backPath,
  eyebrow = "Новий асистент",
  titleText = "Створення асистента",
  description = "Задайте назву, модель і доступність. Документи та студентів можна буде додати після створення.",
}) {
  const [title, setTitle] = useState("");
  const [modelId, setModelId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const options = await getAssistantCreateOptions();
      if (cancelled) return;
      setModels(options.models);
      setModelId(options.models[0]?.id || "");
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || !modelId) return;

    await createAssistant({ title: normalizedTitle, modelId, isPublic });
    onNavigate(backPath);
  };

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} />

      <main className="teacher-create-page">
        <button className="button button--ghost teacher-back teacher-back--compact" type="button" onClick={() => onNavigate(backPath)}>
          <ArrowLeft size={17} />
          Назад
        </button>

        <section className="teacher-create-intro" aria-labelledby="teacher-create-title">
          <p>{eyebrow}</p>
          <h1 id="teacher-create-title">{titleText}</h1>
          <span>{description}</span>
        </section>

        <form className="teacher-create-form" onSubmit={submit}>
          <label>
            Назва
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Наприклад: Математичний асистент" />
          </label>

          <label>
            Модель
            <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.model_name} ({model.provider})
                </option>
              ))}
            </select>
          </label>

          <label className="teacher-checkbox">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            Зробити асистента публічним
          </label>

          <button className="button button--dark teacher-create-submit" type="submit" disabled={!title.trim() || !modelId}>
            Створити асистента
          </button>
        </form>
      </main>
    </div>
  );
}
