import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BoardColumn } from '../components/board/BoardColumn';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { staggerItem, staggerParent } from '../utils/motion';
import { STATUS_ORDER, groupTasksByStatus } from '../utils/projects';
import { sanitizeMultilineText, sanitizePlainText, validateTaskForm } from '../utils/security';

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export default function BoardPage() {
  const { createTask, moveTask, projects, tasks } = useAppContext();
  const { translate } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draggedTaskId, setDraggedTaskId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(() => ({
    projectId: searchParams.get('project') || projects[0]?.id || '',
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium',
    status: 'TODO'
  }));

  const activeProjectId = searchParams.get('project') || 'all';
  const projectLookup = useMemo(
    () => projects.reduce((lookup, project) => ({ ...lookup, [project.id]: project }), {}),
    [projects]
  );

  const visibleTasks = useMemo(() => {
    const scopedTasks = activeProjectId === 'all' ? tasks : tasks.filter((task) => task.projectId === activeProjectId);
    return sortTasks(scopedTasks);
  }, [activeProjectId, tasks]);

  const groupedTasks = useMemo(() => groupTasksByStatus(visibleTasks), [visibleTasks]);
  const errors = useMemo(() => validateTaskForm(form), [form]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'description' ? sanitizeMultilineText(value) : sanitizePlainText(value)
    }));
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await createTask(form);
    setForm((current) => ({
      ...current,
      title: '',
      description: '',
      assignee: '',
      dueDate: '',
      priority: 'Medium',
      status: 'TODO'
    }));
    setSubmitted(false);
  }

  async function handleDropTask(nextStatus) {
    if (!draggedTaskId) {
      return;
    }

    await moveTask(draggedTaskId, nextStatus);
    setDraggedTaskId('');
  }

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="page-panel board-banner" variants={staggerItem}>
        <div>
          <p className="eyebrow">Tablero</p>
          <h2>Organiza el trabajo y mueve cada tarea con claridad</h2>
        </div>
        <div className="signal-row compact-row">
          <span className="tag subtle-tag">{translate('TODO')}</span>
          <span className="tag subtle-tag">{translate('IN_PROGRESS')}</span>
          <span className="tag subtle-tag">{translate('DONE')}</span>
        </div>
      </motion.section>

      <motion.section className="board-toolbar page-panel" variants={staggerItem}>
        <div>
          <p className="eyebrow">Vista general</p>
          <h2>Cambia prioridades, revisa cargas y acompana el avance del equipo.</h2>
        </div>

        <div className="toolbar-actions">
          <label className="field compact-field wide-field">
            {translate('Project scope')}
            <select
              value={activeProjectId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchParams(nextValue === 'all' ? {} : { project: nextValue });
                setForm((current) => ({
                  ...current,
                  projectId: nextValue === 'all' ? current.projectId : nextValue
                }));
              }}
            >
              <option value="all">{translate('All projects')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {translate(project.name)}
                </option>
              ))}
            </select>
          </label>
          <div className="signal-row compact-row">
            {STATUS_ORDER.map((status) => (
              <span key={status} className="tag subtle-tag">
                {translate(status)}: {groupedTasks[status]?.length || 0}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="board-layout" variants={staggerParent}>
        <motion.div className="board-grid" variants={staggerParent}>
          {STATUS_ORDER.map((status) => (
            <motion.div key={status} variants={staggerItem}>
              <BoardColumn
                status={status}
                tasks={groupedTasks[status] || []}
                projectLookup={projectLookup}
                onDragTask={setDraggedTaskId}
                onDropTask={(nextStatus) => {
                  void handleDropTask(nextStatus);
                }}
                onMoveTask={(taskId, nextStatus) => {
                  void moveTask(taskId, nextStatus);
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.aside className="page-panel sticky-panel board-form-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{translate('New task')}</p>
              <h2>Agrega una tarea sin salir del tablero</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleCreateTask}>
            <label className="field">
              {translate('Project')}
              <select value={form.projectId} onChange={(event) => updateField('projectId', event.target.value)}>
                <option value="">{translate('Select project')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {translate(project.name)}
                  </option>
                ))}
              </select>
              {submitted && errors.projectId ? <span className="field-error">{translate(errors.projectId)}</span> : null}
            </label>

            <label className="field">
              {translate('Title')}
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
              {submitted && errors.title ? <span className="field-error">{translate(errors.title)}</span> : null}
            </label>

            <label className="field">
              {translate('Description')}
              <textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>

            <div className="form-row">
              <label className="field">
                {translate('Assignee')}
                <input value={form.assignee} onChange={(event) => updateField('assignee', event.target.value)} />
                {submitted && errors.assignee ? <span className="field-error">{translate(errors.assignee)}</span> : null}
              </label>
              <label className="field">
                {translate('Due date')}
                <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} />
                {submitted && errors.dueDate ? <span className="field-error">{translate(errors.dueDate)}</span> : null}
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                {translate('Priority')}
                <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                  <option value="Low">{translate('Low')}</option>
                  <option value="Medium">{translate('Medium')}</option>
                  <option value="High">{translate('High')}</option>
                  <option value="Critical">{translate('Critical')}</option>
                </select>
              </label>
              <label className="field">
                {translate('Initial status')}
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option value="TODO">{translate('TODO')}</option>
                  <option value="IN_PROGRESS">{translate('IN_PROGRESS')}</option>
                  <option value="DONE">{translate('DONE')}</option>
                </select>
              </label>
            </div>

            <button type="submit" className="primary-button block-button">
              {translate('Add task')}
            </button>
          </form>
        </motion.aside>
      </motion.section>
    </motion.div>
  );
}
