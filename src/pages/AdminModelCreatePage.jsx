import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import AppHeader from "../components/header/AppHeader.jsx";
import { createAdminModel } from "../services/admin.js";

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

export default function AdminModelCreatePage({ session, onLogout, onNavigate }) {
  const [provider, setProvider] = useState("api");
  const [modelName, setModelName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [limits, setLimits] = useState(initialLimits);
  const [submitting, setSubmitting] = useState(false);

  const isLocal = provider === "local";
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

    setSubmitting(true);
    try {
      await createAdminModel(payload);
      onNavigate("/admin/models");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page admin-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} />

      <main className="teacher-create-page admin-model-create-page">
        <button className="button button--ghost teacher-back teacher-back--compact" type="button" onClick={() => onNavigate("/admin/models")}>
          <ArrowLeft size={17} />
          Назад до моделей
        </button>

        <section className="teacher-create-intro" aria-labelledby="admin-model-create-title">
          <p>Нова модель</p>
          <h1 id="admin-model-create-title">Створення моделі</h1>
          <span>Форма відповідає: провайдер, назва, endpoint або local path, а для API-моделей ще й ліміти.</span>
        </section>

        <form className="teacher-create-form admin-model-form" onSubmit={handleSubmit}>
          <label>
            Провайдер
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
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
              <input value={secretKey} onChange={(event) => setSecretKey(event.target.value)} placeholder="sk-..." />
            </label>
          ) : null}

          {isLocal ? (
            <label>
              Local path
              <input value={localPath} onChange={(event) => setLocalPath(event.target.value)} placeholder="/models/qwen2.5-7b-instruct" />
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

          <button className="button button--dark teacher-create-submit" type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Створення..." : "Створити модель"}
          </button>
        </form>
      </main>
    </div>
  );
}
