export function AccessPanel({ events }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Monitoreo</p>
          <h3>Actividad de acceso</h3>
        </div>
      </div>
      <div className="access-grid">
        {events.map((event) => (
          <article key={event.title} className="access-card">
            <span>{event.title}</span>
            <strong>{event.value}</strong>
            <p>{event.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
