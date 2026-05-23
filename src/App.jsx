import { useEffect, useState } from "react";
import StudentGuestWorkspacePage from "./pages/StudentGuestWorkspacePage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminModelCreatePage from "./pages/AdminModelCreatePage.jsx";
import StudentChatPage from "./pages/StudentChatPage.jsx";
import TeacherAssistantCreatePage from "./pages/TeacherAssistantCreatePage.jsx";
import TeacherDashboardPage from "./pages/TeacherDashboardPage.jsx";
import {
  createAdminAssistant,
  deleteAdminAssistant,
  getAdminAssistantById,
  getAdminStudentChatForAssistant,
  updateAdminAssistant,
} from "./services/admin.js";
import {
  createTeacherAssistant,
  deleteTeacherAssistant,
  getStudentChatForAssistant,
  getTeacherAssistantById,
  updateTeacherAssistant,
} from "./services/teacher.js";
import { getCurrentSession, logoutSession } from "./services/session.js";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/header.css";
import "./styles/modal.css";
import "./styles/assistants.css";
import "./styles/chat.css";
import "./styles/teacher.css";
import "./styles/admin.css";
import "./styles/responsive.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState(window.location.pathname);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(window.location.pathname);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const currentSession = await getCurrentSession();
      if (cancelled) return;
      setSession(currentSession);
      setReady(true);
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (!ready || path !== "/") return;
    if (session?.role === "admin") {
      navigate("/admin/assistants");
    } else if (session?.role === "teacher") {
      navigate("/teacher");
    }
  }, [ready, session?.role, path]);

  const handleSessionChange = (nextSession) => {
    setSession(nextSession);
  };

  const handleLogout = async () => {
    const nextSession = await logoutSession();
    setSession(nextSession);
    navigate("/");
  };

  if (!ready) {
    return <div className="app-loading">Завантаження...</div>;
  }

  if (path.startsWith("/admin")) {
    if (session?.role !== "admin") {
      return (
        <div className="teacher-forbidden">
          <h1>403</h1>
          <p>Сторінка доступна тільки адміну.</p>
          <button className="button button--dark" type="button" onClick={() => navigate("/")}>
            На головну
          </button>
        </div>
      );
    }

    const adminModelEditMatch = path.match(/^\/admin\/models\/([^/]+)\/edit$/);

    if (adminModelEditMatch) {
      return (
        <AdminModelCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          mode="edit"
          modelId={adminModelEditMatch[1]}
        />
      );
    }

    if (path === "/admin/assistants/new") {
      return (
        <TeacherAssistantCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          createAssistant={createAdminAssistant}
          backPath="/admin/assistants"
          eyebrow="Новий асистент"
          titleText="Створення асистента"
          description="Адміністратор може створити нового асистента, а потім додати до нього документи та студентів на сторінці керування."
        />
      );
    }

    const adminAssistantEditMatch = path.match(/^\/admin\/assistants\/([^/]+)\/edit$/);

    if (adminAssistantEditMatch) {
      return (
        <TeacherAssistantCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          mode="edit"
          assistantId={adminAssistantEditMatch[1]}
          loadAssistant={getAdminAssistantById}
          updateAssistant={updateAdminAssistant}
          backPath="/admin/assistants"
          eyebrow="Редагування асистента"
          titleText="Редагування асистента"
          description="Адміністратор може змінити назву, модель і публічність асистента."
        />
      );
    }

    if (path === "/admin/models/new") {
      return (
        <AdminModelCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          mode="create"
        />
      );
    }

    if (path === "/admin/students/chat") {
      return (
        <StudentChatPage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          basePath="/admin/assistants"
          getChat={getAdminStudentChatForAssistant}
          title="Чат студента в асистенті"
        />
      );
    }

    return <AdminDashboardPage session={session} onLogout={handleLogout} onNavigate={navigate} path={path} />;
  }

  if (path.startsWith("/teacher")) {
    if (session?.role !== "teacher") {
      return (
        <div className="teacher-forbidden">
          <h1>403</h1>
          <p>Сторінка доступна тільки викладачу.</p>
          <button className="button button--dark" type="button" onClick={() => navigate("/")}>
            На головну
          </button>
        </div>
      );
    }

    if (path === "/teacher/assistants/new") {
      return (
        <TeacherAssistantCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          createAssistant={createTeacherAssistant}
          backPath="/teacher"
        />
      );
    }

    const teacherAssistantEditMatch = path.match(/^\/teacher\/assistants\/([^/]+)\/edit$/);

    if (teacherAssistantEditMatch) {
      return (
        <TeacherAssistantCreatePage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          mode="edit"
          assistantId={teacherAssistantEditMatch[1]}
          loadAssistant={getTeacherAssistantById}
          updateAssistant={updateTeacherAssistant}
          backPath="/teacher"
          eyebrow="Редагування асистента"
          titleText="Редагування асистента"
          description="Викладач може змінити назву, модель і публічність асистента."
        />
      );
    }

    if (path === "/teacher/students/chat") {
      return (
        <StudentChatPage
          session={session}
          onLogout={handleLogout}
          onNavigate={navigate}
          basePath="/teacher"
          getChat={getStudentChatForAssistant}
          title="Чат студента"
        />
      );
    }

    return <TeacherDashboardPage session={session} onLogout={handleLogout} onNavigate={navigate} />;
  }

  return <StudentGuestWorkspacePage session={session} onSessionChange={handleSessionChange} onNavigate={navigate} />;
}