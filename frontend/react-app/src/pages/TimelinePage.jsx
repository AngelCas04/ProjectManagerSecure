import { useDeferredValue, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function TimelinePage() {
  const { projects, timeline } = useAppContext();
  const [query, setQuery] = useState('');
  const [projectId, setProjectId] = useState('all');
  const deferredQuery = useDeferredValue(query);

  const visibleEntries = useMemo(() => {
    const normalized = deferredQuery.toLowerCase().trim();

    return timeline.filter((entry) => {
      const matchesProject = projectId === 'all' || entry.projectId === projectId;
      const matchesQuery =
        !normalized ||
        [entry.scope, entry.actor, entry.description, entry.date].join(' ').toLowerCase().includes(normalized);

      return matchesProject && matchesQuery;
    });
  }, [deferredQuery, projectId, timeline]);

  return (
    <div className="page-stack">
      <section className="page-panel">
        <div className="panel-headline">
          <div>
            <p className="eyebrow">Actividad</p>
            <h2>Todo lo importante que ha pasado recientemente</h2>
          </div>
        </div>

        <div className="filter-bar">
          <label className="field compact-field wide-field">
            Buscar actividad
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por persona, fecha o descripcion"
            />
          </label>

          <label className="field compact-field wide-field">
            Proyecto
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="all">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="timeline-list long-list">
          {visibleEntries.length ? (
            visibleEntries.map((entry) => (
              <article key={entry.id} className="timeline-item extended-item">
                <strong>{entry.scope}</strong>
                <div>
                  <h3>{entry.description}</h3>
                  <p className="body-copy">
                    {entry.date} | {entry.actor}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state subtle-empty-state">
              <p className="body-copy">No encontramos actividad con ese filtro.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
