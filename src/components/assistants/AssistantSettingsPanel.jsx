import { useEffect, useRef, useState } from "react";
import {
  getAssistantCreateOptions,
  sendAssistantPreviewMessage,
} from "../../services/teacher.js";

const SYSTEM_PROMPT_MAX_LENGTH = 20000;

function isMarkdownFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".md") || file.type === "text/markdown";
}

export default function AssistantSettingsPanel({
  assistant,
  loadAssistant,
  updateAssistant,
  getAssistantSystemPrompt,
  setAssistantSystemPrompt,
  deleteAssistantSystemPrompt,
  getPromptSourceAssistants,
  onSaved,
}) {
  const assistantId = assistant?.id || "";

  const [title, setTitle] = useState("");
  const [modelId, setModelId] = useState("");
  const [assistantGroupId, setAssistantGroupId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [existingPromptId, setExistingPromptId] = useState("");

  const [models, setModels] = useState([]);
  const [assistantGroups, setAssistantGroups] = useState([]);
  const [sourceAssistants, setSourceAssistants] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [copyingFromAssistantId, setCopyingFromAssistantId] = useState("");
  const [promptFileError, setPromptFileError] = useState("");
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewSending, setPreviewSending] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const previewBodyRef = useRef(null);
  const promptFileInputRef = useRef(null);

  useEffect(() => {
    const container = previewBodyRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [previewMessages, previewSending]);

  useEffect(() => {
    if (!assistantId) {
      setTitle("");
      setModelId("");
      setAssistantGroupId("");
      setIsPublic(false);
      setSystemPrompt("");
      setExistingPromptId("");
      setSourceAssistants([]);
      setPreviewMessages([]);
      setPreviewInput("");
      setSubmitError("");
      setSubmitMessage("");
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setLoadingPrompt(true);
      setSubmitError("");
      setSubmitMessage("");
      setPreviewMessages([]);
      setPreviewInput("");

      try {
        const [options, loadedAssistant, promptSources] = await Promise.all([
          getAssistantCreateOptions(),
          loadAssistant(assistantId),
          getPromptSourceAssistants
            ? getPromptSourceAssistants(assistantId)
            : Promise.resolve([]),
        ]);

        if (cancelled) return;

        setModels(options.models || []);
        setAssistantGroups(options.groups || []);
        setSourceAssistants(promptSources || []);

        setTitle(loadedAssistant?.title || "");
        setModelId(loadedAssistant?.model_id || options.models?.[0]?.id || "");
        setAssistantGroupId(loadedAssistant?.assistant_group_id || "");
        setIsPublic(Boolean(loadedAssistant?.is_public));

        if (getAssistantSystemPrompt) {
          try {
            const promptResponse = await getAssistantSystemPrompt(assistantId);
            if (cancelled) return;

            setSystemPrompt(promptResponse?.content || "");
            setExistingPromptId(promptResponse?.prompt_id || "");
          } catch {
            if (cancelled) return;
            setSystemPrompt("");
            setExistingPromptId("");
          }
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
  }, [assistantId, loadAssistant, getAssistantSystemPrompt, getPromptSourceAssistants]);

  const handlePromptFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPromptFileError("");

    if (!isMarkdownFile(file)) {
      setPromptFileError("Оберіть файл у форматі .md.");
      return;
    }

    try {
      const content = await file.text();
      const normalizedContent = content.trim();

      if (!normalizedContent) {
        setPromptFileError("Файл порожній.");
        return;
      }

      if (normalizedContent.length > SYSTEM_PROMPT_MAX_LENGTH) {
        setPromptFileError(
          `Файл завеликий: максимум ${SYSTEM_PROMPT_MAX_LENGTH} символів.`,
        );
        return;
      }

      setSystemPrompt(normalizedContent);
    } catch {
      setPromptFileError("Не вдалося прочитати файл.");
    }
  };

  const handlePickPromptFromAssistant = async (sourceAssistant) => {
    if (!getAssistantSystemPrompt) return;

    setCopyingFromAssistantId(sourceAssistant.id);
    try {
      const promptResponse = await getAssistantSystemPrompt(sourceAssistant.id);
      setSystemPrompt(promptResponse?.content || "");
      setPromptFileError("");
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
        assistantGroupId,
        groupSystemPrompt: "",
        systemPrompt,
        message: normalizedMessage,
      });

      setPreviewMessages((messages) => [
        ...messages,
        {
          id: `preview-assistant-${createdAt}`,
          role: "assistant",
          content:
            response?.content ||
            response?.safety_reason ||
            "Асистент не повернув відповідь.",
        },
      ]);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Не вдалося отримати тестову відповідь.",
      );
    } finally {
      setPreviewSending(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedPrompt = systemPrompt.trim();

    if (!assistantId || !normalizedTitle || !modelId || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      const savedAssistant = await updateAssistant(assistantId, {
        title: normalizedTitle,
        modelId,
        assistantGroupId,
        isPublic,
      });

      if (normalizedPrompt && setAssistantSystemPrompt) {
        await setAssistantSystemPrompt(savedAssistant.id, normalizedPrompt);
      } else if (
        !normalizedPrompt &&
        existingPromptId &&
        deleteAssistantSystemPrompt
      ) {
        await deleteAssistantSystemPrompt(savedAssistant.id);
      }

      if (getAssistantSystemPrompt) {
        try {
          const promptResponse = await getAssistantSystemPrompt(savedAssistant.id);
          setSystemPrompt(promptResponse?.content || normalizedPrompt);
          setExistingPromptId(promptResponse?.prompt_id || "");
        } catch {
          setExistingPromptId("");
        }
      }

      if (onSaved) {
        await onSaved(savedAssistant);
      }

      setSubmitMessage("Налаштування збережено.");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти налаштування асистента.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!assistant) {
    return (
      <section className="teacher-panel teacher-settings-panel">
        <header className="teacher-panel__header">
          <h2>Налаштування</h2>
        </header>

        <div className="teacher-settings-panel__empty">
          <p className="teacher-muted">Оберіть асистента ліворуч, щоб редагувати його налаштування.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-panel teacher-settings-panel">
      <header className="teacher-panel__header">
        <h2>Налаштування</h2>
      </header>

      <div className="teacher-settings-panel__body">
        <form className="teacher-create-form teacher-settings-form" onSubmit={submit}>
          {loading ? <p className="teacher-muted">Завантаження...</p> : null}
          {submitError ? <p className="teacher-inline-feedback teacher-inline-feedback--danger">{submitError}</p> : null}
          {submitMessage ? <p className="teacher-inline-feedback">{submitMessage}</p> : null}

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
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              disabled={loading}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.model_name} ({model.provider})
                </option>
              ))}
            </select>
          </label>

          <div className="teacher-group-box">
            <label>
              Група асистентів
              <select
                value={assistantGroupId}
                onChange={(event) => setAssistantGroupId(event.target.value)}
                disabled={loading}
              >
                <option value="">Без групи</option>
                {assistantGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="teacher-checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
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
                    onClick={() => promptFileInputRef.current?.click()}
                  >
                    Завантажити .md
                  </button>

                  <input
                    ref={promptFileInputRef}
                    className="teacher-prompt-box__file"
                    type="file"
                    accept=".md,text/markdown"
                    onChange={handlePromptFileChange}
                  />

                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      setSystemPrompt("");
                      setPromptFileError("");
                    }}
                    disabled={!systemPrompt}
                  >
                    Очистити
                  </button>
                </div>
              </div>

              {loadingPrompt ? <p className="teacher-muted">Завантаження системного промпта...</p> : null}
              {promptFileError ? <p className="teacher-inline-feedback teacher-inline-feedback--danger">{promptFileError}</p> : null}

              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Опишіть роль асистента, стиль відповідей, обмеження, вимоги до структури пояснень, правила безпеки тощо."
                rows={12}
                className="teacher-prompt-box__textarea teacher-prompt-box__textarea--compact"
              />

              {pickerOpen ? (
                <div className="teacher-prompt-picker">
                  <strong>Доступні асистенти з системним промптом</strong>

                  {sourceAssistants.length === 0 ? (
                    <p className="teacher-muted">Немає інших доступних асистентів, з яких можна взяти системний промпт.</p>
                  ) : (
                    <div className="teacher-prompt-picker__list">
                      {sourceAssistants.map((sourceAssistant) => (
                        <div key={sourceAssistant.id} className="teacher-prompt-picker__item">
                          <div className="teacher-prompt-picker__meta">
                            <strong>{sourceAssistant.title}</strong>
                            <p className="teacher-muted teacher-prompt-picker__preview">
                              {sourceAssistant.promptPreview}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="button button--ghost"
                            disabled={copyingFromAssistantId === sourceAssistant.id}
                            onClick={() => handlePickPromptFromAssistant(sourceAssistant)}
                          >
                            {copyingFromAssistantId === sourceAssistant.id
                              ? "Завантаження..."
                              : "Взяти промпт"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <button
            className="button button--dark teacher-create-submit"
            type="submit"
            disabled={loading || submitting || !title.trim() || !modelId}
          >
            {submitting ? "Збереження..." : "Зберегти зміни"}
          </button>
        </form>

        <aside className="teacher-preview-chat teacher-preview-chat--panel" aria-label="Тест асистента">
          <header className="teacher-preview-chat__header">
            <div>
              <p>Тест асистента</p>
              <strong>Перевірка перед збереженням</strong>
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

          {previewError ? (
            <p className="teacher-preview-chat__error">{previewError}</p>
          ) : null}

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
      </div>
    </section>
  );
}