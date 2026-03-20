export function ProjectsPanel({ projects }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Gestion de proyectos</p>
          <h3>Portafolio protegido</h3>
        </div>
        <button type="button" className="primary-button secondary-tone">
          Nuevo proyecto
        </button>
      </div>

      <div className="project-grid">
        {projects.map((project) => (
          <article key={project.id} className="project-card">
            <div className="project-head">
              <span className="badge">{project.id}</span>
              <span className="risk-tag">Riesgo {project.risk}</span>
            </div>
            <h4>{project.name}</h4>
            <p>{project.type}</p>
            <dl>
              <div>
                <dt>Miembros</dt>
                <dd>{project.members}</dd>
              </div>
              <div>
                <dt>Permisos</dt>
                <dd>{project.permissions}</dd>
              </div>
              <div>
                <dt>Avance</dt>
                <dd>{project.progress}%</dd>
              </div>
            </dl>
            <div className="progress-bar" aria-label={`Avance ${project.progress}%`}>
              <span style={{ width: `${project.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
