const roleLabels = {
  guest: "Гість",
  student: "Студент",
  teacher: "Викладач",
  admin: "Адмін",
};

export default function AppHeader({ session, onLoginClick, onLogout, navItems = [], activeNav = "", onNavigate }) {
  const role = session?.role || "guest";
  const hasNav = navItems.length > 0;

  return (
    <header className="app-header">
      <div className="app-header__brand">PolyAI Mentor</div>

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
        {session?.authenticated ? (
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
