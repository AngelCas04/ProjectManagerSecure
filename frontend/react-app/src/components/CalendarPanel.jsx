export function CalendarPanel({ events }) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Calendario</p>
            <h3>Agenda operativa</h3>
          </div>
        </div>
        <div className="timeline-list">
          {events.map((event) => (
            <article key={`${event.time}-${event.title}`} className="timeline-card">
              <span>{event.time}</span>
              <div>
                <strong>{event.title}</strong>
                <p>{event.type} - {event.project}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="calendar-highlight">
        <p className="eyebrow">Vista segura</p>
        <h3>Reuniones, fechas y entregas sin exponer datos sensibles.</h3>
        <p>
          El frontend solo muestra metadatos operativos y deja los permisos finos al backend.
        </p>
      </div>
    </section>
  );
}
