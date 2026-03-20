import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function isCurrentUserInGroup(group, currentUser) {
  if (!group || !currentUser) {
    return false;
  }

  return (group.members || []).some((member) =>
    member.id === currentUser.id ||
    (member.email && member.email === currentUser.email) ||
    member.name === currentUser.name
  ) || group.name === currentUser.team;
}

export default function ChatPage() {
  const { currentUser, joinChatRoom, messages, projects, refreshWorkspace, sendMessage, workgroups } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState('');

  const messageMeta = useMemo(() => {
    const lastByProject = new Map();
    const countByProject = new Map();

    for (const message of messages) {
      lastByProject.set(message.projectId, message);
      countByProject.set(message.projectId, (countByProject.get(message.projectId) || 0) + 1);
    }

    return {
      lastByProject,
      countByProject
    };
  }, [messages]);

  const visibleGroups = useMemo(
    () => workgroups.filter((group) => isCurrentUserInGroup(group, currentUser)),
    [currentUser, workgroups]
  );

  const visibleProjectIds = useMemo(() => {
    const projectIds = visibleGroups.flatMap((group) => group.projectIds || []);
    return new Set(projectIds);
  }, [visibleGroups]);

  const projectRooms = useMemo(() => {
    const scopedProjects = visibleProjectIds.size
      ? projects.filter((project) => visibleProjectIds.has(project.id))
      : projects.filter((project) =>
          messageMeta.lastByProject.has(project.id) ||
          project.lead === currentUser?.name
        );

    return scopedProjects.map((project) => ({
      ...project,
      preview: messageMeta.lastByProject.get(project.id)
    }));
  }, [currentUser?.name, messageMeta.lastByProject, projects, visibleProjectIds]);

  const activeProjectId = useMemo(() => {
    const requestedProjectId = searchParams.get('project');
    if (requestedProjectId && projectRooms.some((project) => project.id === requestedProjectId)) {
      return requestedProjectId;
    }
    return projectRooms[0]?.id || '';
  }, [projectRooms, searchParams]);

  const activeMessages = useMemo(
    () => messages.filter((message) => message.projectId === activeProjectId),
    [activeProjectId, messages]
  );

  const activeProject = useMemo(
    () => projectRooms.find((project) => project.id === activeProjectId) || null,
    [activeProjectId, projectRooms]
  );

  const activeGroup = useMemo(
    () => visibleGroups.find((group) => (group.projectIds || []).includes(activeProjectId)) || visibleGroups[0] || null,
    [activeProjectId, visibleGroups]
  );

  useEffect(() => {
    if (!searchParams.get('project') && projectRooms[0]?.id) {
      setSearchParams({ project: projectRooms[0].id });
    }
  }, [projectRooms, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeProjectId) {
      joinChatRoom(activeProjectId);
    }
  }, [activeProjectId, joinChatRoom]);

  useEffect(() => {
    if (!activeProjectId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshWorkspace();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeProjectId, refreshWorkspace]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim() || !activeProjectId) {
      return;
    }

    await sendMessage({ projectId: activeProjectId, text: draft });
    setDraft('');
  }

  return (
    <div className="page-stack">
      <section className="page-panel chat-banner">
        <div>
          <p className="eyebrow">Mensajes</p>
          <h2>Conversaciones del equipo con contexto real de proyecto</h2>
          <p className="body-copy">
            Encuentra las salas de tu equipo, sigue la conversacion correcta y responde sin perder el hilo del trabajo.
          </p>
        </div>
        <div className="signal-row">
          <span className="tag subtle-tag">{projectRooms.length} salas</span>
          <span className="tag subtle-tag">{messageMeta.countByProject.get(activeProjectId) || 0} mensajes</span>
          <span className="tag subtle-tag">{activeGroup?.name || currentUser?.team || 'Equipo'}</span>
        </div>
      </section>

      <div className="chat-layout">
        <aside className="page-panel chat-sidebar">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Salas</p>
              <h2>Tu equipo</h2>
            </div>
          </div>

          <div className="card-list compact-card-list">
            {projectRooms.length ? (
              projectRooms.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={project.id === activeProjectId ? 'room-card active' : 'room-card'}
                  onClick={() => setSearchParams({ project: project.id })}
                >
                  <div className="detail-card-top">
                    <span className="tag">{project.code}</span>
                    <span>{project.risk}</span>
                  </div>
                  <h3>{project.name}</h3>
                  <p className="body-copy">{project.preview?.text || 'Sin mensajes todavia.'}</p>
                </button>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Aun no hay salas disponibles para esta cuenta.</p>
              </div>
            )}
          </div>

          {activeGroup ? (
            <div className="chat-member-list">
              <p className="eyebrow">Participan aqui</p>
              <div className="signal-row">
                {(activeGroup.members || []).map((member) => (
                  <span key={member.id} className="tag subtle-tag">
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="page-panel chat-main">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{activeGroup?.name || 'Sala activa'}</p>
              <h2>{activeProject?.name || 'Selecciona una sala'}</h2>
            </div>
          </div>

          <div className="message-list">
            {activeMessages.length ? (
              activeMessages.map((message) => (
                <article
                  key={message.id}
                  className={message.author === currentUser?.name ? 'message-card own-message' : 'message-card'}
                >
                  <div className="detail-card-top">
                    <span className="tag">{message.author}</span>
                    <span>{message.time}</span>
                  </div>
                  <p className="body-copy">{message.text}</p>
                  <small>{message.role}</small>
                </article>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Todavia no hay mensajes en esta sala. Empieza la conversacion cuando quieras.</p>
              </div>
            )}
          </div>

          <form className="composer-form" onSubmit={handleSubmit}>
            <label className="field">
              Nuevo mensaje
              <textarea
                rows="4"
                maxLength="400"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escribe algo breve para tu equipo."
              />
            </label>
            <button type="submit" className="primary-button">
              Enviar mensaje
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
