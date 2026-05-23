import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/header/AppHeader.jsx";
import { createAdminModel, getAdminModel, updateAdminModel } from "../services/admin.js";

const providerOptions = [
  { value: "api", label: "API model" },
  { value: "local", label: "Local model" },
];

const initialLimits = {
  total: "1000",
  guests: "50",
  students: "600",
  admins: "350",
};

export default function AdminModelCreatePage({ session, onLogout, onNavigate, mode = "create", modelId = "" }) {
  const isEdit = mode === "edit";
  const [provider, setProvider] = useState("api");
  const [modelName, setModelName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [limits, setLimits] = useState(initialLimits);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const isLocal = provider === "local";

  useEffect(() => {
    if (!isEdit || !modelId) return;

    let cancelled = false;

    async function loadModel() {
      setLoading(true);
      try {
        const model = await getAdminModel(modelId);
        if (cancelled) return;

        setProvider(model.provider || "api");
        setModelName(model.model_name || "");
        setEndpoint(model.endpoint || "");
        setLocalPath(model.local_path || "");
        setIsEnabled(Boolean(model.is_enabled));

        if (model.limits) {
          setLimits({
            total: String(model.limits.total ?? 0),
            guests: String(model.limits.guests ?? 0),
            students: String(model.limits.students ?? 0),
            admins: String(model.limits.admins ?? 0),
          });
        } else {
          setLimits(initialLimits);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadModel();
    return () => {
      cancelled = true;
    };
  }, [isEdit, modelId]);

  const canSubmit = useMemo(() => {
    if (!modelName.trim()) return false;
    if (isLocal) {
      return localPath.trim().length > 0;
    }
    return endpoint.trim().length > 0;
  }, [endpoint, isLocal, localPath, modelName]);

  const updateLimit = (field, value) => {
    setLimits((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);

    try {
      if (isEdit) {
        const payload = {
          model_name: modelName.trim(),
          endpoint: isLocal ? null : endpoint.trim() || null,
          local_path: isLocal ? localPath.trim() || null : null,
          is_enabled: isEnabled,
          ...(secretKey.trim() ? { secret_key: secretKey.trim() } : {}),
          ...(!isLocal
            ? {
                limits: {
                  total: Number(limits.total || 0),
                  guests: Number(limits.guests || 0),
                  students: Number(limits.students || 0),
                  admins: Number(limits.admins || 0),
                },
              }
            : {}),
        };

        await updateAdminModel(modelId, payload);
      } else {
        const payload = {
          provider,
          model_name: modelName.trim(),
          endpoint: isLocal ? null : endpoint.trim() || null,
          secret_key: isLocal ? null : secretKey.trim() || null,
          local_path: isLocal ? localPath.trim() || null : null,
          limits: isLocal
            ? null
            : {
                total: Number(limits.total || 0),
                guests: Number(limits.guests || 0),
                students: Number(limits.students || 0),
                admins: Number(limits.admins || 0),
              },
        };

        await createAdminModel(payload);
      }

      onNavigate("/admin/models");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page admin-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} showPanelShortcut={false} />

      <main className="teacher-create-page admin-model-create-page">
        <button className="button button--ghost teacher-back teacher-back--compact" type="button" onClick={() => onNavigate("/admin/models")}>
          <ArrowLeft size={17} />
          Назад до моделей
        </button>

        <section className="teacher-create-intro" aria-labelledby="admin-model-create-title">
          <p>{isEdit ? "Редагування моделі" : "Нова модель"}</p>
          <h1 id="admin-model-create-title">{isEdit ? "Редагування моделі" : "Створення моделі"}</h1>
        </section>

        <form className="teacher-create-form admin-model-form" onSubmit={handleSubmit}>
          {loading ? <p className="teacher-muted">Завантаження моделі...</p> : null}

          <label>
            Провайдер
            <select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={isEdit}>
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Назва моделі
            <input value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="Наприклад: gpt-4o-mini" />
          </label>

          {!isLocal ? (
            <label>
              Endpoint
              <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://api.openai.com/v1/chat/completions" />
            </label>
          ) : null}

          {!isLocal ? (
            <label>
              Secret key
              <input value={secretKey} onChange={(event) => setSecretKey(event.target.value)} placeholder={isEdit ? "Залиш порожнім, щоб не змінювати" : "sk-..."} />
            </label>
          ) : null}

          {isLocal ? (
            <label>
              Local path
              <input value={localPath} onChange={(event) => setLocalPath(event.target.value)} placeholder="/models/qwen2.5-7b-instruct" />
            </label>
          ) : null}

          {isEdit ? (
            <label className="admin-model-toggle">
              <span>Модель активна</span>
              <input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} />
            </label>
          ) : null}

          {!isLocal ? (
            <div className="admin-model-limits">
              <label>
                Total
                <input inputMode="numeric" value={limits.total} onChange={(event) => updateLimit("total", event.target.value)} />
              </label>
              <label>
                Guests
                <input inputMode="numeric" value={limits.guests} onChange={(event) => updateLimit("guests", event.target.value)} />
              </label>
              <label>
                Students
                <input inputMode="numeric" value={limits.students} onChange={(event) => updateLimit("students", event.target.value)} />
              </label>
              <label>
                Admins
                <input inputMode="numeric" value={limits.admins} onChange={(event) => updateLimit("admins", event.target.value)} />
              </label>
            </div>
          ) : null}

          <button className="button button--dark teacher-create-submit" type="submit" disabled={loading || !canSubmit || submitting}>
            {submitting ? (isEdit ? "Збереження..." : "Створення...") : isEdit ? "Зберегти зміни" : "Створити модель"}
          </button>
        </form>
      </main>
    </div>
  );
}
