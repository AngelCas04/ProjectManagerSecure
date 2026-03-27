const SAFE_INLINE_PATTERN = /[^a-zA-Z0-9 .,;:()_@\-/#&]/g;
const SAFE_MULTILINE_PATTERN = /[^a-zA-Z0-9 .,;:()_@\-/#&\n]/g;

export function sanitizePlainText(value = '') {
  return value.replace(SAFE_INLINE_PATTERN, '');
}

export function sanitizeMultilineText(value = '') {
  return value
    .replace(SAFE_MULTILINE_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n');
}

export function normalizePlainText(value = '') {
  return sanitizePlainText(value).replace(/\s+/g, ' ').trim();
}

export function normalizeMultilineText(value = '') {
  return sanitizeMultilineText(value)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeEmail(value = '') {
  return normalizePlainText(value).replace(/\s+/g, '').toLowerCase();
}

export function validateCredentials(values) {
  const errors = {};

  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(values.email))) {
    errors.email = 'Enter a valid corporate email.';
  }

  if (!values.password || values.password.length < 12) {
    errors.password = 'Usa una contrasena de al menos 12 caracteres.';
  } else if (
    !/[A-Z]/.test(values.password) ||
    !/[a-z]/.test(values.password) ||
    !/\d/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    errors.password = 'Incluye mayuscula, minuscula, numero y simbolo.';
  }

  if (values.mode === 'register' && !normalizePlainText(values.name)) {
    errors.name = 'Escribe tu nombre para crear la cuenta.';
  }

  return errors;
}

export function validateRecoveryRequest(values) {
  const errors = {};

  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(values.email))) {
    errors.email = 'Escribe el correo con el que entras a tu cuenta.';
  }

  if (!normalizePlainText(values.recoveryPhrase) || normalizePlainText(values.recoveryPhrase).length < 6) {
    errors.recoveryPhrase = 'Ingresa tu clave de recuperacion.';
  }

  return errors;
}

export function validateResetPassword(values) {
  const errors = {};

  if (!values.password || values.password.length < 12) {
    errors.password = 'Usa una contrasena de al menos 12 caracteres.';
  } else if (
    !/[A-Z]/.test(values.password) ||
    !/[a-z]/.test(values.password) ||
    !/\d/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    errors.password = 'Incluye mayuscula, minuscula, numero y simbolo.';
  }

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Las contrasenas no coinciden.';
  }

  return errors;
}

export function validateProjectForm(values) {
  const errors = {};

  if (!normalizePlainText(values.name)) {
    errors.name = 'Project name is required.';
  }

  if (!normalizePlainText(values.lead)) {
    errors.lead = 'Project lead is required.';
  }

  if (!normalizeMultilineText(values.summary) || normalizeMultilineText(values.summary).length < 20) {
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

  if (!normalizePlainText(values.title)) {
    errors.title = 'Task title is required.';
  }

  if (!normalizePlainText(values.assignee)) {
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

  if (!normalizePlainText(values.title)) {
    errors.title = 'Event title is required.';
  }

  if (!values.date) {
    errors.date = 'Date is required.';
  }

  if (!values.time) {
    errors.time = 'Time is required.';
  }

  if (!normalizePlainText(values.owner)) {
    errors.owner = 'Choose a responsible person.';
  }

  return errors;
}

export function createSessionNotice() {
  return 'Todo sincronizado';
}

export function toInitials(value = '') {
  const words = normalizePlainText(value).split(' ').filter(Boolean).slice(0, 2);
  return words.map((word) => word[0].toUpperCase()).join('') || 'PM';
}
