export function VersionPanel({ entries }) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Control de versiones</p>
            <h3>Linea de cambios</h3>
          </div>
        </div>
        <div className="version-list">
          {entries.map((entry) => (
            <article key={`${entry.date}-${entry.author}`} className="version-card">
              <span>{entry.date}</span>
              <strong>{entry.description}</strong>
              <p>{entry.author}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="audit-panel">
        <p className="eyebrow">Auditoria</p>
        <h3>Cada cambio importante deja huella.</h3>
        <ul>
          <li>Eventos listos para integrarse con logs firmados.</li>
          <li>Permisos por rol en cada accion sensible.</li>
          <li>Compatibilidad con alertas de seguridad.</li>
        </ul>
      </div>
    </section>
  );
}
