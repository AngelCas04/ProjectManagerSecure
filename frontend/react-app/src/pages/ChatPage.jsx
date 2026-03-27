import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { sanitizeMultilineText, sanitizePlainText } from '../utils/security';

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

const initialRoomForm = {
  projectId: '',
  name: '',
  description: ''
};

export default function ChatPage() {
  const {
    chatRooms,
    createChatRoom,
    currentUser,
    joinChatRoom,
    messages,
    projects,
    refreshWorkspace,
    sendMessage,
    workgroups
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [roomNotice, setRoomNotice] = useState('');
  const [roomError, setRoomError] = useState('');

  const visibleGroups = useMemo(
    () => workgroups.filter((group) => isCurrentUserInGroup(group, currentUser)),
    [currentUser, workgroups]
  );

  const projectLookup = useMemo(
    () => projects.reduce((lookup, project) => ({ ...lookup, [project.id]: project }), {}),
    [projects]
  );

  const visibleRooms = useMemo(() => {
    if (!visibleGroups.length) {
      return chatRooms;
    }

    const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
    return chatRooms.filter((room) => visibleGroupIds.has(room.workGroupId));
  }, [chatRooms, visibleGroups]);

  const messageMeta = useMemo(() => {
    const lastByRoom = new Map();
    const countByRoom = new Map();

    for (const message of messages) {
      const key = message.roomId || message.projectId;
      lastByRoom.set(key, message);
      countByRoom.set(key, (countByRoom.get(key) || 0) + 1);
    }

    return { lastByRoom, countByRoom };
  }, [messages]);

  const activeRoomId = useMemo(() => {
    const requestedRoomId = searchParams.get('room');
    if (requestedRoomId && visibleRooms.some((room) => room.id === requestedRoomId)) {
      return requestedRoomId;
    }
    return visibleRooms[0]?.id || '';
  }, [searchParams, visibleRooms]);

  const activeRoom = useMemo(
    () => visibleRooms.find((room) => room.id === activeRoomId) || null,
    [activeRoomId, visibleRooms]
  );

  const activeMessages = useMemo(
    () => messages.filter((message) => (message.roomId || message.projectId) === activeRoomId),
    [activeRoomId, messages]
  );

  const activeProject = useMemo(
    () => (activeRoom?.projectId ? projectLookup[activeRoom.projectId] || null : null),
    [activeRoom?.projectId, projectLookup]
  );

  const activeGroup = useMemo(() => {
    if (!activeRoom) {
      return visibleGroups[0] || null;
    }
    return visibleGroups.find((group) => group.id === activeRoom.workGroupId)
      || visibleGroups.find((group) => (group.projectIds || []).includes(activeRoom.projectId))
      || visibleGroups[0]
      || null;
  }, [activeRoom, visibleGroups]);

  useEffect(() => {
    if (!searchParams.get('room') && visibleRooms[0]?.id) {
      setSearchParams({ room: visibleRooms[0].id });
    }
  }, [searchParams, setSearchParams, visibleRooms]);

  useEffect(() => {
    if (activeRoom?.projectId) {
      joinChatRoom(activeRoom.projectId, activeRoom.id);
    }
  }, [activeRoom?.id, activeRoom?.projectId, joinChatRoom]);

  useEffect(() => {
    if (!activeRoom?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshWorkspace();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRoom?.id, refreshWorkspace]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim() || !activeRoom) {
      return;
    }

    await sendMessage({ projectId: activeRoom.projectId, roomId: activeRoom.id, text: draft });
    setDraft('');
  }

  async function handleCreateRoom(event) {
    event.preventDefault();
    setRoomError('');
    setRoomNotice('');

    if (!roomForm.projectId || !roomForm.name.trim() || roomForm.description.trim().length < 10) {
      setRoomError('Selecciona un proyecto, asigna un nombre y agrega una descripcion breve para la sala.');
      return;
    }

    try {
      const room = await createChatRoom(roomForm);
      setRoomNotice('Sala creada y lista para conversar con tu equipo.');
      setRoomForm(initialRoomForm);
      if (room?.id) {
        setSearchParams({ room: room.id });
      }
    } catch (error) {
      setRoomError(String(error?.message || 'No pudimos crear la sala ahora mismo.'));
    }
  }

  return (
    <div className="page-stack">
      <section className="page-panel chat-banner">
        <div>
          <p className="eyebrow">Mensajes</p>
          <h2>Salas de conversacion del equipo y de cada proyecto</h2>
          <p className="body-copy">
            Cambia de sala sin perder contexto, crea nuevos espacios cuando haga falta y mantén la conversación ordenada.
          </p>
        </div>
        <div className="signal-row">
          <span className="tag subtle-tag">{visibleRooms.length} salas</span>
          <span className="tag subtle-tag">{messageMeta.countByRoom.get(activeRoomId) || 0} mensajes</span>
          <span className="tag subtle-tag">{activeGroup?.name || currentUser?.team || 'Equipo'}</span>
        </div>
      </section>

      <div className="chat-layout">
        <aside className="page-panel chat-sidebar">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Salas</p>
              <h2>Conversaciones visibles</h2>
            </div>
          </div>

          <div className="card-list compact-card-list">
            {visibleRooms.length ? (
              visibleRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={room.id === activeRoomId ? 'room-card active' : 'room-card'}
                  onClick={() => setSearchParams({ room: room.id })}
                >
                  <div className="detail-card-top">
                    <span className="tag">{room.defaultRoom ? 'Proyecto' : 'Sala'}</span>
                    <span>{projectLookup[room.projectId]?.code || activeGroup?.code || 'Team'}</span>
                  </div>
                  <h3>{room.name}</h3>
                  <p className="body-copy">{messageMeta.lastByRoom.get(room.id)?.text || room.description || 'Sin mensajes todavia.'}</p>
                </button>
              ))
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Aun no hay salas disponibles para esta cuenta.</p>
              </div>
            )}
          </div>

          {currentUser?.canManageMembers ? (
            <form className="form-stack chat-room-form" onSubmit={handleCreateRoom}>
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Nueva sala</p>
                  <h2>Abre un espacio por proyecto</h2>
                </div>
              </div>

              <label className="field">
                Proyecto
                <select value={roomForm.projectId} onChange={(event) => setRoomForm((current) => ({ ...current, projectId: event.target.value }))}>
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                Nombre de la sala
                <input
                  value={roomForm.name}
                  onChange={(event) => setRoomForm((current) => ({ ...current, name: sanitizePlainText(event.target.value) }))}
                  placeholder="Ejemplo: QA y aprobaciones"
                />
              </label>

              <label className="field">
                Descripcion
                <textarea
                  rows="3"
                  value={roomForm.description}
                  onChange={(event) => setRoomForm((current) => ({ ...current, description: sanitizeMultilineText(event.target.value) }))}
                  placeholder="Cuenta para que servira esta sala."
                />
              </label>

              {roomNotice ? <span className="auth-success-note">{roomNotice}</span> : null}
              {roomError ? <span className="field-error">{roomError}</span> : null}

              <button type="submit" className="primary-button">
                Crear sala
              </button>
            </form>
          ) : null}

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
              <h2>{activeRoom?.name || 'Selecciona una sala'}</h2>
              <p className="body-copy">{activeProject ? `${activeProject.name} · ${activeProject.code}` : activeRoom?.description || 'Selecciona una sala para ver la conversacion.'}</p>
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
            <button type="submit" className="primary-button" disabled={!activeRoom}>
              Enviar mensaje
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
