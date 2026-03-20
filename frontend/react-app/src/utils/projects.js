export const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'DONE'];

export function buildProjectCode(name, index) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  return `${initials || 'PX'}-${String(index).padStart(2, '0')}`;
}

export function calculateProjectProgress(tasks, projectId) {
  const projectTasks = tasks.filter((task) => task.projectId === projectId);

  if (projectTasks.length === 0) {
    return 0;
  }

  const completedTasks = projectTasks.filter((task) => task.status === 'DONE').length;
  return Math.round((completedTasks / projectTasks.length) * 100);
}

export function groupTasksByStatus(tasks) {
  return STATUS_ORDER.reduce(
    (groups, status) => ({
      ...groups,
      [status]: tasks.filter((task) => task.status === status)
    }),
    {}
  );
}
