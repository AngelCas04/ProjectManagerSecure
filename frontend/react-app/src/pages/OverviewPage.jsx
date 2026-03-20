import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { floatingCard, staggerItem, staggerParent } from '../utils/motion';
import { calculateProjectProgress } from '../utils/projects';

function sortByDate(values) {
  return [...values].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export default function OverviewPage() {
  const { currentUser, events, projects, tasks, timeline, workgroups } = useAppContext();

  const metrics = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const dueSoonTasks = sortByDate(tasks.filter((task) => task.status !== 'DONE')).slice(0, 4);
    const avgProgress = projects.length
      ? Math.round(
          projects.reduce((total, project) => total + calculateProjectProgress(tasks, project.id), 0) /
            projects.length
        )
      : 0;

    return {
      activeProjects: projects.length,
      completedTasks,
      inProgressTasks,
      avgProgress,
      dueSoonTasks,
      teams: workgroups.length
    };
  }, [projects, tasks, workgroups.length]);

  const projectPulse = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        progress: calculateProjectProgress(tasks, project.id)
      })),
    [projects, tasks]
  );

  const recentActivity = useMemo(() => timeline.slice(0, 5), [timeline]);
  const nextEvents = useMemo(() => events.slice(0, 4), [events]);
  const hasProjects = projects.length > 0;

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="hero-surface dashboard-hero" variants={staggerItem}>
        <div className="hero-copy-block">
          <p className="eyebrow">Resumen del dia</p>
          <h1>{currentUser?.name ? `Hola, ${currentUser.name}. Todo el trabajo de tu equipo esta a la vista.` : 'Todo el trabajo de tu equipo esta a la vista.'}</h1>
          <p className="body-copy hero-copy">
            Revisa prioridades, encuentra rapidamente tus proyectos y manten al equipo alineado durante toda la jornada.
          </p>
        </div>

        <div className="hero-command-panel">
          <div className="hero-actions">
            <Link to="/app/projects" className="primary-button link-button">
              Ver proyectos
            </Link>
            <Link to="/app/chat" className="ghost-button link-button">
              Abrir mensajes
            </Link>
            <Link to="/app/calendar" className="ghost-button link-button">
              Ver calendario
            </Link>
          </div>

          <div className="hero-mini-grid">
            <article className="hero-mini-card">
              <span>Equipos</span>
              <strong>{metrics.teams}</strong>
            </article>
            <article className="hero-mini-card">
              <span>Tareas cercanas</span>
              <strong>{metrics.dueSoonTasks.length}</strong>
            </article>
          </div>
        </div>
      </motion.section>

      <motion.section className="metric-grid" variants={staggerParent}>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Proyectos activos</span>
          <strong>{metrics.activeProjects}</strong>
          <p className="body-copy">Todo lo que tu equipo tiene en marcha en este momento.</p>
        </motion.article>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Tareas completadas</span>
          <strong>{metrics.completedTasks}</strong>
          <p className="body-copy">Lo que ya se cerro y avanza a la siguiente etapa.</p>
        </motion.article>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>En curso</span>
          <strong>{metrics.inProgressTasks}</strong>
          <p className="body-copy">Lo que hoy necesita seguimiento o decision del equipo.</p>
        </motion.article>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Avance promedio</span>
          <strong>{metrics.avgProgress}%</strong>
          <p className="body-copy">Una vista rapida del ritmo general del portafolio.</p>
        </motion.article>
      </motion.section>

      {!hasProjects ? (
        <motion.section className="page-panel empty-state workspace-onboarding" variants={staggerItem}>
          <div>
            <p className="eyebrow">Primeros pasos</p>
            <h2>Tu espacio ya esta listo. Solo falta crear el primer proyecto o ajustar el equipo que lo llevara adelante.</h2>
            <p className="body-copy">
              Empieza por el equipo si quieres definir responsables, o crea el primer proyecto para arrancar con tareas y fechas.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/app/groups" className="primary-button link-button">
              Ir a equipos
            </Link>
            <Link to="/app/projects" className="ghost-button link-button">
              Crear proyecto
            </Link>
          </div>
        </motion.section>
      ) : null}

      <motion.section className="two-column-grid" variants={staggerParent}>
        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Proyectos en marcha</p>
              <h2>Lo que mueve al equipo</h2>
            </div>
          </div>
          <div className="card-list">
            {projectPulse.length ? (
              projectPulse.map((project) => (
                <motion.div key={project.id} variants={floatingCard} initial="rest" whileHover="hover">
                  <Link to={`/app/projects/${project.id}`} className="detail-card link-card">
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
                </motion.div>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Todavia no hay proyectos visibles para esta cuenta.</p>
              </div>
            )}
          </div>
        </motion.article>

        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Pendientes cercanos</p>
              <h2>Lo que conviene resolver primero</h2>
            </div>
            <Link to="/app/board" className="ghost-button link-button small-link">
              Abrir tablero
            </Link>
          </div>
          <div className="card-list">
            {metrics.dueSoonTasks.length ? (
              metrics.dueSoonTasks.map((task) => (
                <motion.article key={task.id} className="detail-card" variants={floatingCard} initial="rest" whileHover="hover">
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
                </motion.article>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Cuando haya tareas por atender pronto, apareceran aqui.</p>
              </div>
            )}
          </div>
        </motion.article>
      </motion.section>

      <motion.section className="two-column-grid" variants={staggerParent}>
        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Proximas fechas</p>
              <h2>Calendario del equipo</h2>
            </div>
          </div>
          <div className="timeline-list">
            {nextEvents.length ? (
              nextEvents.map((event) => (
                <div key={event.id} className="timeline-item">
                  <strong>{event.date}</strong>
                  <div>
                    <h3>{event.title}</h3>
                    <p className="body-copy">
                      {event.time} | {event.type} | {event.owner}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Aun no hay reuniones o entregas programadas.</p>
              </div>
            )}
          </div>
        </motion.article>

        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Actividad reciente</p>
              <h2>Ultimos movimientos</h2>
            </div>
          </div>
          <div className="timeline-list compact-list">
            {recentActivity.length ? (
              recentActivity.map((entry) => (
                <div key={entry.id} className="timeline-item compact-item">
                  <strong>{entry.scope}</strong>
                  <div>
                    <h3>{entry.description}</h3>
                    <p className="body-copy">
                      {entry.date} | {entry.actor}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">La actividad del espacio aparecera aqui conforme el equipo trabaje.</p>
              </div>
            )}
          </div>
        </motion.article>
      </motion.section>
    </motion.div>
  );
}
