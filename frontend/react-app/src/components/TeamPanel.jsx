export function TeamPanel({ members }) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Equipo</p>
            <h3>Miembros y alcance</h3>
          </div>
        </div>
        <div className="member-list">
          {members.map((member) => (
            <article key={member.name} className="member-card">
              <div>
                <strong>{member.name}</strong>
                <p>{member.role}</p>
              </div>
              <div className="member-meta">
                <span>{member.status}</span>
                <small>{member.scope}</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="calendar-highlight">
        <p className="eyebrow">Permisos</p>
        <h3>La interfaz muestra alcance operativo sin exponer secretos.</h3>
        <p>
          Los roles visibles orientan al usuario, pero las autorizaciones finales deben resolverse en Spring Security.
        </p>
      </div>
    </section>
  );
}
