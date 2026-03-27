import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { staggerItem, staggerParent } from '../utils/motion';
import { normalizeEmail, sanitizeMultilineText, sanitizePlainText, toInitials } from '../utils/security';

const initialSetup = {
  name: '',
  focus: '',
  description: '',
  cadence: 'Semanal',
  visibility: 'Restricted'
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitEmails(value) {
  return value
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function createEmailEntry(value) {
  const rawValue = value.trim();
  const normalized = normalizeEmail(rawValue);

  return {
    id: crypto.randomUUID(),
    value: rawValue,
    normalized,
    isValid: EMAIL_PATTERN.test(normalized)
  };
}

function appendEmailEntries(currentEntries, rawValue) {
  const nextEntries = [...currentEntries];
  const existingKeys = new Set(
    currentEntries.map((entry) => entry.normalized || entry.value.toLowerCase()).filter(Boolean)
  );

  splitEmails(rawValue).forEach((value) => {
    const entry = createEmailEntry(value);
    const key = entry.normalized || entry.value.toLowerCase();

    if (key && !existingKeys.has(key)) {
      nextEntries.push(entry);
      existingKeys.add(key);
    }
  });

  return nextEntries;
}

function entryTone(entry) {
  return entry.isValid ? 'listo para enviar' : 'revisar correo';
}

function formatDate(timestamp) {
  if (!timestamp) {
    return 'Ahora';
  }

  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function avatarFor(person) {
  if (person?.avatarUrl) {
    return <img src={person.avatarUrl} alt={`Foto de ${person.name}`} />;
  }

  return toInitials(person?.name || 'PM');
}

function EmailComposer({
  label,
  draft,
  onDraftChange,
  entries,
  onEntriesChange,
  placeholder,
  helperText
}) {
  const [editingEntryId, setEditingEntryId] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) || null;

  function commitDraft(value = draft) {
    if (!value.trim()) {
      return;
    }

    onEntriesChange((current) => appendEmailEntries(current, value));
    onDraftChange('');
  }

  function handleDraftChange(value) {
    const sanitized = sanitizePlainText(value);
    if (/[\n,;]+/.test(sanitized)) {
      const parts = sanitized.split(/[\n,;]+/);
      const trailingDraft = parts.pop() || '';
      const committedChunk = parts.join(',');

      if (committedChunk.trim()) {
        onEntriesChange((current) => appendEmailEntries(current, committedChunk));
      }

      onDraftChange(trailingDraft);
      return;
    }

    onDraftChange(sanitized);
  }

  function openEditor(entry) {
    setEditingEntryId(entry.id);
    setEditingValue(entry.value);
  }

  function closeEditor() {
    setEditingEntryId('');
    setEditingValue('');
  }

  function saveEditedEntry() {
    const nextEntry = createEmailEntry(editingValue);
    onEntriesChange((current) =>
      current.map((entry) => (entry.id === editingEntryId ? { ...nextEntry, id: editingEntryId } : entry))
    );
    closeEditor();
  }

  function removeEntry(entryId) {
    onEntriesChange((current) => current.filter((entry) => entry.id !== entryId));
    if (editingEntryId === entryId) {
      closeEditor();
    }
  }

  return (
    <div className="email-composer">
      <label className="field">
        {label}
        <div className="email-composer-box">
          <div className="email-chip-grid">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className={entry.isValid ? 'email-chip-card' : 'email-chip-card invalid'}
              >
                <div className="email-chip-copy">
                  <strong>{entry.value}</strong>
                  <span>{entryTone(entry)}</span>
                </div>
                <div className="email-chip-actions">
                  <button type="button" className="auth-inline-link" onClick={() => openEditor(entry)}>
                    Editar
                  </button>
                  <button type="button" className="auth-inline-link" onClick={() => removeEntry(entry.id)}>
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <input
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (['Enter', 'Tab', ',', ';'].includes(event.key)) {
                event.preventDefault();
                commitDraft();
              }
            }}
            onBlur={() => commitDraft()}
            placeholder={placeholder}
          />
        </div>
        <span className="field-help">{helperText}</span>
      </label>

      {editingEntry ? (
        <div className="email-chip-modal">
          <div className="email-chip-modal-card">
            <div>
              <p className="eyebrow">Revisar correo</p>
              <h3>Confirma o corrige este miembro</h3>
            </div>
            <label className="field">
              Correo del miembro
              <input value={editingValue} onChange={(event) => setEditingValue(sanitizePlainText(event.target.value))} />
            </label>
            <div className="email-chip-modal-actions">
              <button type="button" className="primary-button" onClick={saveEditedEntry}>
                Guardar correo
              </button>
              <button type="button" className="ghost-button" onClick={closeEditor}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MembersPage() {
  const {
    currentUser,
    fetchManagedTeam,
    inviteManagedTeamMembers,
    removeWorkgroupMember,
    revokeManagedTeamInvitation,
    setupManagedTeam
  } = useAppContext();
  const [managedTeam, setManagedTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [setupForm, setSetupForm] = useState(() => ({
    ...initialSetup,
    name: currentUser?.team && currentUser.team !== 'Sin equipo' ? currentUser.team : ''
  }));
  const [setupInviteEntries, setSetupInviteEntries] = useState([]);
  const [setupInviteDraft, setSetupInviteDraft] = useState('');
  const [inviteEntries, setInviteEntries] = useState([]);
  const [inviteDraft, setInviteDraft] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [pendingMemberId, setPendingMemberId] = useState('');
  const [pendingInvitationId, setPendingInvitationId] = useState('');

  const team = managedTeam?.team || null;
  const invitations = managedTeam?.invitations || [];
  const members = team?.roster || team?.members || [];
  const validInvitationCount = invitations.length;
  const invalidSetupEmails = setupInviteEntries.filter((entry) => !entry.isValid).length;
  const invalidInviteEmails = inviteEntries.filter((entry) => !entry.isValid).length;
  const normalizedFilter = sanitizePlainText(memberFilter).toLowerCase();
  const visibleMembers = normalizedFilter
    ? members.filter((member) =>
        [member.name, member.email, member.role, member.team]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedFilter))
      )
    : members;
  const removableMembers = members.filter(
    (member) => member.id && member.id !== currentUser?.id && member.role !== 'Group Lead'
  ).length;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!currentUser?.canManageMembers) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchManagedTeam();
        if (!cancelled) {
          setManagedTeam(response);
          if (!response?.team && currentUser?.team && currentUser.team !== 'Sin equipo') {
            setSetupForm((current) => ({
              ...current,
              name: current.name || currentUser.team
            }));
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(String(requestError?.message || 'No pudimos cargar los miembros del equipo.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.canManageMembers, currentUser?.team, fetchManagedTeam]);

  function updateSetupField(name, value) {
    setSetupForm((current) => ({
      ...current,
      [name]: name === 'description' ? sanitizeMultilineText(value) : sanitizePlainText(value)
    }));
    setNotice('');
    setError('');
  }

  async function handleSetupSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!setupForm.name) {
      setError('Escribe el nombre del equipo para continuar.');
      return;
    }

    if (setupInviteEntries.some((entry) => !entry.isValid)) {
      setError('Revisa los correos marcados antes de crear el equipo.');
      return;
    }

    const memberEmails = setupInviteEntries.map((entry) => entry.normalized);

    try {
      const response = await setupManagedTeam({
        name: setupForm.name,
        focus: setupForm.focus || setupForm.name,
        description: setupForm.description,
        cadence: setupForm.cadence,
        visibility: setupForm.visibility,
        memberEmails
      });

      setManagedTeam(response);
      setNotice(memberEmails.length ? 'Equipo listo e invitaciones enviadas.' : 'Equipo listo. Puedes invitar miembros cuando quieras.');
      setSetupInviteEntries([]);
      setSetupInviteDraft('');
    } catch (requestError) {
      setError(String(requestError?.message || 'No pudimos crear el equipo ahora mismo.'));
    }
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!inviteEntries.length) {
      setError('Agrega al menos un correo para enviar invitaciones.');
      return;
    }

    if (inviteEntries.some((entry) => !entry.isValid)) {
      setError('Corrige los correos marcados antes de enviar invitaciones.');
      return;
    }

    try {
      const response = await inviteManagedTeamMembers({ emails: inviteEntries.map((entry) => entry.normalized) });
      setManagedTeam(response);
      setInviteEntries([]);
      setInviteDraft('');
      setNotice('Invitaciones enviadas al equipo.');
    } catch (requestError) {
      setError(String(requestError?.message || 'No pudimos enviar las invitaciones.'));
    }
  }

  async function handleRevokeInvitation(invitationId) {
    setError('');
    setNotice('');
    setPendingInvitationId(invitationId);

    try {
      const response = await revokeManagedTeamInvitation(invitationId);
      setManagedTeam(response);
      setNotice('La invitacion fue cancelada.');
    } catch (requestError) {
      setError(String(requestError?.message || 'No pudimos cancelar esa invitacion.'));
    } finally {
      setPendingInvitationId('');
    }
  }

  async function handleRemoveMember(member) {
    if (!team?.id || !member?.id || member.role === 'Group Lead' || member.id === currentUser?.id) {
      return;
    }

    const confirmed = window.confirm(`Quitaremos a ${member.name} del equipo ${team.name}. Podras invitarle otra vez despues. Deseas continuar?`);
    if (!confirmed) {
      return;
    }

    setError('');
    setNotice('');
    setPendingMemberId(member.id);

    try {
      await removeWorkgroupMember(team.id, member.id);
      const refreshed = await fetchManagedTeam();
      setManagedTeam(refreshed);
      setNotice(`${member.name} ya no forma parte del equipo.`);
    } catch (requestError) {
      setError(String(requestError?.message || 'No pudimos quitar a este miembro ahora mismo.'));
    } finally {
      setPendingMemberId('');
    }
  }

  if (!currentUser?.canManageMembers) {
    return (
      <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
        <motion.section className="page-panel subtle-empty-state" variants={staggerItem}>
          <p className="eyebrow">Miembros</p>
          <h1>Esta seccion queda disponible para administradores de equipo.</h1>
          <p className="body-copy">Si recibiste una invitacion, aceptala desde el enlace del correo o desde <Link to="/join-team">Unirme a un equipo</Link>.</p>
        </motion.section>
      </motion.div>
    );
  }

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="hero-surface compact-hero members-hero" variants={staggerItem}>
        <div>
          <p className="eyebrow">Miembros</p>
          <h1>{team ? 'Administra a tu equipo sin perder contexto' : 'Prepara tu equipo antes de empezar a invitar'}</h1>
          <p className="body-copy hero-copy">
            {team
              ? 'Desde aqui controlas las personas activas, los accesos pendientes y la forma en que entran nuevos miembros a tu espacio.'
              : 'Define el nombre, el enfoque y a quien quieres invitar. Puedes saltarte correos ahora y volver mas tarde sin perder el ritmo.'}
          </p>
        </div>
        <div className="members-hero-side">
          <div className="members-hero-owner">
            <div className={currentUser?.avatarUrl ? 'member-avatar has-image' : 'member-avatar'}>
              {avatarFor(currentUser)}
            </div>
            <div>
              <span>Admin responsable</span>
              <strong>{currentUser?.name}</strong>
              <p>{team ? team.name : 'Sin equipo creado'}</p>
            </div>
          </div>
          <div className="members-hero-metrics">
            <article className="metric-card glass-card">
              <span>Miembros activos</span>
              <strong>{members.length}</strong>
              <p className="body-copy">{team ? 'Personas que ya pueden colaborar hoy.' : 'Apareceran cuando el equipo quede listo.'}</p>
            </article>
            <article className="metric-card glass-card">
              <span>Invitaciones</span>
              <strong>{validInvitationCount}</strong>
              <p className="body-copy">{team ? 'Correos pendientes de aceptar.' : 'Puedes prepararlas desde la creacion inicial.'}</p>
            </article>
          </div>
        </div>
      </motion.section>

      {notice ? (
        <motion.section className="page-panel notice-panel" variants={staggerItem}>
          <span className="auth-success-note">{notice}</span>
        </motion.section>
      ) : null}

      {error ? (
        <motion.section className="page-panel notice-panel" variants={staggerItem}>
          <span className="field-error">{error}</span>
        </motion.section>
      ) : null}

      {!team ? (
        <motion.section className="members-onboarding-grid" variants={staggerParent}>
          <motion.article className="page-panel members-story-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Antes de invitar</p>
                <h2>Configura el espacio con una estructura clara</h2>
              </div>
            </div>

            <div className="members-story-list">
              <article className="detail-card">
                <div className="detail-card-top">
                  <span className="tag subtle-tag">Paso 1</span>
                  <span>Identidad del equipo</span>
                </div>
                <h3>Ponle nombre, enfoque y tono operativo</h3>
                <p className="body-copy">Esto define como se presentara tu equipo en miembros, chat, proyectos y accesos.</p>
              </article>

              <article className="detail-card">
                <div className="detail-card-top">
                  <span className="tag subtle-tag">Paso 2</span>
                  <span>Invitacion opcional</span>
                </div>
                <h3>Agrega correos cuando ya estes seguro</h3>
                <p className="body-copy">Cada direccion queda como tarjeta revisable para evitar errores antes de enviar.</p>
              </article>

              <article className="detail-card">
                <div className="detail-card-top">
                  <span className="tag subtle-tag">Paso 3</span>
                  <span>Entrada ordenada</span>
                </div>
                <h3>Tu equipo empieza limpio y sin ruido</h3>
                <p className="body-copy">Si hoy no quieres invitar a nadie, crea el espacio y vuelve luego desde esta misma pagina.</p>
              </article>
            </div>
          </motion.article>

          <motion.article className="page-panel members-setup-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Crea tu equipo</p>
                <h2>Prepara el espacio del administrador</h2>
              </div>
              <span className="tag subtle-tag">{setupInviteEntries.length} correos preparados</span>
            </div>

            <form className="form-stack" onSubmit={handleSetupSubmit}>
              <div className="form-row">
                <label className="field">
                  Nombre del equipo
                  <input value={setupForm.name} onChange={(event) => updateSetupField('name', event.target.value)} placeholder="Ejemplo: CocaCola Tech" />
                </label>
                <label className="field">
                  Enfoque
                  <input value={setupForm.focus} onChange={(event) => updateSetupField('focus', event.target.value)} placeholder="Producto, backend, analitica..." />
                </label>
              </div>

              <label className="field">
                Descripcion
                <textarea rows="4" value={setupForm.description} onChange={(event) => updateSetupField('description', event.target.value)} placeholder="Describe el equipo, su alcance y el tipo de trabajo que coordina." />
              </label>

              <div className="form-row">
                <label className="field">
                  Ritmo
                  <input value={setupForm.cadence} onChange={(event) => updateSetupField('cadence', event.target.value)} />
                </label>
                <label className="field">
                  Visibilidad
                  <select value={setupForm.visibility} onChange={(event) => updateSetupField('visibility', event.target.value)}>
                    <option value="Restricted">Solo equipo</option>
                    <option value="Internal">Interno</option>
                    <option value="Confidential">Reservado</option>
                  </select>
                </label>
              </div>

              <EmailComposer
                label="Correos para invitar ahora"
                draft={setupInviteDraft}
                onDraftChange={setSetupInviteDraft}
                entries={setupInviteEntries}
                onEntriesChange={setSetupInviteEntries}
                placeholder="Escribe un correo y presiona Enter"
                helperText="Cada correo queda como tarjeta para revisarlo, corregirlo o quitarlo antes de crear el equipo."
              />

              <div className="members-inline-summary">
                <span className="tag subtle-tag">{setupInviteEntries.length} listos</span>
                {invalidSetupEmails ? <span className="tag subtle-tag">{
                  `${invalidSetupEmails} por revisar`
                }</span> : null}
              </div>

              <div className="profile-actions">
                <button type="submit" className="primary-button">Crear equipo</button>
                <span className="field-help">Puedes dejar las invitaciones para despues. Lo importante es que el espacio quede creado.</span>
              </div>
            </form>
          </motion.article>
        </motion.section>
      ) : (
        <>
          <motion.section className="metric-grid members-metric-grid" variants={staggerParent}>
            <motion.article className="metric-card glass-card" variants={staggerItem}>
              <span>Equipo</span>
              <strong>{team.name}</strong>
              <p className="body-copy">{team.focus}</p>
            </motion.article>
            <motion.article className="metric-card glass-card" variants={staggerItem}>
              <span>Miembros activos</span>
              <strong>{members.length}</strong>
              <p className="body-copy">Personas que ya participan dentro del espacio.</p>
            </motion.article>
            <motion.article className="metric-card glass-card" variants={staggerItem}>
              <span>Invitaciones pendientes</span>
              <strong>{validInvitationCount}</strong>
              <p className="body-copy">Correos enviados que todavia no confirman ingreso.</p>
            </motion.article>
            <motion.article className="metric-card glass-card" variants={staggerItem}>
              <span>Miembros administrables</span>
              <strong>{removableMembers}</strong>
              <p className="body-copy">Personas que puedes retirar o volver a invitar cuando haga falta.</p>
            </motion.article>
          </motion.section>

          <motion.section className="members-dashboard-grid" variants={staggerParent}>
            <motion.article className="page-panel members-composer-panel" variants={staggerItem}>
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Invitaciones</p>
                  <h2>Agrega personas con un flujo mas limpio</h2>
                </div>
                <span className="tag subtle-tag">{inviteEntries.length} correos en cola</span>
              </div>

              <div className="members-team-strip">
                <div>
                  <strong>{team.name}</strong>
                  <p className="body-copy">{team.description || 'Tu equipo ya esta listo para coordinar miembros, proyectos y mensajes.'}</p>
                </div>
                <div className="members-inline-summary">
                  <span className="tag subtle-tag">{team.code}</span>
                  <span className="tag subtle-tag">{team.cadence}</span>
                  <span className="tag subtle-tag">{team.visibility}</span>
                </div>
              </div>

              <form className="form-stack" onSubmit={handleInviteSubmit}>
                <EmailComposer
                  label="Invitar miembros por correo"
                  draft={inviteDraft}
                  onDraftChange={setInviteDraft}
                  entries={inviteEntries}
                  onEntriesChange={setInviteEntries}
                  placeholder="correo@empresa.com"
                  helperText="Las invitaciones saldran con la estetica de la app y el enlace directo para unirse a tu equipo."
                />

                <div className="members-inline-summary">
                  <span className="tag subtle-tag">{inviteEntries.length} preparados</span>
                  {invalidInviteEmails ? <span className="tag subtle-tag">{`${invalidInviteEmails} por revisar`}</span> : null}
                </div>

                <button type="submit" className="primary-button">Enviar invitaciones</button>
              </form>
            </motion.article>

            <motion.article className="page-panel members-side-panel" variants={staggerItem}>
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Resumen del espacio</p>
                  <h2>Lo importante de un vistazo</h2>
                </div>
              </div>

              <div className="members-summary-stack">
                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Enfoque</span>
                  </div>
                  <h3>{team.focus}</h3>
                  <p className="body-copy">El equipo aparece con esta orientacion en la experiencia compartida.</p>
                </article>

                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Cadencia</span>
                  </div>
                  <h3>{team.cadence}</h3>
                  <p className="body-copy">Sirve como marco para planificar reuniones, entregas y seguimiento.</p>
                </article>

                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Visibilidad</span>
                  </div>
                  <h3>{team.visibility}</h3>
                  <p className="body-copy">Mantiene claro el alcance del equipo y el nivel de exposicion del trabajo.</p>
                </article>
              </div>
            </motion.article>
          </motion.section>

          <motion.section className="two-column-grid align-start-grid members-content-grid" variants={staggerParent}>
            <motion.article className="page-panel" variants={staggerItem}>
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Participan aqui</p>
                  <h2>Miembros activos</h2>
                </div>
                <span className="tag subtle-tag">{visibleMembers.length} visibles</span>
              </div>

              <div className="members-toolbar">
                <label className="field members-search-field">
                  Buscar miembro
                  <input
                    value={memberFilter}
                    onChange={(event) => setMemberFilter(sanitizePlainText(event.target.value))}
                    placeholder="Nombre, correo o rol"
                  />
                </label>
                <div className="members-inline-summary">
                  <span className="tag subtle-tag">{members.length} en el equipo</span>
                  <span className="tag subtle-tag">{validInvitationCount} pendientes</span>
                </div>
              </div>

              <div className="members-grid refined-members-grid members-management-grid">
                {visibleMembers.map((member) => {
                  const isLead = member.role === 'Group Lead';
                  const isCurrentUser = member.id === currentUser?.id;
                  const canRemove = member.id && !isLead && !isCurrentUser;

                  return (
                    <article key={member.userId || member.id} className="member-card member-card-refined member-card-managed">
                      <div className={member.avatarUrl ? 'member-avatar has-image' : 'member-avatar'}>
                        {avatarFor(member)}
                      </div>
                      <div className="member-card-body">
                        <div className="member-card-copy">
                          <strong>{member.name}</strong>
                          <p>{member.email || 'Cuenta ya vinculada'}</p>
                          <div className="member-card-tags">
                            <span>{isLead ? 'Administrador del equipo' : 'Miembro del equipo'}</span>
                            {member.status ? <span>{member.status}</span> : null}
                          </div>
                        </div>
                        <div className="member-card-actions">
                          {isLead ? <span className="tag subtle-tag">Responsable principal</span> : null}
                          {isCurrentUser && !isLead ? <span className="tag subtle-tag">Tu cuenta</span> : null}
                          {canRemove ? (
                            <button
                              type="button"
                              className="ghost-button danger-button"
                              disabled={pendingMemberId === member.id}
                              onClick={() => void handleRemoveMember(member)}
                            >
                              {pendingMemberId === member.id ? 'Quitando...' : 'Quitar del equipo'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!visibleMembers.length ? (
                <div className="empty-state subtle-empty-state members-empty-state">
                  <p className="body-copy">
                    {members.length
                      ? 'No encontramos miembros con ese filtro. Prueba con otro nombre, correo o rol.'
                      : 'Cuando el equipo tenga personas activas, apareceran aqui para administrarlas desde este panel.'}
                  </p>
                </div>
              ) : null}
            </motion.article>

            <motion.article className="page-panel" variants={staggerItem}>
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Invitaciones pendientes</p>
                  <h2>Correos enviados para unirse</h2>
                </div>
              </div>

              {isLoading ? (
                <p className="body-copy">Cargando invitaciones...</p>
              ) : invitations.length ? (
                <div className="card-list compact-card-list members-invitation-list">
                  {invitations.map((invitation) => (
                    <article key={invitation.id} className="detail-card invitation-card">
                      <div className="detail-card-top">
                        <span className="tag">{invitation.status === 'PENDING' ? 'Pendiente' : invitation.status}</span>
                        <span>Enviado {formatDate(invitation.sentAt)}</span>
                      </div>
                      <h3>{invitation.email}</h3>
                      <p className="body-copy">Vence {formatDate(invitation.expiresAt)}</p>
                      <button
                        type="button"
                        className="auth-inline-link"
                        disabled={pendingInvitationId === invitation.id}
                        onClick={() => void handleRevokeInvitation(invitation.id)}
                      >
                        {pendingInvitationId === invitation.id ? 'Cancelando...' : 'Cancelar invitacion'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state subtle-empty-state members-empty-state">
                  <p className="body-copy">Todavia no hay invitaciones pendientes. Cuando envies correos, apareceran aqui con su estado.</p>
                </div>
              )}
            </motion.article>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
