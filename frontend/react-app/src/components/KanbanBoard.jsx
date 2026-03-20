export function KanbanBoard({ columns }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tareas</p>
          <h3>Tablero Kanban</h3>
        </div>
        <span className="subtle-copy">Prioridades, fechas limite y responsables visibles por columna.</span>
      </div>

      <div className="kanban-grid">
        {columns.map((column) => (
          <article key={column.status} className={`kanban-column ${column.accent}`}>
            <div className="kanban-head">
              <h4>{column.status}</h4>
              <span>{column.tasks.length}</span>
            </div>
            <div className="kanban-list">
              {column.tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-meta">
                    <span className="badge">{task.id}</span>
                    <span>{task.priority}</span>
                  </div>
                  <h5>{task.title}</h5>
                  <p>{task.description}</p>
                  <div className="task-footer">
                    <span>{task.assignee}</span>
                    <span>{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
