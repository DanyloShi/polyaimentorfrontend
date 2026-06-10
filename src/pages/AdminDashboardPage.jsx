import { AlertTriangle, ChevronRight, FolderPlus, MessageSquareText, PanelLeft, Plus, Search, ShieldCheck, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import AssistantGroupEditModal from "../components/assistants/AssistantGroupEditModal.jsx";
import AssistantTreeList from "../components/assistants/AssistantTreeList.jsx";
import DeleteAssistantModal from "../components/assistants/DeleteAssistantModal.jsx";
import AssistantSettingsPanel from "../components/assistants/AssistantSettingsPanel.jsx";
import AssistantShareModal from "../components/assistants/AssistantShareModal.jsx";
import ShareGlyph from "../components/assistants/ShareGlyph.jsx";
import AppHeader from "../components/header/AppHeader.jsx";
import {
  addStudentToAdminAssistant,
  assignUserRole,
  createAdminAssistantGroup,
  deleteAdminAssistantGroupSystemPrompt,
  deleteAdminAssistant,
  deleteAdminAssistantDocument,
  getAdminAssistantGroups,
  getAdminAssistantGroupSystemPrompt,
  deleteAdminModel,
  getAdminAssistantDocuments,
  getAdminAssistants,
  getAdminAssistantStudents,
  getAdminModels,
  getAdminSafetyEvents,
  uploadAdminAssistantDocument,
  removeStudentFromAdminAssistant,
  searchAdminStudentsByEmail,
  searchUsers,
  setAdminAssistantGroupSystemPrompt,
  updateAdminAssistantGroup,
  deleteAdminAssistantSystemPrompt,
  getAdminAssistantById,
  getAdminAssistantSystemPrompt,
  getAdminPromptSourceAssistants,
  setAdminAssistantSystemPrompt,
  updateAdminAssistant,
} from "../services/admin.js";

const adminNavItems = [
  { label: "Асистенти", path: "/admin/assistants" },
  { label: "Моделі", path: "/admin/models" },
  { label: "Ролі", path: "/admin/roles" },
  { label: "Небезпечні запити", path: "/admin/safety-events" },
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
  const [assistantGroups, setAssistantGroups] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [activePanel, setActivePanel] = useState("settings");
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [documentsLoadError, setDocumentsLoadError] = useState("");
  const [studentsLoadError, setStudentsLoadError] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [studentActionMessage, setStudentActionMessage] = useState("");
  const [addingStudentId, setAddingStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const [deletingAssistant, setDeletingAssistant] = useState(null);
  const [deletingAssistantPending, setDeletingAssistantPending] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingGroupPrompt, setEditingGroupPrompt] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const [shareTarget, setShareTarget] = useState(null);
  const [shareKind, setShareKind] = useState("assistant");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const reloadAssistants = async (preferredAssistantId = null) => {
    const [loadedAssistants, loadedGroups] = await Promise.all([
      getAdminAssistants(),
      getAdminAssistantGroups(),
    ]);
    const nextActiveAssistant =
      loadedAssistants.find((assistant) => assistant.id === preferredAssistantId) ||
      loadedAssistants[0] ||
      null;

    setAssistants(loadedAssistants);
    setAssistantGroups(loadedGroups);
    setActiveAssistant(nextActiveAssistant);
    await loadAssistantDetails(nextActiveAssistant);
  };

  const loadAssistantDetails = async (assistant) => {
    if (!assistant) {
      setDocuments([]);
      setStudents([]);
      setDocumentsLoadError("");
      setStudentsLoadError("");
      return;
    }

    setLoading(true);
    try {
      const [loadedDocuments, loadedStudents] = await Promise.allSettled([
        getAdminAssistantDocuments(assistant.id),
        getAdminAssistantStudents(assistant.id),
      ]);

      if (loadedDocuments.status === "fulfilled") {
        setDocuments(loadedDocuments.value);
        setDocumentsLoadError("");
      } else {
        setDocuments([]);
        setDocumentsLoadError("Не вдалося завантажити документи для вибраного асистента.");
      }

      if (loadedStudents.status === "fulfilled") {
        setStudents(loadedStudents.value);
        setStudentsLoadError("");
      } else {
        setStudents([]);
        setStudentsLoadError("Не вдалося завантажити студентів для вибраного асистента.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAssistants() {
      const [loadedAssistants, loadedGroups] = await Promise.all([
        getAdminAssistants(),
        getAdminAssistantGroups(),
      ]);
      if (cancelled) return;
      const firstAssistant = loadedAssistants[0] || null;
      setAssistants(loadedAssistants);
      setAssistantGroups(loadedGroups);
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
    setSidebarOpen(false);
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

  const openEditGroup = async (group) => {
    setEditingGroupPrompt("");

    try {
      const prompt = await getAdminAssistantGroupSystemPrompt(group.id);
      setEditingGroupPrompt(prompt?.content || "");
    } catch {
      setEditingGroupPrompt("");
    } finally {
      setEditingGroup(group);
    }
  };

  const saveNewGroup = async ({ title, prompt }) => {
    setSavingGroup(true);
    try {
      const group = await createAdminAssistantGroup({ title });
      if (prompt) {
        await setAdminAssistantGroupSystemPrompt(group.id, prompt);
      }
      setAssistantGroups((groups) => [group, ...groups.filter((item) => item.id !== group.id)]);
      setCreatingGroup(null);
    } finally {
      setSavingGroup(false);
    }
  };

  const saveGroup = async ({ title, prompt }) => {
    if (!editingGroup) return;

    setSavingGroup(true);
    try {
      const updatedGroup = await updateAdminAssistantGroup(editingGroup.id, { title });
      if (prompt) {
        await setAdminAssistantGroupSystemPrompt(editingGroup.id, prompt);
      } else {
        await deleteAdminAssistantGroupSystemPrompt(editingGroup.id);
      }
      setAssistantGroups((groups) => groups.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      setEditingGroup(null);
      setEditingGroupPrompt("");
    } finally {
      setSavingGroup(false);
    }
  };

  const openAssistantShare = (assistant) => {
    setShareKind("assistant");
    setShareTarget(assistant);
  };

  const openGroupShare = (group) => {
    setShareKind("group");
    setShareTarget(group);
  };

  const closeShareModal = () => {
    setShareTarget(null);
    setShareKind("assistant");
  };

  return (
    <div className="teacher-page__content">
      <button
        className={`teacher-sidebar__backdrop ${sidebarOpen ? "teacher-sidebar__backdrop--open" : ""}`}
        type="button"
        aria-label="Закрити список асистентів"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`teacher-sidebar ${sidebarOpen ? "teacher-sidebar--open" : ""}`}>
        <div className="teacher-sidebar__header">
          <span>Усі асистенти</span>
          <div className="teacher-sidebar__actions">
            <button
              className="icon-button teacher-sidebar__close"
              type="button"
              aria-label="Закрити список асистентів"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>

            <button className="icon-button" type="button" aria-label="Створити групу" onClick={() => setCreatingGroup({ id: "new", title: "" })}>
              <FolderPlus size={18} />
            </button>
            <button className="icon-button" type="button" aria-label="Створити асистента" onClick={() => onNavigate("/admin/assistants/new")}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="teacher-assistant-list">
          <AssistantTreeList
            assistants={assistants}
            groups={assistantGroups}
            activeAssistantId={activeAssistant?.id || ""}
            onSelectAssistant={selectAssistant}
            onDeleteAssistant={setDeletingAssistant}
            onEditGroup={openEditGroup}
            onShareAssistant={openAssistantShare}
            onShareGroup={openGroupShare}
          />
        </div>
      </aside>

      <main className="teacher-main">
        <header className="teacher-main__header teacher-main__header--split">
          <div className="teacher-main__title-wrap">
            <button
              className="icon-button teacher-sidebar-toggle"
              type="button"
              aria-label="Відкрити список асистентів"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft size={18} />
            </button>

            <h1>{activeAssistant?.title || "Оберіть асистента"}</h1>
          </div>

          {activeAssistant ? (
            <button
              className="button button--dark teacher-share-button"
              type="button"
              onClick={() => openAssistantShare(activeAssistant)}
            >
              <ShareGlyph className="teacher-share-button__icon" />
              Поширити
            </button>
          ) : null}
        </header>

        <div className="teacher-tabs" role="tablist" aria-label="Керування асистентом">
          <button
            className={activePanel === "settings" ? "teacher-tab teacher-tab--active" : "teacher-tab"}
            type="button"
            onClick={() => setActivePanel("settings")}
          >
            Налаштування
          </button>
          <button
            className={activePanel === "documents" ? "teacher-tab teacher-tab--active" : "teacher-tab"}
            type="button"
            onClick={() => setActivePanel("documents")}
          >
            Документи
          </button>
          <button
            className={activePanel === "students" ? "teacher-tab teacher-tab--active" : "teacher-tab"}
            type="button"
            onClick={() => setActivePanel("students")}
          >
            Студенти
          </button>
        </div>

        <div className="teacher-panel-wrap">
          {activePanel === "settings" ? (
            <AssistantSettingsPanel
              assistant={activeAssistant}
              loadAssistant={getAdminAssistantById}
              updateAssistant={updateAdminAssistant}
              getAssistantSystemPrompt={getAdminAssistantSystemPrompt}
              setAssistantSystemPrompt={setAdminAssistantSystemPrompt}
              deleteAssistantSystemPrompt={deleteAdminAssistantSystemPrompt}
              getPromptSourceAssistants={getAdminPromptSourceAssistants}
              onSaved={async (savedAssistant) => {
                await reloadAssistants(savedAssistant.id);
              }}
            />
          ) : activePanel === "documents" ? (
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
                {documentsLoadError ? <p className="teacher-inline-feedback">{documentsLoadError}</p> : null}
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
              {studentsLoadError ? <p className="teacher-inline-feedback">{studentsLoadError}</p> : null}

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
      <AssistantGroupEditModal
        key={editingGroup?.id || "empty"}
        group={editingGroup}
        initialPrompt={editingGroupPrompt}
        saving={savingGroup}
        onCancel={() => setEditingGroup(null)}
        onSave={saveGroup}
      />
      <AssistantGroupEditModal
        key={creatingGroup?.id || "empty-create"}
        group={creatingGroup}
        initialPrompt=""
        saving={savingGroup}
        titleText="Створити групу"
        onCancel={() => setCreatingGroup(null)}
        onSave={saveNewGroup}
      />
      <AssistantShareModal
        target={shareTarget}
        kind={shareKind}
        onClose={closeShareModal}
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
  if (path === "/admin/safety-events") activeNav = "/admin/safety-events";

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
      {activeNav === "/admin/safety-events" ? <AdminSafetyEventsTab onNavigate={onNavigate} /> : null}
    </div>
  );
}

function AdminSafetyEventsTab({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 12, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const page = pagination.page;
  const pageSize = pagination.page_size;
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pageSize));

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      try {
        const data = await getAdminSafetyEvents(page, pageSize);
        if (!cancelled) {
          setEvents(data.items || []);
          setPagination(data.pagination || { page, page_size: pageSize, total: 0 });
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setEvents([]);
          setLoadError(error instanceof Error ? error.message : "Не вдалося завантажити небезпечні запити.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const openStudentChat = (event) => {
    const params = new URLSearchParams({
      assistant_id: event.assistant_id,
      student_id: event.user_id,
      student_email: event.user_email || "",
    });

    onNavigate(`/admin/students/chat?${params.toString()}`);
  };

  const goPrev = () => {
    if (page > 1) {
      setPagination((current) => ({ ...current, page: current.page - 1 }));
    }
  };

  const goNext = () => {
    if (page < totalPages) {
      setPagination((current) => ({ ...current, page: current.page + 1 }));
    }
  };

  const shortenPrompt = (prompt, maxLength = 180) => {
    const normalized = String(prompt || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
  };

  return (
    <main className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p>Моніторинг безпеки</p>
          <h1>Небезпечні запити студентів</h1>
        </div>
      </header>

      <section className="admin-safety-shell">
        <div className="admin-models-summary">
          <article className="admin-stat-card">
            <span>Усього подій</span>
            <strong>{pagination.total}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Поточна сторінка</span>
            <strong>{page}</strong>
          </article>
          <article className="admin-stat-card">
            <span>На сторінці</span>
            <strong>{events.length}</strong>
          </article>
        </div>

        {loadError ? <p className="teacher-muted">{loadError}</p> : null}

        <div className="admin-safety-list">
          {loading ? <p className="teacher-muted">Завантаження...</p> : null}
          {!loading && events.length === 0 ? <p className="teacher-muted">Небезпечних запитів ще немає.</p> : null}

          {events.map((event) => (
            <article className="admin-safety-event" key={event.id}>
              <div className="admin-safety-event__top">
                <div className="admin-safety-event__meta">
                  <span>Час</span>
                  <strong>{new Date(event.created_at).toLocaleString("uk-UA")}</strong>
                </div>

                <div className="admin-safety-event__meta">
                  <span>Студент</span>
                  <strong>{event.user_email || event.user_id}</strong>
                </div>

                <div className="admin-safety-event__meta">
                  <span>Асистент</span>
                  <strong>{event.assistant_title}</strong>
                </div>

                <div className="admin-safety-event__meta">
                  <span>Причина</span>
                  <strong>{event.reason}</strong>
                </div>
              </div>

              <div className="admin-safety-event__prompt-box">
                <div className="admin-safety-event__prompt-label">
                  <AlertTriangle size={16} />
                  <span>Промпт</span>
                </div>

                <p className="admin-safety-event__prompt" title={event.prompt}>
                  {shortenPrompt(event.prompt)}
                </p>
              </div>

              <div className="admin-safety-event__actions">
                <button className="button button--ghost" type="button" onClick={() => openStudentChat(event)}>
                  <MessageSquareText size={16} />
                  Переглянути в чаті
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-safety-pagination">
          <button className="button button--ghost" type="button" onClick={goPrev} disabled={page <= 1 || loading}>
            Назад
          </button>

          <span>
            Сторінка {page} з {totalPages}
          </span>

          <button className="button button--ghost" type="button" onClick={goNext} disabled={page >= totalPages || loading}>
            Далі
          </button>
        </div>
      </section>
    </main>
  );
}
