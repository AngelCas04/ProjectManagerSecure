import { useI18n } from '../../context/I18nContext';
import { toInitials } from '../../utils/security';

function toneForPriority(priority) {
  switch (priority) {
    case 'Critical':
      return 'critical';
    case 'High':
      return 'high';
    case 'Low':
      return 'low';
    default:
      return 'medium';
  }
}

function memberAvatar(teamMembers, assignee) {
  const matched = teamMembers.find((member) => member.name === assignee);
  if (matched?.avatarUrl) {
    return <img src={matched.avatarUrl} alt={`Foto de ${assignee}`} />;
  }

  return toInitials(assignee || 'PM');
}

export function BoardColumn({ status, tasks, projectLookup, teamMembers = [], onDropTask, onDragTask, onMoveTask }) {
  const { translate } = useI18n();

  return (
    <section
      className={`board-column board-${status.toLowerCase()}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropTask(status)}
    >
      <div className="board-column-head">
        <div>
          <p className="eyebrow">{translate(status)}</p>
          <h3>{tasks.length} {translate('Tasks').toLowerCase()}</h3>
        </div>
      </div>

      <div className="board-column-list">
        {tasks.map((task) => (
          <article
            key={task.id}
            className="task-card"
            draggable
            onDragStart={() => onDragTask(task.id)}
          >
            <div className="task-card-top">
              <span className="tag">{projectLookup[task.projectId]?.code || 'PX'}</span>
              <span className={`task-priority priority-${toneForPriority(task.priority)}`}>{translate(task.priority)}</span>
            </div>
            <h4>{task.title}</h4>
            <p className="body-copy">{task.description}</p>
            <div className="task-card-meta">
              <span className="task-assignee-chip">
                <span className="task-assignee-avatar">{memberAvatar(teamMembers, task.assignee)}</span>
                {task.assignee}
              </span>
              <span>{task.dueDate}</span>
            </div>
            <label className="field compact-field">
              {translate('Move to')}
              <select value={task.status} onChange={(event) => onMoveTask(task.id, event.target.value)}>
                <option value="TODO">{translate('TODO')}</option>
                <option value="IN_PROGRESS">{translate('IN_PROGRESS')}</option>
                <option value="DONE">{translate('DONE')}</option>
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
