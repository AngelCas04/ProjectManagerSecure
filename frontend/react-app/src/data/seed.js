export const workspaceHighlights = [
  'Security by design across every screen',
  'Cookie-first session model ready for Spring Security',
  'Kanban, chat, calendar, audit and project control in one workspace'
];

export const accessFeed = [
  {
    id: 'ACC-01',
    title: 'Failed sign-ins blocked',
    value: '14',
    note: 'Rate limiting and account lockout keep brute force noise contained.'
  },
  {
    id: 'ACC-02',
    title: 'Verified active sessions',
    value: '28',
    note: 'Only managed devices can reach restricted projects.'
  },
  {
    id: 'ACC-03',
    title: 'Audited changes today',
    value: '61',
    note: 'Timeline events are ready to flow into SIEM tooling.'
  }
];

export const securityControls = [
  {
    title: 'Session model',
    body: 'The UI is designed for HttpOnly, Secure, SameSite cookies instead of browser storage tokens.'
  },
  {
    title: 'Input hygiene',
    body: 'Forms normalize text, limit length and never render user supplied HTML.'
  },
  {
    title: 'Zero trust UX',
    body: 'Routes reflect role boundaries and sensitive actions stay explicit and auditable.'
  },
  {
    title: 'Transport assumptions',
    body: 'API calls are ready for HTTPS only backends with strict CORS and short lived JWT rotation.'
  }
];

export const pentestChecklist = [
  'JWT access token with short expiry and secure refresh flow',
  'Strict CSP, HSTS and frame protection at edge or backend layer',
  'Rate limits on auth, invitation, chat upload and search endpoints',
  'Prepared statements only and strict validation on every payload',
  'No AWS keys or database secrets embedded in desktop or web clients',
  'Signed desktop updates with checksum verification before install'
];

export const threatMatrix = [
  {
    threat: 'XSS',
    defense: 'Plain text rendering, sanitization helpers, CSP in production and no dangerous HTML injection.'
  },
  {
    threat: 'Token theft',
    defense: 'Cookie based sessions, no localStorage token cache and backend controlled rotation.'
  },
  {
    threat: 'Privilege escalation',
    defense: 'Role aware screens in the client plus final authorization at API level.'
  },
  {
    threat: 'Brute force',
    defense: 'Lockout signals, rate limiting and audit surface for suspicious sign-in attempts.'
  }
];

export const workgroupsSeed = [
  {
    id: 'group-platform-security',
    code: 'GRP-01',
    name: 'Platform Security Council',
    summary: 'Coordinates hardening decisions, release controls and access reviews across sensitive deliveries.',
    lead: 'Valeria Ruiz',
    focus: 'Security governance',
    security: 'Restricted',
    cadence: 'Twice weekly review',
    projectIds: ['atlas-cloud', 'sentinel-gateway'],
    members: [
      { id: 'member-valeria', name: 'Valeria Ruiz', role: 'Group Lead', status: 'Active' },
      { id: 'member-sofia', name: 'Sofia Campos', role: 'Backend Lead', status: 'Active' },
      { id: 'member-mario', name: 'Mario Vega', role: 'Cloud Operator', status: 'Advisory' }
    ]
  },
  {
    id: 'group-delivery-ops',
    code: 'GRP-02',
    name: 'Delivery Operations Studio',
    summary: 'Keeps roadmap execution, deadlines and launch readiness aligned for active releases.',
    lead: 'Angel Castillo',
    focus: 'Delivery planning',
    security: 'Internal',
    cadence: 'Daily standup',
    projectIds: ['nova-desktop'],
    members: [
      { id: 'member-angel', name: 'Angel Castillo', role: 'Program Manager', status: 'Active' },
      { id: 'member-diego', name: 'Diego Lara', role: 'Desktop Lead', status: 'Active' },
      { id: 'member-ana', name: 'Ana Morales', role: 'Release Analyst', status: 'Pending' }
    ]
  }
];

export const projectsSeed = [
  {
    id: 'atlas-cloud',
    code: 'PX-01',
    name: 'Atlas Cloud Migration',
    domain: 'Infrastructure',
    summary: 'Migrate restricted workloads into private AWS segments with audited release gates.',
    lead: 'Valeria Ruiz',
    risk: 'Medium',
    classification: 'Restricted',
    permissions: 'RBAC + dual approval',
    members: 12,
    dueDate: '2026-03-26'
  },
  {
    id: 'sentinel-gateway',
    code: 'PX-02',
    name: 'Sentinel API Gateway',
    domain: 'Backend',
    summary: 'Harden the edge API with policy enforcement, observability and secure service routing.',
    lead: 'Sofia Campos',
    risk: 'High',
    classification: 'Confidential',
    permissions: 'Private squad',
    members: 8,
    dueDate: '2026-03-18'
  },
  {
    id: 'nova-desktop',
    code: 'PX-03',
    name: 'Nova Desktop Client',
    domain: 'Desktop',
    summary: 'Ship a signed desktop client with secure auto update and zero embedded secrets.',
    lead: 'Diego Lara',
    risk: 'Low',
    classification: 'Internal',
    permissions: 'Team restricted',
    members: 6,
    dueDate: '2026-03-29'
  }
];

export const tasksSeed = [
  {
    id: 'TSK-101',
    projectId: 'atlas-cloud',
    title: 'Define emergency access flow',
    description: 'Document temporary elevated access with approval expiration windows.',
    priority: 'Critical',
    status: 'TODO',
    dueDate: '2026-03-16',
    assignee: 'Mario Vega'
  },
  {
    id: 'TSK-102',
    projectId: 'atlas-cloud',
    title: 'Map VPC trust boundaries',
    description: 'Review private subnets, service tiers and backend to RDS connectivity rules.',
    priority: 'High',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-14',
    assignee: 'Valeria Ruiz'
  },
  {
    id: 'TSK-103',
    projectId: 'atlas-cloud',
    title: 'Finalize migration checklist',
    description: 'Release checklist updated for backup restore and rollback validation.',
    priority: 'Medium',
    status: 'DONE',
    dueDate: '2026-03-12',
    assignee: 'Platform Squad'
  },
  {
    id: 'TSK-131',
    projectId: 'sentinel-gateway',
    title: 'Expose audit events per project',
    description: 'Surface permission changes and critical actions for operator review.',
    priority: 'High',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-15',
    assignee: 'Sofia Campos'
  },
  {
    id: 'TSK-132',
    projectId: 'sentinel-gateway',
    title: 'Review CSP propagation',
    description: 'Align SPA shell with reverse proxy security headers for production.',
    priority: 'Medium',
    status: 'TODO',
    dueDate: '2026-03-18',
    assignee: 'Valeria Ruiz'
  },
  {
    id: 'TSK-133',
    projectId: 'sentinel-gateway',
    title: 'Stabilize edge policies',
    description: 'Rate limit and auth policy rules validated under stress test scenarios.',
    priority: 'High',
    status: 'DONE',
    dueDate: '2026-03-11',
    assignee: 'Platform Squad'
  },
  {
    id: 'TSK-151',
    projectId: 'nova-desktop',
    title: 'Update release signing pipeline',
    description: 'Desktop packages must verify publisher signature and checksum before install.',
    priority: 'Critical',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-17',
    assignee: 'Diego Lara'
  },
  {
    id: 'TSK-152',
    projectId: 'nova-desktop',
    title: 'Harden update manifest',
    description: 'Ensure update metadata can be verified independently of transport.',
    priority: 'High',
    status: 'TODO',
    dueDate: '2026-03-20',
    assignee: 'Diego Lara'
  }
];

export const eventsSeed = [
  {
    id: 'EV-01',
    projectId: 'atlas-cloud',
    date: '2026-03-14',
    time: '09:00',
    title: 'Security standup',
    type: 'Meeting',
    owner: 'Valeria Ruiz'
  },
  {
    id: 'EV-02',
    projectId: 'sentinel-gateway',
    date: '2026-03-14',
    time: '11:30',
    title: 'Sprint 24 delivery',
    type: 'Deadline',
    owner: 'Sofia Campos'
  },
  {
    id: 'EV-03',
    projectId: 'nova-desktop',
    date: '2026-03-15',
    time: '15:00',
    title: 'Desktop update review',
    type: 'Review',
    owner: 'Diego Lara'
  }
];

export const messagesSeed = [
  {
    id: 'MSG-01',
    projectId: 'sentinel-gateway',
    author: 'Sofia Campos',
    role: 'Backend Lead',
    time: '10:18',
    text: 'Scopes for restricted projects are live and ready for frontend mapping.'
  },
  {
    id: 'MSG-02',
    projectId: 'sentinel-gateway',
    author: 'Valeria Ruiz',
    role: 'Security Owner',
    time: '10:24',
    text: 'Great. Keep attachments disabled until content scanning is enforced server side.'
  },
  {
    id: 'MSG-03',
    projectId: 'nova-desktop',
    author: 'Diego Lara',
    role: 'Desktop Engineer',
    time: '10:31',
    text: 'Release signatures are aligned with the update manifest now.'
  }
];

export const timelineSeed = [
  {
    id: 'TL-01',
    projectId: 'sentinel-gateway',
    date: '2026-03-12',
    scope: 'Security',
    actor: 'Valeria Ruiz',
    description: 'Consolidated secure session assumptions for the workspace shell.'
  },
  {
    id: 'TL-02',
    projectId: 'sentinel-gateway',
    date: '2026-03-10',
    scope: 'Audit',
    actor: 'Sofia Campos',
    description: 'Enabled task state change events for project level timelines.'
  },
  {
    id: 'TL-03',
    projectId: 'atlas-cloud',
    date: '2026-03-08',
    scope: 'Delivery',
    actor: 'Mario Vega',
    description: 'Updated Kanban model with priority, due date and assignment metadata.'
  }
];
