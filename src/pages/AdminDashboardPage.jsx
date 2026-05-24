import { ChevronRight, MessageSquareText, Pencil, Plus, Search, ShieldCheck, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import DeleteAssistantModal from "../components/assistants/DeleteAssistantModal.jsx";
import AppHeader from "../components/header/AppHeader.jsx";
import {
  addStudentToAdminAssistant,
  assignUserRole,
  deleteAdminAssistant,
  deleteAdminAssistantDocument,
  getAdminAssistantById,
  getAdminAssistantDocuments,
  getAdminAssistants,
  getAdminAssistantStudents,
  getAdminModels,
  uploadAdminAssistantDocument,
  removeStudentFromAdminAssistant,
  searchAdminStudentsByEmail,
  searchUsers,
} from "../services/admin.js";

const adminNavItems = [
  { label: "Асистенти", path: "/admin/assistants" },
  { label: "Моделі", path: "/admin/models" },
  { label: "Ролі", path: "/admin/roles" },
];

const roleOptions = [
  { value: "guest", label: "Guest" },
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

const statusLabels = {
  uploaded: "Завантажено",
  queued: "В черзі",
  indexing: "Індексується",
  ready: "Готово",
  failed: "Помилка",
};

function AdminAssistantsTab({ onNavigate }) {
  const [assistants, setAssistants] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [activePanel, setActivePanel] = useState("documents");
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [studentActionMessage, setStudentActionMessage] = useState("");
  const [addingStudentId, setAddingStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const [deletingAssistant, setDeletingAssistant] = useState(null);
  const [deletingAssistantPending, setDeletingAssistantPending] = useState(false);

  const reloadAssistants = async (preferredAssistantId = null) => {
    const loadedAssistants = await getAdminAssistants();
    const nextActiveAssistant =
      loadedAssistants.find((assistant) => assistant.id === preferredAssistantId) ||
      loadedAssistants[0] ||
      null;

    setAssistants(loadedAssistants);
    setActiveAssistant(nextActiveAssistant);
    await loadAssistantDetails(nextActiveAssistant);
  };

  const loadAssistantDetails = async (assistant) => {
    if (!assistant) {
      setDocuments([]);
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const [loadedDocuments, loadedStudents] = await Promise.all([
        getAdminAssistantDocuments(assistant.id),
        getAdminAssistantStudents(assistant.id),
      ]);
      setDocuments(loadedDocuments);
      setStudents(loadedStudents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAssistants() {
      const loadedAssistants = await getAdminAssistants();
      if (cancelled) return;
      const firstAssistant = loadedAssistants[0] || null;
      setAssistants(loadedAssistants);
      setActiveAssistant(firstAssistant);
      await loadAssistantDetails(firstAssistant);
    }

    loadAssistants();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectAssistant = async (assistant) => {
    setActiveAssistant(assistant);
    await loadAssistantDetails(assistant);
  };

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeAssistant) return;

    await uploadAdminAssistantDocument(activeAssistant.id, file);
    setDocuments(await getAdminAssistantDocuments(activeAssistant.id));
  };

  const deleteDocument = async (sourceId) => {
    if (!activeAssistant) return;
    await deleteAdminAssistantDocument(activeAssistant.id, sourceId);
    setDocuments(await getAdminAssistantDocuments(activeAssistant.id));
  };

  const searchStudents = async (value) => {
    setStudentQuery(value);
    setStudentActionMessage("");
    setStudentResults(await searchAdminStudentsByEmail(value));
  };

  const addStudent = async (student) => {
    if (!activeAssistant) return;
    setAddingStudentId(student.id);
    setStudentActionMessage("");
    try {
      setStudents(await addStudentToAdminAssistant(activeAssistant.id, student));
      setStudentQuery("");
      setStudentResults([]);
      setStudentActionMessage(`Студента ${student.email || student.id} додано до асистента.`);
    } catch (error) {
      setStudentActionMessage(String(error.message || "Не вдалося додати студента до асистента."));
    } finally {
      setAddingStudentId("");
    }
  };

  const removeStudent = async (studentId) => {
    if (!activeAssistant) return;
    setStudents(await removeStudentFromAdminAssistant(activeAssistant.id, studentId));
  };

  const confirmDeleteAssistant = async () => {
    if (!deletingAssistant) return;

    setDeletingAssistantPending(true);
    try {
      await deleteAdminAssistant(deletingAssistant.id);

      const preferredAssistantId = activeAssistant?.id === deletingAssistant.id ? null : activeAssistant?.id || null;
      await reloadAssistants(preferredAssistantId);
      setDeletingAssistant(null);
    } finally {
      setDeletingAssistantPending(false);
    }
  };

  const openStudentChat = (student) => {
    if (!activeAssistant) return;
    const params = new URLSearchParams({
      assistant_id: activeAssistant.id,
      student_id: student.id,
      student_email: student.email || "",
    });
    onNavigate(`/admin/students/chat?${params.toString()}`);
  };

  return (
    <div className="teacher-page__content">
      <aside className="teacher-sidebar">
        <div className="teacher-sidebar__header">
          <span>Усі асистенти</span>
          <button className="icon-button" type="button" aria-label="Створити асистента" onClick={() => onNavigate("/admin/assistants/new")}>
            <Plus size={18} />
          </button>
        </div>

        <div className="teacher-assistant-list">
          {assistants.map((assistant) => (
            <div className={`teacher-assistant-row ${assistant.id === activeAssistant?.id ? "teacher-assistant-row--active" : ""}`} key={assistant.id}>
              <button className="teacher-assistant" type="button" onClick={() => selectAssistant(assistant)}>
                {assistant.title}
              </button>

              <div className="teacher-assistant__actions">
                <button className="icon-button" type="button" aria-label="Редагувати асистента" onClick={() => onNavigate(`/admin/assistants/${assistant.id}/edit`)}>
                  <Pencil size={16} />
                </button>
                <button className="icon-button teacher-icon-button--danger" type="button" aria-label="Видалити асистента" onClick={() => setDeletingAssistant(assistant)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="teacher-main">
        <header className="teacher-main__header">
          <div>
            <h1>{activeAssistant?.title || "Оберіть асистента"}</h1>
          </div>
        </header>

        <div className="teacher-tabs" role="tablist" aria-label="Керування асистентом">
          <button className={activePanel === "documents" ? "teacher-tab teacher-tab--active" : "teacher-tab"} type="button" onClick={() => setActivePanel("documents")}>
            Документи
          </button>
          <button className={activePanel === "students" ? "teacher-tab teacher-tab--active" : "teacher-tab"} type="button" onClick={() => setActivePanel("students")}>
            Студенти
          </button>
        </div>

        <div className="teacher-panel-wrap">
          {activePanel === "documents" ? (
            <section className="teacher-panel">
              <div className="teacher-panel__header">
                <h2>Документи</h2>
                <label className="button button--dark teacher-upload">
                  <Upload size={17} />
                  Додати
                  <input type="file" onChange={uploadDocument} disabled={!activeAssistant} />
                </label>
              </div>

              <div className="teacher-list">
                {loading ? <p className="teacher-muted">Завантаження...</p> : null}
                {!loading && documents.length === 0 ? <p className="teacher-muted">Документів ще немає.</p> : null}
                {documents.map((document) => (
                  <div className="teacher-document" key={document.id}>
                    <div>
                      <strong>{document.file_name}</strong>
                      <span className={`teacher-status teacher-status--${document.status}`}>
                        {statusLabels[document.status] || document.status}
                      </span>
                    </div>
                    <button className="icon-button" type="button" aria-label="Видалити документ" onClick={() => deleteDocument(document.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="teacher-panel teacher-panel--students">
              <div className="teacher-panel__header">
                <h2>Студенти</h2>
              </div>

              <div className="teacher-student-search">
                <UserPlus size={18} />
                <input
                  aria-label="Пошук студента"
                  placeholder="Пошук за email"
                  value={studentQuery}
                  onChange={(event) => searchStudents(event.target.value)}
                  disabled={!activeAssistant}
                />
              </div>

              {studentResults.length > 0 ? (
                <div className="teacher-search-results">
                  {studentResults.map((student) => (
                    <div className="teacher-search-result" key={student.id}>
                      <div className="teacher-search-result__meta">
                        <span>{student.email || student.google_sub || student.id}</span>
                        <small>{student.name || student.role}</small>
                      </div>
                      <button
                        className="button button--ghost teacher-search-result__action"
                        type="button"
                        onClick={() => addStudent(student)}
                        disabled={!activeAssistant || addingStudentId === student.id || students.some((item) => item.id === student.id)}
                      >
                        {students.some((item) => item.id === student.id)
                          ? "Вже додано"
                          : addingStudentId === student.id
                            ? "Додається..."
                            : "Додати"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {studentActionMessage ? <p className="teacher-inline-feedback">{studentActionMessage}</p> : null}

              <div className="teacher-list">
                {students.length === 0 ? <p className="teacher-muted">Студентів ще не додано.</p> : null}
                {students.map((student) => (
                  <div className="teacher-student teacher-student--admin" key={student.id}>
                    <div className="teacher-student__info">
                      <strong>{student.email || student.id}</strong>
                      <span>{student.name || student.role}</span>
                    </div>
                    <div className="teacher-student__actions">
                      <button className="button button--ghost teacher-student__chat" type="button" onClick={() => openStudentChat(student)}>
                        <MessageSquareText size={16} />
                        Чат
                      </button>
                      <button className="icon-button" type="button" aria-label="Видалити студента" onClick={() => removeStudent(student.id)}>
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <DeleteAssistantModal
        assistant={deletingAssistant}
        deleting={deletingAssistantPending}
        onCancel={() => setDeletingAssistant(null)}
        onConfirm={confirmDeleteAssistant}
      />
    </div>
  );
}

function AdminModelsTab({ onNavigate }) {
  const [models, setModels] = useState([]);
  const [deletingModel, setDeletingModel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const loadedModels = await getAdminModels();
        if (!cancelled) {
          setModels(loadedModels);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setModels([]);
          setLoadError(error instanceof Error ? error.message : "Не вдалося завантажити моделі");
        }
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const enabledCount = models.filter((model) => model.is_enabled).length;
  const apiCount = models.filter((model) => model.provider === "api").length;

  const confirmDelete = async () => {
    if (!deletingModel) return;

    setDeleting(true);
    try {
      await deleteAdminModel(deletingModel.id);
      setModels((current) => current.filter((model) => model.id !== deletingModel.id));
      setDeletingModel(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="admin-panel admin-models-panel">
        <header className="admin-panel__header admin-panel__header--split">
          <div>
            <h1>Каталог моделей</h1>
          </div>
          <button className="button button--dark" type="button" onClick={() => onNavigate("/admin/models/new")}>
            <Plus size={17} />
            Нова модель
          </button>
        </header>

        <section className="admin-models-shell">
          <div className="admin-models-summary">
            <article className="admin-stat-card">
              <span>Усього моделей</span>
              <strong>{models.length}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Активні</span>
              <strong>{enabledCount}</strong>
            </article>
            <article className="admin-stat-card">
              <span>API provider</span>
              <strong>{apiCount}</strong>
            </article>
          </div>

          {loadError ? <p className="teacher-muted">{loadError}</p> : null}

          <div className="admin-models-grid">
            {models.map((model) => (
              <article className="admin-model-card admin-model-card--detailed" key={model.id}>
                <div className="admin-model-card__head">
                  <div>
                    <strong>{model.model_name}</strong>
                    <span>{model.provider}</span>
                  </div>
                  <span className={`admin-model-card__status ${model.is_enabled ? "" : "admin-model-card__status--muted"}`}>
                    {model.is_enabled ? "enabled" : "disabled"}
                  </span>
                </div>

                <div className="admin-model-card__body">
                  {model.provider !== "local" ? (
                    <div className="admin-model-line">
                      <span>Endpoint</span>
                      <strong>{model.endpoint || "not set"}</strong>
                    </div>
                  ) : null}
                  <div className="admin-model-line">
                    <span>Local path</span>
                    <strong>{model.local_path || "not set"}</strong>
                  </div>
                </div>

                <div className="admin-model-limits-preview">
                  {model.limits ? (
                    <>
                      <div>
                        <span>Total</span>
                        <strong>{model.limits.total}</strong>
                      </div>
                      <div>
                        <span>Guests</span>
                        <strong>{model.limits.guests}</strong>
                      </div>
                      <div>
                        <span>Students</span>
                        <strong>{model.limits.students}</strong>
                      </div>
                      <div>
                        <span>Admins</span>
                        <strong>{model.limits.admins}</strong>
                      </div>
                    </>
                  ) : (
                    <p className="teacher-muted">Для локальних моделей ліміти не використовуються.</p>
                  )}
                </div>

                <div className="admin-model-card__actions">
                  <button className="button button--ghost" type="button" onClick={() => onNavigate(`/admin/models/${model.id}/edit`)}>
                    Редагувати
                  </button>
                  <button className="icon-button admin-icon-button--danger" type="button" aria-label="Видалити модель" onClick={() => setDeletingModel(model)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {deletingModel ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !deleting && setDeletingModel(null)}>
          <section className="login-modal admin-delete-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button login-modal__close" type="button" aria-label="Закрити" onClick={() => setDeletingModel(null)} disabled={deleting}>
              <X size={18} />
            </button>
            <h2>Видалити модель?</h2>
            <p>
              Модель <strong>{deletingModel.model_name}</strong> буде видалена назавжди. Цю дію не можна скасувати.
            </p>
            <div className="admin-delete-modal__actions">
              <button className="button button--ghost" type="button" onClick={() => setDeletingModel(null)} disabled={deleting}>
                Скасувати
              </button>
              <button className="button admin-button--danger" type="button" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Видалення..." : "Видалити модель"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function AdminRolesTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [savingUserId, setSavingUserId] = useState("");

  const onSearch = async (value) => {
    setQuery(value);
    setResults(await searchUsers(value));
  };

  const updateRole = async (userId, role) => {
    setSavingUserId(userId);
    try {
      const updatedUser = await assignUserRole(userId, role);
      setResults((current) => current.map((user) => (user.id === userId ? { ...user, role: updatedUser.role } : user)));
    } finally {
      setSavingUserId("");
    }
  };

  return (
    <main className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p>Керування доступом</p>
          <h1>Пошук і зміна ролей</h1>
        </div>
      </header>

      <section className="admin-roles-shell admin-roles-shell--search">
        <section className="admin-role-card admin-role-card--wide">
          <div className="admin-role-card__header">
            <h2>Пошук користувачів</h2>
            <span className="admin-role-card__count">{results.length}</span>
          </div>

          <div className="admin-role-search admin-role-search--wide">
            <Search size={18} />
            <input
              aria-label="Пошук користувача"
              placeholder="Введіть email користувача"
              value={query}
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>

          <div className="admin-role-users">
            {query.trim().length < 2 ? <p className="teacher-muted">Введіть щонайменше 2 символи.</p> : null}
            {query.trim().length >= 2 && results.length === 0 ? <p className="teacher-muted">Користувачів за цим запитом не знайдено.</p> : null}
            {results.map((user) => (
              <article className="admin-role-user admin-role-user--editable" key={user.id}>
                <div className="admin-role-user__meta">
                  <ShieldCheck size={17} />
                  <div>
                    <strong>{user.email || user.google_sub}</strong>
                    <span>{user.role}</span>
                  </div>
                </div>
                <div className="admin-role-user__actions">
                  <select
                    value={user.role}
                    disabled={savingUserId === user.id}
                    onChange={(event) => updateRole(user.id, event.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight size={16} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function AdminDashboardPage({ session, onLogout, onNavigate, path }) {
  let activeNav = "/admin/assistants";
  if (path === "/admin/models") activeNav = "/admin/models";
  if (path === "/admin/roles") activeNav = "/admin/roles";

  return (
    <div className="teacher-page admin-page">
      <AppHeader
        session={session}
        onLogout={onLogout}
        navItems={adminNavItems}
        activeNav={activeNav}
        onNavigate={onNavigate}
        showPanelShortcut={false}
      />

      {activeNav === "/admin/models" ? <AdminModelsTab onNavigate={onNavigate} /> : null}
      {activeNav === "/admin/roles" ? <AdminRolesTab /> : null}
      {activeNav === "/admin/assistants" ? <AdminAssistantsTab onNavigate={onNavigate} /> : null}
    </div>
  );
}
