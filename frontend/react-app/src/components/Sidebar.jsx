const navigationItems = [
  'Resumen',
  'Proyectos',
  'Kanban',
  'Calendario',
  'Chat',
  'Versiones',
  'Seguridad'
];

export function Sidebar({ activeView, onChangeView, currentUser }) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">Project Manager Platform</p>
        <h1>Control colaborativo para equipos de tecnologia.</h1>
        <p className="sidebar-copy">
          Interfaz preparada para entornos enterprise, con sesiones seguras,
          visibilidad por rol y trazabilidad operativa.
        </p>
      </div>

      <nav className="sidebar-nav" aria-label="Secciones principales">
        {navigationItems.map((item) => (
          <button
            key={item}
            type="button"
            className={item === activeView ? 'nav-item active' : 'nav-item'}
            onClick={() => onChangeView(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="profile-card">
        <div className="avatar">{currentUser.initials}</div>
        <div>
          <strong>{currentUser.name}</strong>
          <p>{currentUser.role}</p>
          <span>{currentUser.team}</span>
        </div>
      </div>
    </aside>
  );
}
