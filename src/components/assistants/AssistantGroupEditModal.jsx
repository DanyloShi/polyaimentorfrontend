import { useRef, useState } from "react";
import { X } from "lucide-react";

const SYSTEM_PROMPT_MAX_LENGTH = 20000;

function isMarkdownFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".md") || file.type === "text/markdown";
}

export default function AssistantGroupEditModal({ group, initialPrompt, saving, onCancel, onSave }) {
  const [title, setTitle] = useState(group?.title || "");
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  if (!group) return null;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError("");

    if (!isMarkdownFile(file)) {
      setFileError("Оберіть файл у форматі .md.");
      return;
    }

    try {
      const content = await file.text();
      const normalizedContent = content.trim();

      if (!normalizedContent) {
        setFileError("Файл порожній.");
        return;
      }

      if (normalizedContent.length > SYSTEM_PROMPT_MAX_LENGTH) {
        setFileError(`Файл завеликий: максимум ${SYSTEM_PROMPT_MAX_LENGTH} символів.`);
        return;
      }

      setPrompt(normalizedContent);
    } catch {
      setFileError("Не вдалося прочитати файл.");
    }
  };

  const submit = (event) => {
    event.preventDefault();
    onSave({
      title: title.trim(),
      prompt: prompt.trim(),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && onCancel()}>
      <section className="login-modal teacher-group-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button login-modal__close" type="button" aria-label="Закрити" onClick={onCancel} disabled={saving}>
          <X size={18} />
        </button>

        <h2>Редагувати групу</h2>

        <form className="teacher-group-modal__form" onSubmit={submit}>
          <label>
            Назва групи
            <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={saving} />
          </label>

          <label>
            Системний промпт групи
            <div className="teacher-group-modal__toolbar">
              <button className="button button--ghost" type="button" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                Завантажити .md
              </button>
              <input ref={fileInputRef} className="teacher-prompt-box__file" type="file" accept=".md,text/markdown" onChange={handleFileChange} />
            </div>
            {fileError ? <p className="teacher-inline-feedback teacher-inline-feedback--danger">{fileError}</p> : null}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Правила, які мають виконувати всі асистенти цієї групи."
              rows={10}
              disabled={saving}
            />
          </label>

          <div className="teacher-delete-modal__actions">
            <button className="button button--ghost" type="button" onClick={onCancel} disabled={saving}>
              Скасувати
            </button>
            <button className="button button--dark" type="submit" disabled={saving || !title.trim()}>
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
