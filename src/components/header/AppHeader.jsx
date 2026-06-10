const roleLabels = {
  guest: "Гість",
  student: "Студент",
  teacher: "Викладач",
  admin: "Адмін",
};

export default function AppHeader({
  session,
  onLoginClick,
  onLogout,
  navItems = [],
  activeNav = "",
  onNavigate,
  showPanelShortcut = true,
}) {
  const role = session?.role || "guest";
  const hasNav = navItems.length > 0;

  const panelPathByRole = {
    admin: "/admin/assistants",
    teacher: "/teacher",
  };

  const panelRootByRole = {
    admin: "/admin",
    teacher: "/teacher",
  };

  const panelLabelByRole = {
    admin: "Admin panel",
    teacher: "Teacher panel",
  };

  const panelCompactLabelByRole = {
    admin: "Admin",
    teacher: "Teacher",
  };

  const panelPath = panelPathByRole[role];
  const panelRoot = panelRootByRole[role];
  const isInsideOwnPanel = panelRoot
    ? window.location.pathname.startsWith(panelRoot)
    : false;

  const shouldShowPanelShortcut =
    showPanelShortcut && panelPath && !isInsideOwnPanel;

  return (
    <header className="app-header">
      <button
        className="app-header__brand"
        type="button"
        onClick={() => onNavigate?.("/")}
      >
        PolyAI Mentor
      </button>

      {hasNav ? (
        <nav className="app-header__nav" aria-label="Головна навігація">
          {navItems.map((item) => (
            <button
              className={`app-header__nav-link ${
                activeNav === item.path ? "app-header__nav-link--active" : ""
              }`}
              key={item.path}
              type="button"
              onClick={() => onNavigate?.(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : (
        <div className="app-header__nav app-header__nav--empty" aria-hidden="true" />
      )}

      <div className="app-header__actions">
        <span className="app-header__role">{roleLabels[role] || role}</span>

        {shouldShowPanelShortcut ? (
          <button
            className="button button--ghost app-header__panel-shortcut"
            type="button"
            onClick={() => onNavigate?.(panelPath)}
          >
            <span className="app-header__panel-label app-header__panel-label--full">
              {panelLabelByRole[role]}
            </span>
            <span className="app-header__panel-label app-header__panel-label--compact">
              {panelCompactLabelByRole[role]}
            </span>
          </button>
        ) : null}

        {session?.authenticated && session?.role !== "guest" ? (
          <button className="button button--ghost" type="button" onClick={onLogout}>
            Вийти
          </button>
        ) : (
          <button className="button button--dark" type="button" onClick={onLoginClick}>
            Вхід
          </button>
        )}
      </div>
    </header>
  );
}