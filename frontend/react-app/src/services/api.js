const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
const API_ROOT = API_BASE_URL.replace(/\/api$/, '');
const WS_ROOT = (import.meta.env.VITE_WS_URL || '').replace(/\/+$/, '');
let csrfToken = '';

async function refreshCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/security/csrf`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar la sesion segura.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  csrfToken = typeof payload === 'string' ? payload : '';
  return csrfToken;
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (!options.skipCsrf && method !== 'GET') {
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (response.status === 403 && !options.skipCsrf && method !== 'GET' && !options._csrfRetried) {
    await refreshCsrfToken();
    return request(path, {
      ...options,
      _csrfRetried: true
    });
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'No se pudo completar la solicitud segura.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function optionalRequest(path, options = {}) {
  try {
    return await request(path, options);
  } catch (error) {
    if ([404, 405, 501].includes(error.status)) {
      return null;
    }

    throw error;
  }
}

function websocketUrl(projectId, roomId = '') {
  if (!WS_ROOT) {
    return '';
  }

  const wsRoot = WS_ROOT.replace(/\/+$/, '');
  const params = new URLSearchParams({ projectId });
  if (roomId) {
    params.set('roomId', roomId);
  }
  return `${wsRoot}/ws/chat?${params.toString()}`;
}

export const api = {
  fetchBootstrap() {
    return request('/bootstrap');
  },
  fetchCsrfToken() {
    return refreshCsrfToken().then((token) => {
      csrfToken = token;
      return token;
    });
  },
  signIn(payload) {
    return request('/auth/login', {
      method: 'POST',
      skipCsrf: true,
      body: JSON.stringify({
        email: payload.email,
        password: payload.password
      })
    });
  },
  signUp(payload) {
    return request('/auth/register', {
      method: 'POST',
      skipCsrf: true,
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        team: payload.team,
        accountType: payload.accountType,
        inviteToken: payload.inviteToken
      })
    });
  },
  requestPasswordRecovery(payload) {
    return request('/auth/password-recovery/request', {
      method: 'POST',
      skipCsrf: true,
      body: JSON.stringify({
        email: payload.email,
        recoveryPhrase: payload.recoveryPhrase
      })
    });
  },
  validatePasswordResetToken(token) {
    return request(`/auth/password-recovery/validate?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      skipCsrf: true
    });
  },
  resetPassword(payload) {
    return request('/auth/password-recovery/reset', {
      method: 'POST',
      skipCsrf: true,
      body: JSON.stringify({
        token: payload.token,
        password: payload.password
      })
    });
  },
  refreshSession() {
    return request('/auth/refresh', {
      method: 'POST',
      skipCsrf: true
    });
  },
  signOut() {
    return request('/auth/logout', {
      method: 'POST'
    });
  },
  createProject(payload) {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  createTask(payload) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateTaskStatus(taskId, status) {
    return request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  createEvent(payload) {
    return request('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateProfile(payload) {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        avatarUrl: payload.avatarUrl || null
      })
    });
  },
  fetchManagedTeam() {
    return request('/workgroups/managed');
  },
  setupManagedTeam(payload) {
    return request('/workgroups/managed/setup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  inviteManagedTeamMembers(payload) {
    return request('/workgroups/managed/invitations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  revokeManagedTeamInvitation(invitationId) {
    return request(`/workgroups/managed/invitations/${invitationId}`, {
      method: 'DELETE'
    });
  },
  previewTeamInvitation(token) {
    return request(`/workgroups/invitations/preview?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      skipCsrf: true
    });
  },
  acceptTeamInvitation(payload) {
    return request('/workgroups/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  postMessage(payload) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  fetchChatRooms() {
    return request('/messages/rooms', {
      method: 'GET'
    });
  },
  createChatRoom(payload) {
    return request('/messages/rooms', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  fetchWorkgroups() {
    return optionalRequest('/workgroups');
  },
  fetchWorkgroupDirectory() {
    return optionalRequest('/workgroups/directory');
  },
  createWorkgroup(payload) {
    return optionalRequest('/workgroups', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        description: payload.summary,
        focus: payload.focus,
        visibility: payload.security,
        cadence: payload.cadence,
        projectIds: payload.projectIds || []
      })
    });
  },
  updateWorkgroup(workgroupId, payload) {
    return optionalRequest(`/workgroups/${workgroupId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name,
        description: payload.summary,
        focus: payload.focus,
        visibility: payload.security,
        cadence: payload.cadence,
        projectIds: payload.projectIds || []
      })
    });
  },
  addWorkgroupMember(workgroupId, payload) {
    return optionalRequest(`/workgroups/${workgroupId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId: payload.userId,
        role: payload.role === 'Group Lead' ? 'LEAD' : 'MEMBER'
      })
    });
  },
  removeWorkgroupMember(workgroupId, userId) {
    return optionalRequest(`/workgroups/${workgroupId}/members/${userId}`, {
      method: 'DELETE'
    });
  },
  websocketUrl
};
