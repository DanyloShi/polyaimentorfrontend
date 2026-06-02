import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppHeader from "../components/header/AppHeader.jsx";
import { getAssistantCreateOptions, sendAssistantPreviewMessage } from "../services/teacher.js";

export default function TeacherAssistantCreatePage({
  session,
  onLogout,
  onNavigate,
  createAssistant,
  updateAssistant,
  loadAssistant,
  getAssistantSystemPrompt,
  setAssistantSystemPrompt,
  deleteAssistantSystemPrompt,
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
  const [systemPrompt, setSystemPrompt] = useState("");
  const [existingPromptId, setExistingPromptId] = useState("");

  const [models, setModels] = useState([]);
  const [sourceAssistants, setSourceAssistants] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [loadingPrompt, setLoadingPrompt] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [copyingFromAssistantId, setCopyingFromAssistantId] = useState("");
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewSending, setPreviewSending] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewBodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(isEdit);
      setLoadingPrompt(isEdit);

      try {
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
            if (cancelled) return;

            setSystemPrompt(promptResponse?.content || "");
            setExistingPromptId(promptResponse?.prompt_id || "");
          }
        } else {
          setModelId(options.models[0]?.id || "");
          setSystemPrompt("");
          setExistingPromptId("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingPrompt(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [assistantId, isEdit, loadAssistant, getAssistantSystemPrompt, getPromptSourceAssistants]);

  useEffect(() => {
    const container = previewBodyRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [previewMessages, previewSending]);

  const handleReturn = () => {
    if (backPath) {
      onNavigate(backPath);
      return;
    }

    if (session?.role === "admin") {
      onNavigate("/admin/assistants");
      return;
    }

    onNavigate("/teacher");
  };

  const handlePickPromptFromAssistant = async (sourceAssistant) => {
    if (!getAssistantSystemPrompt) return;

    setCopyingFromAssistantId(sourceAssistant.id);
    try {
      const promptResponse = await getAssistantSystemPrompt(sourceAssistant.id);
      setSystemPrompt(promptResponse?.content || "");
      setPickerOpen(false);
    } finally {
      setCopyingFromAssistantId("");
    }
  };

  const sendPreviewMessage = async (event) => {
    event.preventDefault();

    const normalizedMessage = previewInput.trim();
    if (!normalizedMessage || !modelId || previewSending) return;

    const createdAt = Date.now();
    const userMessage = {
      id: `preview-user-${createdAt}`,
      role: "user",
      content: normalizedMessage,
    };

    setPreviewMessages((messages) => [...messages, userMessage]);
    setPreviewInput("");
    setPreviewSending(true);
    setPreviewError("");

    try {
      const response = await sendAssistantPreviewMessage({
        modelId,
        systemPrompt,
        message: normalizedMessage,
      });

      setPreviewMessages((messages) => [
        ...messages,
        {
          id: `preview-assistant-${createdAt}`,
          role: "assistant",
          content: response?.content || response?.safety_reason || "Асистент не повернув відповідь.",
        },
      ]);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Не вдалося отримати тестову відповідь.");
    } finally {
      setPreviewSending(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedPrompt = systemPrompt.trim();

    if (!normalizedTitle || !modelId || submitting) return;

    setSubmitting(true);
    setSubmitError("");

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
      } else if (!normalizedPrompt && isEdit && existingPromptId && deleteAssistantSystemPrompt && savedAssistant?.id) {
        await deleteAssistantSystemPrompt(savedAssistant.id);
      }

      handleReturn();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не вдалося зберегти асистента.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} showPanelShortcut={false} />

      <main className="teacher-create-page">
        <button className="button button--ghost teacher-back teacher-back--compact" type="button" onClick={handleReturn}>
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
          {submitError ? <p className="teacher-inline-feedback">{submitError}</p> : null}

          <label>
            Назва
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Наприклад: Математичний асистент"
            />
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
                <div className="teacher-prompt-box__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setPickerOpen((value) => !value)}
                  >
                    Вибрати з іншого асистента
                  </button>

                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setSystemPrompt("")}
                    disabled={!systemPrompt}
                  >
                    Очистити
                  </button>
                </div>
              </div>

              {loadingPrompt ? <p className="teacher-muted">Завантаження системного промпта...</p> : null}

              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Опишіть роль асистента, стиль відповідей, обмеження, вимоги до структури пояснень, правила безпеки тощо."
                rows={12}
                className="teacher-prompt-box__textarea"
              />

              {pickerOpen ? (
                <div className="teacher-prompt-picker">
                  <strong>Доступні асистенти з системним промптом</strong>

                  {sourceAssistants.length === 0 ? (
                    <p className="teacher-muted">Немає інших доступних асистентів, з яких можна взяти системний промпт.</p>
                  ) : (
                    <div className="teacher-prompt-picker__list">
                      {sourceAssistants.map((assistant) => (
                        <div key={assistant.id} className="teacher-prompt-picker__item">
                          <div className="teacher-prompt-picker__meta">
                            <strong>{assistant.title}</strong>
                            <p className="teacher-muted teacher-prompt-picker__preview">{assistant.promptPreview}</p>
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

        <aside className="teacher-preview-chat" aria-label="Тест асистента перед публікацією">
          <header className="teacher-preview-chat__header">
            <div>
              <p>Тест асистента</p>
              <strong>Перевірка перед публікацією</strong>
            </div>
          </header>

          <div ref={previewBodyRef} className="teacher-preview-chat__messages">
            {previewMessages.length === 0 ? (
              <p className="teacher-preview-chat__empty">
                Напишіть тестове питання, щоб перевірити поточну модель і системний промпт.
              </p>
            ) : (
              previewMessages.map((message) => (
                <div
                  key={message.id}
                  className={`teacher-chat-message teacher-chat-message--${message.role}`}
                >
                  {message.content}
                </div>
              ))
            )}
            {previewSending ? <p className="teacher-muted">Асистент відповідає...</p> : null}
          </div>

          {previewError ? <p className="teacher-preview-chat__error">{previewError}</p> : null}

          <form className="teacher-preview-chat__composer" onSubmit={sendPreviewMessage}>
            <textarea
              value={previewInput}
              onChange={(event) => setPreviewInput(event.target.value)}
              placeholder="Тестове повідомлення"
              rows={3}
              disabled={previewSending || !modelId}
            />
            <button
              className="button button--dark"
              type="submit"
              disabled={previewSending || !previewInput.trim() || !modelId}
            >
              {previewSending ? "Надсилання..." : "Відправити"}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}
