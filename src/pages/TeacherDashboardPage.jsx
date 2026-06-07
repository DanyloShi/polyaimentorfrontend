import { Plus, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import AssistantGroupEditModal from "../components/assistants/AssistantGroupEditModal.jsx";
import AssistantTreeList from "../components/assistants/AssistantTreeList.jsx";
import DeleteAssistantModal from "../components/assistants/DeleteAssistantModal.jsx";
import AppHeader from "../components/header/AppHeader.jsx";
import {
  addStudentToAssistant,
  deleteAssistantDocument,
  deleteAssistantGroupSystemPrompt,
  deleteTeacherAssistant,
  getAssistantGroupSystemPrompt,
  getAssistantGroups,
  getAssistantDocuments,
  getAssistantStudents,
  getTeacherAssistants,
  removeStudentFromAssistant,
  searchStudentsByEmail,
  setAssistantGroupSystemPrompt,
  updateAssistantGroup,
  uploadAssistantDocument,
} from "../services/teacher.js";

const statusLabels = {
  uploaded: "Завантажено",
  queued: "В черзі",
  indexing: "Індексується",
  ready: "Готово",
  failed: "Помилка",
};

export default function TeacherDashboardPage({ session, onLogout, onNavigate }) {
  const [assistants, setAssistants] = useState([]);
  const [assistantGroups, setAssistantGroups] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [activePanel, setActivePanel] = useState("documents");
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
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingGroupPrompt, setEditingGroupPrompt] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const reloadAssistants = async (preferredAssistantId = null) => {
    const [loadedAssistants, loadedGroups] = await Promise.all([
      getTeacherAssistants(),
      getAssistantGroups(),
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
        getAssistantDocuments(assistant.id),
        getAssistantStudents(assistant.id),
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
        getTeacherAssistants(),
        getAssistantGroups(),
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
    await loadAssistantDetails(assistant);
  };

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeAssistant) return;

    await uploadAssistantDocument(activeAssistant.id, file);
    setDocuments(await getAssistantDocuments(activeAssistant.id));
  };

  const deleteDocument = async (sourceId) => {
    if (!activeAssistant) return;
    await deleteAssistantDocument(activeAssistant.id, sourceId);
    setDocuments(await getAssistantDocuments(activeAssistant.id));
  };

  const searchStudents = async (value) => {
    setStudentQuery(value);
    setStudentActionMessage("");
    setStudentResults(await searchStudentsByEmail(value));
  };

  const addStudent = async (student) => {
    if (!activeAssistant) return;
    setAddingStudentId(student.id);
    setStudentActionMessage("");
    try {
      setStudents(await addStudentToAssistant(activeAssistant.id, student));
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
    setStudents(await removeStudentFromAssistant(activeAssistant.id, studentId));
  };

  const confirmDeleteAssistant = async () => {
    if (!deletingAssistant) return;

    setDeletingAssistantPending(true);
    try {
      await deleteTeacherAssistant(deletingAssistant.id);

      const preferredAssistantId = activeAssistant?.id === deletingAssistant.id ? null : activeAssistant?.id || null;
      await reloadAssistants(preferredAssistantId);
      setDeletingAssistant(null);
    } finally {
      setDeletingAssistantPending(false);
    }
  };

  const openEditGroup = async (group) => {
    setEditingGroupPrompt("");

    try {
      const prompt = await getAssistantGroupSystemPrompt(group.id);
      setEditingGroupPrompt(prompt?.content || "");
    } catch {
      setEditingGroupPrompt("");
    } finally {
      setEditingGroup(group);
    }
  };

  const saveGroup = async ({ title, prompt }) => {
    if (!editingGroup) return;

    setSavingGroup(true);
    try {
      const updatedGroup = await updateAssistantGroup(editingGroup.id, { title });
      if (prompt) {
        await setAssistantGroupSystemPrompt(editingGroup.id, prompt);
      } else {
        await deleteAssistantGroupSystemPrompt(editingGroup.id);
      }
      setAssistantGroups((groups) => groups.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      setEditingGroup(null);
      setEditingGroupPrompt("");
    } finally {
      setSavingGroup(false);
    }
  };

  return (
    <div className="teacher-page">
      <AppHeader session={session} onLogout={onLogout} onNavigate={onNavigate} showPanelShortcut={false} />

      <div className="teacher-page__content">
        <aside className="teacher-sidebar">
          <div className="teacher-sidebar__header">
            <span>Мої асистенти</span>
            <button className="icon-button" type="button" aria-label="Створити асистента" onClick={() => onNavigate("/teacher/assistants/new")}>
              <Plus size={18} />
            </button>
          </div>

          <div className="teacher-assistant-list">
            <AssistantTreeList
              assistants={assistants}
              groups={assistantGroups}
              activeAssistantId={activeAssistant?.id || ""}
              onSelectAssistant={selectAssistant}
              onEditAssistant={(assistant) => onNavigate(`/teacher/assistants/${assistant.id}/edit`)}
              onDeleteAssistant={setDeletingAssistant}
              onEditGroup={openEditGroup}
            />
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
                          <small>{student.role}</small>
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
                    <div className="teacher-student" key={student.id}>
                      <div className="teacher-student__info">
                        <strong>{student.email || student.id}</strong>
                        <span>{student.role}</span>
                      </div>
                      <div className="teacher-student__actions">
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
      </div>
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
    </div>
  );
}
