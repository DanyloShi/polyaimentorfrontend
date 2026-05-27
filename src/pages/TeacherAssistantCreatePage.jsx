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
  getAssistantSystemPrompt,
  setAssistantSystemPrompt,
  getPromptSourceAssistants,
  assistantId = "",
  mode = "create",
  backPath,
  eyebrow = "Новий асистент",
  titleText = "Створення асистента",
  description = "Задайте назву, модель, доступність і системний промпт.",
}) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState("");
  const [modelId, setModelId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [sourceAssistants, setSourceAssistants] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(isEdit);
  const [copyingFromAssistantId, setCopyingFromAssistantId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(isEdit);
      setLoadingPrompt(isEdit);

      const [options, assistant, promptSources] = await Promise.all([
        getAssistantCreateOptions(),
        isEdit && assistantId && loadAssistant ? loadAssistant(assistantId) : Promise.resolve(null),
        getPromptSourceAssistants ? getPromptSourceAssistants(assistantId) : Promise.resolve([]),
      ]);

      if (cancelled) return;

      setModels(options.models || []);
      setSourceAssistants(promptSources || []);

      if (assistant) {
        setTitle(assistant.title || "");
        setModelId(assistant.model_id || options.models[0]?.id || "");
        setIsPublic(Boolean(assistant.is_public));

        if (getAssistantSystemPrompt) {
          const promptResponse = await getAssistantSystemPrompt(assistant.id);
          if (!cancelled) {
            setSystemPrompt(promptResponse?.content || "");
          }
        }
      } else {
        setModelId(options.models[0]?.id || "");
      }

      if (!cancelled) {
        setLoading(false);
        setLoadingPrompt(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [assistantId, isEdit, loadAssistant, getAssistantSystemPrompt, getPromptSourceAssistants]);

  const handlePickPromptFromAssistant = async (sourceAssistant) => {
    if (!getAssistantSystemPrompt) return;

    setCopyingFromAssistantId(sourceAssistant.id);
    try {
      const response = await getAssistantSystemPrompt(sourceAssistant.id);
      setSystemPrompt(response?.content || "");
      setPickerOpen(false);
    } finally {
      setCopyingFromAssistantId("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedPrompt = systemPrompt.trim();

    if (!normalizedTitle || !modelId || submitting) return;

    setSubmitting(true);
    try {
      let savedAssistant;

      if (isEdit) {
        savedAssistant = await updateAssistant(assistantId, {
          title: normalizedTitle,
          modelId,
          isPublic,
        });
      } else {
        savedAssistant = await createAssistant({
          title: normalizedTitle,
          modelId,
          isPublic,
        });
      }

      if (normalizedPrompt && setAssistantSystemPrompt && savedAssistant?.id) {
        await setAssistantSystemPrompt(savedAssistant.id, normalizedPrompt);
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

          <label className="teacher-create-form__prompt">
            Системний промпт
            <div className="teacher-prompt-box">
              <div className="teacher-prompt-box__toolbar">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setPickerOpen((value) => !value)}
                >
                  Вибрати з іншого асистента
                </button>
                <span className="teacher-muted">
                  Тут можна або написати власний промпт, або скопіювати його з іншого доступного асистента.
                </span>
              </div>

              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Опишіть роль асистента, стиль відповідей, обмеження, вимоги до структури пояснень, правила безпеки тощо."
                rows={12}
                className="teacher-prompt-box__textarea"
              />

              {pickerOpen ? (
                <div className="teacher-prompt-picker">
                  <strong>Доступні асистенти</strong>

                  {sourceAssistants.length === 0 ? (
                    <p className="teacher-muted">Немає інших доступних асистентів, з яких можна взяти системний промпт.</p>
                  ) : (
                    <div className="teacher-prompt-picker__list">
                      {sourceAssistants.map((assistant) => (
                        <div key={assistant.id} className="teacher-prompt-picker__item">
                          <div>
                            <strong>{assistant.title}</strong>
                            <span className="teacher-muted">ID: {assistant.id}</span>
                          </div>

                          <button
                            type="button"
                            className="button button--ghost"
                            disabled={copyingFromAssistantId === assistant.id}
                            onClick={() => handlePickPromptFromAssistant(assistant)}
                          >
                            {copyingFromAssistantId === assistant.id ? "Завантаження..." : "Взяти промпт"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <button className="button button--dark teacher-create-submit" type="submit" disabled={loading || submitting || !title.trim() || !modelId}>
            {submitting ? (isEdit ? "Збереження..." : "Створення...") : isEdit ? "Зберегти зміни" : "Створити асистента"}
          </button>
        </form>
      </main>
    </div>
  );
}
