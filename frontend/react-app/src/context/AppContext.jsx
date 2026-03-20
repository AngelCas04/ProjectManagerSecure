import { createContext, startTransition, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  pentestChecklist as defaultPentestChecklist,
  securityControls as defaultSecurityControls,
  workspaceHighlights as defaultWorkspaceHighlights,
  threatMatrix as defaultThreatMatrix
} from '../data/seed';
import { api } from '../services/api';

const AppContext = createContext(null);

const initialState = {
  isLoading: true,
  error: '',
  session: null,
  currentUser: null,
  projects: [],
  tasks: [],
  events: [],
  messages: [],
  workgroups: [],
  userDirectory: [],
  timeline: [],
  accessFeed: [],
  workspaceHighlights: defaultWorkspaceHighlights,
  securityControls: defaultSecurityControls,
  pentestChecklist: defaultPentestChecklist,
  threatMatrix: defaultThreatMatrix
};

function appReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_START':
      return {
        ...state,
        isLoading: true,
        error: ''
      };

    case 'HYDRATE_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: ''
      };

    case 'HYDRATE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        session: null,
        currentUser: null,
        projects: [],
        tasks: [],
        events: [],
        messages: [],
        workgroups: [],
        userDirectory: [],
        timeline: [],
        accessFeed: []
      };

    case 'SIGN_OUT':
      return {
        ...initialState,
        isLoading: false
      };

    case 'APPEND_MESSAGE': {
      const exists = state.messages.some((message) => message.id === action.payload.id);
      if (exists) {
        return state;
      }

      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    }

    case 'UPSERT_WORKGROUP': {
      const workgroups = state.workgroups.some((group) => group.id === action.payload.id)
        ? state.workgroups.map((group) => (group.id === action.payload.id ? action.payload : group))
        : [action.payload, ...state.workgroups];

      return {
        ...state,
        workgroups
      };
    }

    default:
      return state;
  }
}

function createFallbackWorkgroups(projects, currentUser, existingGroups = []) {
  if (existingGroups.length) {
    return existingGroups;
  }

  if (!projects.length) {
    if (!currentUser) {
      return [];
    }

    return [
      {
        id: `group-starter-${currentUser.id || 'local'}`,
        code: 'GRP-START',
        name: currentUser.team || `${currentUser.name} Equipo`,
        summary: 'Tu equipo ya esta listo para empezar. Vincula personas y proyectos para ordenar el trabajo desde el primer dia.',
        lead: currentUser.name || 'Responsable del equipo',
        focus: 'Inicio del equipo',
        security: 'Restricted',
        cadence: 'Semanal',
        projectIds: [],
        members: [
          {
            id: currentUser.id || 'starter-member',
            name: currentUser.name || 'Responsable del equipo',
            email: currentUser.email || '',
            role: 'Group Lead',
            status: 'Activo',
            team: currentUser.team || ''
          }
        ]
      }
    ];
  }

  return projects.slice(0, 3).map((project, index) => ({
    id: `group-${project.id}`,
    code: `GRP-${String(index + 1).padStart(2, '0')}`,
    name: `${project.domain} Team`,
    summary: `Coordina responsables, ritmo de trabajo y seguimiento para ${project.name}.`,
    lead: project.lead,
    focus: project.domain,
    security: project.classification || 'Restricted',
    cadence: index === 0 ? 'Dos veces por semana' : 'Semanal',
    projectIds: [project.id],
    members: [
      {
        id: `lead-${project.id}`,
        name: project.lead,
        email: '',
        role: 'Group Lead',
        status: 'Activo',
        team: project.domain
      },
      {
        id: `owner-${project.id}`,
        name: currentUser?.name || 'Responsable del equipo',
        email: currentUser?.email || '',
        role: 'Coordinator',
        status: 'Activo',
        team: currentUser?.team || ''
      }
    ]
  }));
}

function normalizeMembershipRole(value = '') {
  switch (value) {
    case 'LEAD':
    case 'Group Lead':
      return 'Group Lead';
    case 'COORDINATOR':
    case 'Coordinator':
      return 'Coordinator';
    case 'ADMINISTRADOR':
    case 'Miembro del proyecto':
    case 'MEMBER':
    case 'Member':
      return 'Member';
    default:
      return value || 'Member';
  }
}

function normalizeMembershipStatus(value = '') {
  switch (value) {
    case 'INVITED':
    case 'Pending':
      return 'Pendiente';
    case 'REVOKED':
      return 'Retirado';
    default:
      return 'Activo';
  }
}

function normalizeDirectoryUser(entry) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id,
    name: entry.name,
    email: entry.email,
    role: entry.role,
    team: entry.team,
    initials: entry.initials
  };
}

function normalizeUserDirectory(payload) {
  const directory = payload.userDirectory || payload.directory || [];
  return directory.map(normalizeDirectoryUser).filter(Boolean);
}

function normalizeRemoteMember(member) {
  if (!member) {
    return null;
  }

  return {
    id: member.id || member.userId,
    name: member.name,
    email: member.email || '',
    role: normalizeMembershipRole(member.membershipRole || member.role),
    status: normalizeMembershipStatus(member.status),
    team: member.team || ''
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProjectIds(group, projects, members) {
  const explicitIds = asArray(group.projectIds);
  if (explicitIds.length) {
    return explicitIds;
  }

  const memberNames = new Set(members.map((member) => member.name).filter(Boolean));
  const memberTeams = new Set(members.map((member) => member.team).filter(Boolean));
  const normalizedGroupName = String(group.name || '').toLowerCase();
  const normalizedFocus = String(group.focus || '').toLowerCase();

  return projects
    .filter((project) => {
      const projectDomain = String(project.domain || '').toLowerCase();
      return (
        memberNames.has(project.lead) ||
        memberTeams.has(project.domain) ||
        normalizedGroupName.includes(projectDomain) ||
        normalizedFocus.includes(projectDomain)
      );
    })
    .map((project) => project.id);
}

function normalizeRemoteWorkgroup(group, currentUser, projects) {
  const members = asArray(group.roster).length
    ? asArray(group.roster).map(normalizeRemoteMember).filter(Boolean)
    : asArray(group.members).map(normalizeRemoteMember).filter(Boolean);
  const leadMember = members.find((member) => member.role === 'Group Lead');

  return {
    id: group.id,
    code: group.code,
    name: group.name,
    summary: group.summary || group.description || '',
    lead: group.lead || group.ownerName || leadMember?.name || currentUser?.name || 'Responsable del equipo',
    focus: group.focus || group.name || 'Coordinacion del equipo',
    security: group.visibility || group.security || 'Restricted',
    cadence: group.cadence || 'Semanal',
    projectIds: normalizeProjectIds(group, projects, members),
    members
  };
}

function normalizeWorkgroups(payload, fallbackGroups) {
  const remoteGroups = payload.workgroups || payload.workGroups || payload.groups || [];

  if (remoteGroups.length) {
    return remoteGroups.map((group) => normalizeRemoteWorkgroup(group, payload.currentUser, payload.projects || []));
  }

  return createFallbackWorkgroups(payload.projects || [], payload.currentUser, fallbackGroups);
}

function normalizeBootstrap(payload, fallbackGroups = []) {
  return {
    session: payload.session,
    currentUser: payload.currentUser,
    projects: payload.projects || [],
    tasks: payload.tasks || [],
    events: payload.events || [],
    messages: payload.messages || [],
    workgroups: normalizeWorkgroups(payload, fallbackGroups),
    userDirectory: normalizeUserDirectory(payload),
    timeline: payload.timeline || [],
    accessFeed: payload.accessFeed || [],
    workspaceHighlights: payload.workspaceHighlights?.length ? payload.workspaceHighlights : defaultWorkspaceHighlights,
    securityControls: payload.securityControls?.length ? payload.securityControls : defaultSecurityControls,
    pentestChecklist: payload.pentestChecklist?.length ? payload.pentestChecklist : defaultPentestChecklist,
    threatMatrix: payload.threatMatrix?.length ? payload.threatMatrix : defaultThreatMatrix
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const wsRef = useRef(null);
  const wsProjectIdRef = useRef('');
  const workgroupsRef = useRef([]);

  useEffect(() => {
    workgroupsRef.current = state.workgroups;
  }, [state.workgroups]);

  async function hydrateWorkspace({ showLoader = false } = {}) {
    if (showLoader) {
      dispatch({ type: 'HYDRATE_START' });
    }

    try {
      const [bootstrap, remoteWorkgroups, remoteDirectory] = await Promise.all([
        api.fetchBootstrap(),
        api.fetchWorkgroups(),
        api.fetchWorkgroupDirectory(),
        api.fetchCsrfToken()
      ]);
      dispatch({
        type: 'HYDRATE_SUCCESS',
        payload: normalizeBootstrap(
          {
            ...bootstrap,
            workgroups: remoteWorkgroups || bootstrap.workgroups || bootstrap.workGroups || bootstrap.groups,
            userDirectory: remoteDirectory || bootstrap.userDirectory || bootstrap.directory
          },
          workgroupsRef.current
        )
      });
    } catch (error) {
      if (error.status === 401) {
        closeChatSocket();
        dispatch({ type: 'SIGN_OUT' });
        return;
      }

      dispatch({
        type: 'HYDRATE_ERROR',
        payload: error.message || 'No se pudo sincronizar el espacio.'
      });
    }
  }

  function closeChatSocket() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      wsProjectIdRef.current = '';
    }
  }

  function joinChatRoom(projectId) {
    if (!state.session || !projectId || wsProjectIdRef.current === projectId) {
      return;
    }

    closeChatSocket();

    const socket = new WebSocket(api.websocketUrl(projectId));
    wsRef.current = socket;
    wsProjectIdRef.current = projectId;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        dispatch({ type: 'APPEND_MESSAGE', payload: message });
      } catch {
        // Ignore malformed frames and keep the socket alive.
      }
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
        wsProjectIdRef.current = '';
      }
    };
  }

  useEffect(() => {
    startTransition(() => {
      void hydrateWorkspace({ showLoader: true });
    });

    return () => {
      closeChatSocket();
    };
  }, []);

  const value = useMemo(() => {
    async function signIn(payload) {
      await api.signIn(payload);
      await hydrateWorkspace({ showLoader: true });
    }

    async function registerAccount(payload) {
      await api.signUp(payload);
      await hydrateWorkspace({ showLoader: true });
    }

    async function signOut() {
      try {
        await api.signOut();
      } finally {
        closeChatSocket();
        dispatch({ type: 'SIGN_OUT' });
      }
    }

    async function createProject(payload) {
      const project = await api.createProject(payload);
      await hydrateWorkspace();
      return project.id;
    }

    async function createTask(payload) {
      await api.createTask(payload);
      await hydrateWorkspace();
    }

    async function moveTask(taskId, nextStatus) {
      await api.updateTaskStatus(taskId, nextStatus);
      await hydrateWorkspace();
    }

    async function createEvent(payload) {
      await api.createEvent(payload);
      await hydrateWorkspace();
    }

    async function sendMessage(payload) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsProjectIdRef.current === payload.projectId) {
        wsRef.current.send(JSON.stringify(payload));
      } else {
        const message = await api.postMessage(payload);
        dispatch({ type: 'APPEND_MESSAGE', payload: message });
      }

      startTransition(() => {
        void hydrateWorkspace();
      });
    }

    async function updateProfile(payload) {
      await api.updateProfile(payload);
      await hydrateWorkspace();
    }

    async function createWorkgroup(payload) {
      const remoteGroup = await api.createWorkgroup(payload);

      if (remoteGroup) {
        await hydrateWorkspace();
        return remoteGroup.id;
      }

      const localGroup = {
        id: payload.id || `group-local-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        summary: payload.summary,
        lead: payload.lead || state.currentUser?.name || 'Responsable del equipo',
        focus: payload.focus,
        security: payload.security,
        cadence: payload.cadence,
        projectIds: payload.projectIds || [],
        members: payload.members || []
      };

      dispatch({ type: 'UPSERT_WORKGROUP', payload: localGroup });
      return localGroup.id;
    }

    async function updateWorkgroup(workgroupId, payload) {
      const remoteGroup = await api.updateWorkgroup(workgroupId, payload);

      if (remoteGroup) {
        await hydrateWorkspace();
        return;
      }

      const currentGroup = state.workgroups.find((group) => group.id === workgroupId);

      if (!currentGroup) {
        return;
      }

      dispatch({
        type: 'UPSERT_WORKGROUP',
        payload: {
          ...currentGroup,
          ...payload,
          summary: payload.summary || currentGroup.summary
        }
      });
    }

    async function addWorkgroupMember(workgroupId, payload) {
      const remoteGroup = await api.addWorkgroupMember(workgroupId, payload);

      if (remoteGroup) {
        await hydrateWorkspace();
        return;
      }

      const currentGroup = state.workgroups.find((group) => group.id === workgroupId);

      if (!currentGroup) {
        return;
      }

      dispatch({
        type: 'UPSERT_WORKGROUP',
        payload: {
          ...currentGroup,
          members: [
            ...currentGroup.members,
            {
              id: payload.userId || `member-local-${Date.now()}`,
              name: state.userDirectory.find((entry) => entry.id === payload.userId)?.name || payload.name || 'Integrante del equipo',
              email: state.userDirectory.find((entry) => entry.id === payload.userId)?.email || '',
              role: payload.role,
              status: payload.status || 'Activo',
              team: state.userDirectory.find((entry) => entry.id === payload.userId)?.team || ''
            }
          ]
        }
      });
    }

    async function removeWorkgroupMember(workgroupId, userId) {
      const remoteGroup = await api.removeWorkgroupMember(workgroupId, userId);

      if (remoteGroup) {
        await hydrateWorkspace();
        return;
      }

      const currentGroup = state.workgroups.find((group) => group.id === workgroupId);

      if (!currentGroup) {
        return;
      }

      dispatch({
        type: 'UPSERT_WORKGROUP',
        payload: {
          ...currentGroup,
          members: currentGroup.members.filter((member) => member.id !== userId)
        }
      });
    }

    return {
      ...state,
      signIn,
      registerAccount,
      signOut,
      createProject,
      createTask,
      moveTask,
      createEvent,
      sendMessage,
      updateProfile,
      createWorkgroup,
      updateWorkgroup,
      addWorkgroupMember,
      removeWorkgroupMember,
      joinChatRoom,
      refreshWorkspace: hydrateWorkspace
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider.');
  }

  return context;
}
