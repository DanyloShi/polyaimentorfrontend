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
  const panelLabelByRole = {
    admin: "Admin panel",
    teacher: "Teacher panel",
  };
  const panelPath = panelPathByRole[role];

  return (
    <header className="app-header">
      <button className="app-header__brand" type="button" onClick={() => onNavigate?.("/")}>
        PolyAI Mentor
      </button>

      {hasNav ? (
        <nav className="app-header__nav" aria-label="Головна навігація">
          {navItems.map((item) => (
            <button
              className={`app-header__nav-link ${activeNav === item.path ? "app-header__nav-link--active" : ""}`}
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
        {showPanelShortcut && panelPath ? (
          <button className="button button--ghost" type="button" onClick={() => onNavigate?.(panelPath)}>
            {panelLabelByRole[role]}
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
