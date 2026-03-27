import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { calculateProjectProgress } from '../utils/projects';
import { sanitizeMultilineText, sanitizePlainText, validateProjectForm } from '../utils/security';
import { getWorkspaceMembers } from '../utils/team';

const initialProjectForm = {
  name: '',
  domain: 'Producto',
  summary: '',
  lead: '',
  risk: 'Medium',
  classification: 'Restricted',
  dueDate: ''
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { createProject, currentUser, projects, tasks, userDirectory, workgroups } = useAppContext();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialProjectForm);
  const [submitted, setSubmitted] = useState(false);

  const deferredQuery = useDeferredValue(query);
  const errors = useMemo(() => validateProjectForm(form), [form]);
  const assignableLeads = useMemo(
    () => getWorkspaceMembers(workgroups, currentUser, userDirectory),
    [currentUser, userDirectory, workgroups]
  );

  const filteredProjects = useMemo(() => {
    const normalized = deferredQuery.toLowerCase().trim();

    return projects
      .filter((project) => {
        if (!normalized) {
          return true;
        }

        return [project.name, project.domain, project.risk, project.code]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      })
      .map((project) => ({
        ...project,
        progress: calculateProjectProgress(tasks, project.id)
      }));
  }, [deferredQuery, projects, tasks]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'summary' ? sanitizeMultilineText(value) : sanitizePlainText(value)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const projectId = await createProject(form);
    setForm(initialProjectForm);
    setSubmitted(false);
    navigate(`/app/projects/${projectId}`);
  }

  return (
    <div className="page-stack">
      <section className="page-panel portfolio-banner">
        <div>
          <p className="eyebrow">Portafolio</p>
          <h2>Todos los proyectos del equipo en un mismo lugar</h2>
          <p className="body-copy">
            Busca rapidamente una entrega, abre su detalle o crea un nuevo proyecto con responsables y fechas desde esta misma vista.
          </p>
        </div>
        <div className="signal-row">
          <span className="tag subtle-tag">{projects.length} proyectos</span>
          <span className="tag subtle-tag">{workgroups.length} equipos</span>
          <Link to="/app/groups" className="ghost-button link-button small-link">
            Ver equipos
          </Link>
        </div>
      </section>

      <section className="two-column-grid align-start-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Explorar</p>
              <h2>Busca y entra directo a cada proyecto</h2>
            </div>
          </div>

          <label className="field search-field">
            Buscar proyectos
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por nombre, codigo o area"
            />
          </label>

          <div className="card-list">
            {filteredProjects.length ? (
              filteredProjects.map((project) => (
                <Link key={project.id} to={`/app/projects/${project.id}`} className="detail-card link-card">
                  <div className="detail-card-top">
                    <span className="tag">{project.code}</span>
                    <span className="risk-pill">{project.risk}</span>
                  </div>
                  <h3>{project.name}</h3>
                  <p className="body-copy">{project.summary}</p>
                  <div className="project-meta-grid">
                    <span>{project.lead}</span>
                    <span>{project.dueDate}</span>
                  </div>
                  <div className="progress-rail">
                    <span style={{ width: `${project.progress}%` }} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">
                  {projects.length ? 'No encontramos resultados con esa busqueda.' : 'Todavia no hay proyectos creados en este espacio.'}
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="page-panel sticky-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Nuevo proyecto</p>
              <h2>Crea una entrega y ponla en movimiento</h2>
            </div>
          </div>

          {!assignableLeads.length ? (
            <div className="empty-state subtle-empty-state">
              <p className="body-copy">
                Crea o configura tu equipo primero para poder asignar un responsable real al proyecto.
              </p>
            </div>
          ) : null}

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              Nombre del proyecto
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Ejemplo: Lanzamiento mobile" />
              {submitted && errors.name ? <span className="field-error">{errors.name}</span> : null}
            </label>

            <label className="field">
              Area o equipo
              <input value={form.domain} onChange={(event) => updateField('domain', event.target.value)} placeholder="Producto, Diseno, Operaciones..." />
            </label>

            <label className="field">
              Responsable
              <select value={form.lead} onChange={(event) => updateField('lead', event.target.value)}>
                <option value="">Selecciona a la persona responsable</option>
                {assignableLeads.map((member) => (
                  <option key={member.id || member.email || member.name} value={member.name}>
                    {member.name}{member.email ? ` - ${member.email}` : ''}
                  </option>
                ))}
              </select>
              {submitted && errors.lead ? <span className="field-error">{errors.lead}</span> : null}
            </label>

            <div className="form-row">
              <label className="field">
                Prioridad
                <select value={form.risk} onChange={(event) => updateField('risk', event.target.value)}>
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                </select>
              </label>

              <label className="field">
                Visibilidad
                <select value={form.classification} onChange={(event) => updateField('classification', event.target.value)}>
                  <option value="Internal">Interno</option>
                  <option value="Restricted">Solo equipo</option>
                  <option value="Confidential">Reservado</option>
                </select>
              </label>
            </div>

            <label className="field">
              Resumen
              <textarea rows="5" value={form.summary} onChange={(event) => updateField('summary', event.target.value)} placeholder="Cuenta brevemente que busca lograr este proyecto." />
              {submitted && errors.summary ? <span className="field-error">{errors.summary}</span> : null}
            </label>

            <label className="field">
              Fecha objetivo
              <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} />
              {submitted && errors.dueDate ? <span className="field-error">{errors.dueDate}</span> : null}
            </label>

            <button type="submit" className="primary-button block-button">
              Crear proyecto
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
