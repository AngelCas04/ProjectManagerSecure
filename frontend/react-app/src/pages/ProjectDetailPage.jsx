import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { calculateProjectProgress } from '../utils/projects';
import { sanitizeMultilineText, sanitizePlainText, validateTaskForm } from '../utils/security';

const initialTaskForm = {
  title: '',
  description: '',
  assignee: '',
  dueDate: '',
  priority: 'Medium',
  status: 'TODO'
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { createTask, events, messages, projects, tasks, timeline } = useAppContext();
  const [form, setForm] = useState(initialTaskForm);
  const [submitted, setSubmitted] = useState(false);

  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);
  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [projectId, tasks]);
  const projectEvents = useMemo(() => events.filter((event) => event.projectId === projectId), [events, projectId]);
  const projectMessages = useMemo(() => messages.filter((message) => message.projectId === projectId), [messages, projectId]);
  const projectTimeline = useMemo(() => timeline.filter((entry) => entry.projectId === projectId), [projectId, timeline]);
  const progress = useMemo(() => calculateProjectProgress(tasks, projectId), [projectId, tasks]);
  const errors = useMemo(() => validateTaskForm({ ...form, projectId }), [form, projectId]);

  if (!project) {
    return (
      <section className="page-panel empty-state">
        <p className="eyebrow">Proyecto no encontrado</p>
        <h2>No encontramos ese proyecto en tu espacio.</h2>
        <Link to="/app/projects" className="primary-button link-button">
          Volver a proyectos
        </Link>
      </section>
    );
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'description' ? sanitizeMultilineText(value) : sanitizePlainText(value)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await createTask({ ...form, projectId });
    setForm(initialTaskForm);
    setSubmitted(false);
  }

  return (
    <div className="page-stack">
      <section className="hero-surface compact-hero">
        <div>
          <p className="eyebrow">{project.code}</p>
          <h1>{project.name}</h1>
          <p className="body-copy hero-copy">{project.summary}</p>
        </div>

        <div className="hero-actions project-links">
          <Link to={`/app/board?project=${project.id}`} className="primary-button link-button">
            Abrir tablero
          </Link>
          <Link to={`/app/chat?project=${project.id}`} className="ghost-button link-button">
            Abrir mensajes
          </Link>
          <Link to={`/app/calendar?project=${project.id}`} className="ghost-button link-button">
            Ver calendario
          </Link>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card glass-card">
          <span>Responsable</span>
          <strong>{project.lead}</strong>
          <p className="body-copy">La persona que coordina el rumbo y las decisiones del proyecto.</p>
        </article>
        <article className="metric-card glass-card">
          <span>Avance</span>
          <strong>{progress}%</strong>
          <p className="body-copy">El progreso general segun el trabajo que ya se marco como completado.</p>
        </article>
        <article className="metric-card glass-card">
          <span>Visibilidad</span>
          <strong>{project.classification}</strong>
          <p className="body-copy">Como se comparte este proyecto dentro del espacio.</p>
        </article>
        <article className="metric-card glass-card">
          <span>Participantes</span>
          <strong>{project.members}</strong>
          <p className="body-copy">Personas que hoy estan vinculadas a esta entrega.</p>
        </article>
      </section>

      <section className="two-column-grid align-start-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Tareas</p>
              <h2>Vista rapida del trabajo actual</h2>
            </div>
          </div>
          <div className="card-list">
            {projectTasks.map((task) => (
              <article key={task.id} className="detail-card">
                <div className="detail-card-top">
                  <span className="tag">{task.status}</span>
                  <span className="task-priority">{task.priority}</span>
                </div>
                <h3>{task.title}</h3>
                <p className="body-copy">{task.description}</p>
                <div className="project-meta-grid">
                  <span>{task.assignee}</span>
                  <span>{task.dueDate}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="page-panel sticky-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Nueva tarea</p>
              <h2>Agrega algo sin salir del proyecto</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              Titulo
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
              {submitted && errors.title ? <span className="field-error">{errors.title}</span> : null}
            </label>

            <label className="field">
              Descripcion
              <textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>

            <div className="form-row">
              <label className="field">
                Responsable
                <input value={form.assignee} onChange={(event) => updateField('assignee', event.target.value)} />
                {submitted && errors.assignee ? <span className="field-error">{errors.assignee}</span> : null}
              </label>

              <label className="field">
                Fecha limite
                <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} />
                {submitted && errors.dueDate ? <span className="field-error">{errors.dueDate}</span> : null}
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                Prioridad
                <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                  <option value="Critical">Critica</option>
                </select>
              </label>

              <label className="field">
                Estado
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option value="TODO">Por hacer</option>
                  <option value="IN_PROGRESS">En curso</option>
                  <option value="DONE">Hecha</option>
                </select>
              </label>
            </div>

            <button type="submit" className="primary-button block-button">
              Agregar tarea
            </button>
          </form>
        </article>
      </section>

      <section className="three-column-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Calendario</p>
              <h2>Proximas fechas</h2>
            </div>
          </div>
          <div className="timeline-list compact-list">
            {projectEvents.map((event) => (
              <div key={event.id} className="timeline-item compact-item">
                <strong>{event.date}</strong>
                <div>
                  <h3>{event.title}</h3>
                  <p className="body-copy">
                    {event.time} | {event.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Mensajes</p>
              <h2>Ultimas conversaciones</h2>
            </div>
          </div>
          <div className="card-list compact-card-list">
            {projectMessages.map((message) => (
              <article key={message.id} className="detail-card">
                <div className="detail-card-top">
                  <span className="tag">{message.author}</span>
                  <span>{message.time}</span>
                </div>
                <p className="body-copy">{message.text}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Actividad</p>
              <h2>Ultimos movimientos</h2>
            </div>
          </div>
          <div className="timeline-list compact-list">
            {projectTimeline.map((entry) => (
              <div key={entry.id} className="timeline-item compact-item">
                <strong>{entry.scope}</strong>
                <div>
                  <h3>{entry.description}</h3>
                  <p className="body-copy">
                    {entry.date} | {entry.actor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
