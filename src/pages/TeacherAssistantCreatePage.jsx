import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import AppHeader from "../components/header/AppHeader.jsx";
import { getAssistantCreateOptions } from "../services/teacher.js";

export default function TeacherAssistantCreatePage({
  session,
  onLogout,
  onNavigate,
  createAssistant,
  updateAssistant,
  loadAssistant,
  assistantId = "",
  mode = "create",
  backPath,
  eyebrow = "Новий асистент",
  titleText = "Створення асистента",
  description = "Задайте назву, модель і доступність. Документи та студентів можна буде додати після створення асистента.",
}) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState("");
  const [modelId, setModelId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(isEdit);

      const [options, assistant] = await Promise.all([
        getAssistantCreateOptions(),
        isEdit && assistantId && loadAssistant ? loadAssistant(assistantId) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      setModels(options.models || []);

      if (assistant) {
        setTitle(assistant.title || "");
        setModelId(assistant.model_id || options.models[0]?.id || "");
        setIsPublic(Boolean(assistant.is_public));
      } else {
        setModelId(options.models[0]?.id || "");
      }

      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [assistantId, isEdit, loadAssistant]);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || !modelId || submitting) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateAssistant(assistantId, {
          title: normalizedTitle,
          modelId,
          isPublic,
        });
      } else {
        await createAssistant({
          title: normalizedTitle,
          modelId,
          isPublic,
        });
      }

      onNavigate(backPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} showPanelShortcut={false} />

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
          {loading ? <p className="teacher-muted">Завантаження...</p> : null}

          <label>
            Назва
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Наприклад: Математичний асистент" />
          </label>

          <label>
            Модель
            <select value={modelId} onChange={(event) => setModelId(event.target.value)} disabled={loading}>
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

          <button className="button button--dark teacher-create-submit" type="submit" disabled={loading || submitting || !title.trim() || !modelId}>
            {submitting ? (isEdit ? "Збереження..." : "Створення...") : isEdit ? "Зберегти зміни" : "Створити асистента"}
          </button>
        </form>
      </main>
    </div>
  );
}
