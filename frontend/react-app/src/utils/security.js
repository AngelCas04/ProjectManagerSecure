const SAFE_INLINE_PATTERN = /[^a-zA-Z0-9 .,;:()_@\-/#&]/g;
const SAFE_MULTILINE_PATTERN = /[^a-zA-Z0-9 .,;:()_@\-/#&\n]/g;

export function sanitizePlainText(value = '') {
  return value.replace(SAFE_INLINE_PATTERN, '').replace(/\s+/g, ' ').trim();
}

export function sanitizeMultilineText(value = '') {
  return value
    .replace(SAFE_MULTILINE_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeEmail(value = '') {
  return sanitizePlainText(value).replace(/\s+/g, '').toLowerCase();
}

export function validateCredentials(values) {
  const errors = {};

  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(values.email))) {
    errors.email = 'Enter a valid corporate email.';
  }

  if (!values.password || values.password.length < 12) {
    errors.password = 'Usa una contrasena de al menos 12 caracteres.';
  }

  if (values.mode === 'register' && !sanitizePlainText(values.name)) {
    errors.name = 'Escribe tu nombre para crear la cuenta.';
  }

  return errors;
}

export function validateProjectForm(values) {
  const errors = {};

  if (!sanitizePlainText(values.name)) {
    errors.name = 'Project name is required.';
  }

  if (!sanitizePlainText(values.lead)) {
    errors.lead = 'Project lead is required.';
  }

  if (!sanitizeMultilineText(values.summary) || sanitizeMultilineText(values.summary).length < 20) {
    errors.summary = 'Add a concise summary with at least 20 characters.';
  }

  if (!values.dueDate) {
    errors.dueDate = 'Choose a target date.';
  }

  return errors;
}

export function validateTaskForm(values) {
  const errors = {};

  if (!values.projectId) {
    errors.projectId = 'Select a project.';
  }

  if (!sanitizePlainText(values.title)) {
    errors.title = 'Task title is required.';
  }

  if (!sanitizePlainText(values.assignee)) {
    errors.assignee = 'Assignee is required.';
  }

  if (!values.dueDate) {
    errors.dueDate = 'Choose a due date.';
  }

  return errors;
}

export function validateEventForm(values) {
  const errors = {};

  if (!values.projectId) {
    errors.projectId = 'Select a project.';
  }

  if (!sanitizePlainText(values.title)) {
    errors.title = 'Event title is required.';
  }

  if (!values.date) {
    errors.date = 'Date is required.';
  }

  if (!values.time) {
    errors.time = 'Time is required.';
  }

  return errors;
}

export function createSessionNotice() {
  return 'Todo sincronizado';
}

export function toInitials(value = '') {
  const words = sanitizePlainText(value).split(' ').filter(Boolean).slice(0, 2);
  return words.map((word) => word[0].toUpperCase()).join('') || 'PM';
}
