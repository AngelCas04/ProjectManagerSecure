export const currentUser = {
  name: 'Valeria Ruiz',
  role: 'Administrador',
  team: 'Platform Security',
  email: 'valeria.ruiz@acme.dev',
  initials: 'VR'
};

export const securitySignals = [
  {
    title: 'Cookie session only',
    description: 'La UI asume autenticacion via cookies HttpOnly, Secure y SameSite=Strict.'
  },
  {
    title: 'Zero Trust UX',
    description: 'Las vistas separan permisos por rol y muestran eventos auditables.'
  },
  {
    title: 'Input hygiene',
    description: 'Los formularios normalizan contenido y evitan renderizado HTML inseguro.'
  }
];

export const portfolioStats = [
  { label: 'Proyectos activos', value: '12', detail: '+2 este mes' },
  { label: 'Tareas criticas', value: '18', detail: '6 requieren validacion' },
  { label: 'Eventos hoy', value: '7', detail: '2 reuniones de sprint' },
  { label: 'Alertas de acceso', value: '03', detail: 'Bloqueos por intentos fallidos' }
];

export const projects = [
  {
    id: 'PX-01',
    name: 'Atlas Cloud Migration',
    type: 'Infraestructura',
    members: 12,
    risk: 'Medio',
    progress: 72,
    permissions: 'RBAC + aprobacion dual'
  },
  {
    id: 'PX-02',
    name: 'Sentinel API Gateway',
    type: 'Backend',
    members: 8,
    risk: 'Alto',
    progress: 48,
    permissions: 'Privado'
  },
  {
    id: 'PX-03',
    name: 'Nova Desktop Client',
    type: 'Desktop',
    members: 6,
    risk: 'Bajo',
    progress: 85,
    permissions: 'Equipo restringido'
  }
];

export const boardColumns = [
  {
    status: 'TODO',
    accent: 'todo',
    tasks: [
      {
        id: 'TSK-140',
        title: 'Diseñar flujo de aprobacion de accesos',
        description: 'Definir reglas de acceso temporal para proveedores externos.',
        priority: 'Alta',
        dueDate: '16 Mar',
        assignee: 'Mario'
      },
      {
        id: 'TSK-148',
        title: 'Revisar checklist de CSP',
        description: 'Alinear politicas del frontend con cabeceras del reverse proxy.',
        priority: 'Media',
        dueDate: '18 Mar',
        assignee: 'Valeria'
      }
    ]
  },
  {
    status: 'IN_PROGRESS',
    accent: 'progress',
    tasks: [
      {
        id: 'TSK-131',
        title: 'Tablero de auditoria por proyecto',
        description: 'Exponer eventos relevantes de permisos y cambios de estado.',
        priority: 'Alta',
        dueDate: '14 Mar',
        assignee: 'Sofia'
      },
      {
        id: 'TSK-136',
        title: 'Vista segura de chat',
        description: 'Bloquear adjuntos no permitidos y reforzar previsualizacion.',
        priority: 'Alta',
        dueDate: '15 Mar',
        assignee: 'Diego'
      }
    ]
  },
  {
    status: 'DONE',
    accent: 'done',
    tasks: [
      {
        id: 'TSK-118',
        title: 'Sesion via cookies seguras',
        description: 'Se removio cualquier dependencia de localStorage para tokens.',
        priority: 'Critica',
        dueDate: '12 Mar',
        assignee: 'Platform'
      },
      {
        id: 'TSK-120',
        title: 'Validaciones client-side',
        description: 'Se agregaron reglas para longitud, caracteres y entradas vacias.',
        priority: 'Media',
        dueDate: '11 Mar',
        assignee: 'QA'
      }
    ]
  }
];

export const calendarEvents = [
  { time: '09:00', title: 'Standup de seguridad', type: 'Reunion', project: 'Atlas Cloud Migration' },
  { time: '11:30', title: 'Entrega de Sprint 24', type: 'Deadline', project: 'Sentinel API Gateway' },
  { time: '15:00', title: 'Pentest readiness review', type: 'Evento', project: 'Nova Desktop Client' }
];

export const chatMessages = [
  {
    id: 1,
    author: 'Sofia',
    role: 'Backend Lead',
    time: '10:18',
    text: 'La nueva capa de permisos ya expone scopes para proyectos sensibles.'
  },
  {
    id: 2,
    author: 'Valeria',
    role: 'Security Owner',
    time: '10:24',
    text: 'Perfecto. Mantengamos el chat sin HTML enriquecido y con auditoria de eventos.'
  },
  {
    id: 3,
    author: 'Diego',
    role: 'Desktop Engineer',
    time: '10:31',
    text: 'La firma de actualizaciones quedo alineada con el pipeline de release.'
  }
];

export const versionTimeline = [
  { date: '12 Mar 2026', author: 'Valeria Ruiz', description: 'Se consolidan reglas de sesion segura y vistas protegidas por rol.' },
  { date: '10 Mar 2026', author: 'Sofia Campos', description: 'Se habilita auditoria de cambios de tareas y eventos de proyecto.' },
  { date: '08 Mar 2026', author: 'Mario Vega', description: 'Se actualiza el tablero Kanban con prioridad, vencimientos y permisos.' }
];

export const teamMembers = [
  { name: 'Valeria Ruiz', role: 'Administrador', status: 'En linea', scope: 'Todos los proyectos' },
  { name: 'Sofia Campos', role: 'Backend Lead', status: 'En reunion', scope: 'Sentinel API Gateway' },
  { name: 'Diego Lara', role: 'Desktop Engineer', status: 'Disponible', scope: 'Nova Desktop Client' },
  { name: 'Mario Vega', role: 'DevSecOps', status: 'Auditando', scope: 'Atlas Cloud Migration' }
];

export const accessEvents = [
  { title: 'Intentos fallidos bloqueados', value: '14', note: 'Protegidos por rate limiting y lockout.' },
  { title: 'Sesiones activas verificadas', value: '28', note: 'Solo desde dispositivos registrados.' },
  { title: 'Cambios auditados hoy', value: '61', note: 'Eventos listos para SIEM.' }
];
