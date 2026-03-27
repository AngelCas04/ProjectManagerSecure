import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { floatingCard, revealPanel, staggerItem, staggerParent } from '../utils/motion';
import { sanitizeMultilineText, sanitizePlainText } from '../utils/security';

const initialGroupForm = {
  name: '',
  code: '',
  lead: '',
  focus: '',
  security: 'Restricted',
  cadence: 'Semanal',
  summary: '',
  projectIds: []
};

const initialMemberForm = {
  userId: '',
  role: 'Member'
};

function visibilityLabel(value) {
  switch (value) {
    case 'Internal':
      return 'Interno';
    case 'Confidential':
      return 'Reservado';
    default:
      return 'Solo equipo';
  }
}

export default function GroupsPage() {
  const { createWorkgroup, addWorkgroupMember, currentUser, projects, removeWorkgroupMember, updateWorkgroup, userDirectory, workgroups } = useAppContext();
  const isAdmin = Boolean(currentUser?.canManageMembers);
  const [selectedGroupId, setSelectedGroupId] = useState(workgroups[0]?.id || '');
  const [groupForm, setGroupForm] = useState(() => ({
    ...initialGroupForm,
    lead: currentUser?.name || ''
  }));
  const [groupDraft, setGroupDraft] = useState(null);
  const [memberForm, setMemberForm] = useState(initialMemberForm);
  const [groupError, setGroupError] = useState('');
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    if (!selectedGroupId && workgroups[0]?.id) {
      setSelectedGroupId(workgroups[0].id);
    }

    if (selectedGroupId && !workgroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(workgroups[0]?.id || '');
    }
  }, [selectedGroupId, workgroups]);

  const selectedGroup = useMemo(
    () => workgroups.find((group) => group.id === selectedGroupId) || workgroups[0] || null,
    [selectedGroupId, workgroups]
  );

  useEffect(() => {
    setGroupDraft(selectedGroup);
  }, [selectedGroup]);

  useEffect(() => {
    if (!groupForm.lead && currentUser?.name) {
      setGroupForm((current) => ({
        ...current,
        lead: currentUser.name
      }));
    }
  }, [currentUser?.name, groupForm.lead]);

  const metrics = useMemo(() => {
    const totalMembers = workgroups.reduce((count, group) => count + (group.members?.length || 0), 0);
    const connectedProjects = new Set(workgroups.flatMap((group) => group.projectIds || [])).size;
    const activeGroups = workgroups.filter((group) => (group.members || []).some((member) => member.status === 'Activo')).length;

    return {
      totalMembers,
      connectedProjects,
      activeGroups
    };
  }, [workgroups]);

  const availableMembers = useMemo(() => {
    const assignedMemberIds = new Set((selectedGroup?.members || []).map((member) => member.id));
    return userDirectory.filter((entry) => !assignedMemberIds.has(entry.id));
  }, [selectedGroup?.members, userDirectory]);

  if (!isAdmin) {
    return (
      <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
        <motion.section className="hero-surface workgroup-hero" variants={revealPanel}>
          <div>
            <p className="eyebrow">Equipos</p>
            <h1>Tu equipo y las personas con quienes trabajas</h1>
            <p className="body-copy hero-copy">
              Aqui puedes ver a tus companeros, el responsable del equipo y los proyectos compartidos, sin opciones de administracion.
            </p>
          </div>
          <div className="hero-actions hero-stats">
            <article className="hero-stat-chip">
              <span>Equipos visibles</span>
              <strong>{workgroups.length}</strong>
            </article>
            <article className="hero-stat-chip">
              <span>Companeros</span>
              <strong>{metrics.totalMembers}</strong>
            </article>
          </div>
        </motion.section>

        <motion.section className="two-column-grid align-start-grid workgroup-detail-grid" variants={staggerParent}>
          <motion.article className="page-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Tu espacio</p>
                <h2>{selectedGroup?.name || 'Aun no perteneces a un equipo'}</h2>
              </div>
            </div>

            {selectedGroup ? (
              <>
                <div className="signal-row workgroup-signal-row">
                  <span className="tag subtle-tag">{selectedGroup.code}</span>
                  <span className="tag subtle-tag">{visibilityLabel(selectedGroup.security)}</span>
                  <span className="tag subtle-tag">{selectedGroup.lead}</span>
                </div>
                <p className="body-copy">{selectedGroup.summary}</p>
                <div className="project-pill-grid">
                  {(selectedGroup.projectIds || []).map((projectId) => {
                    const project = projects.find((item) => item.id === projectId);
                    return (
                      <span key={projectId} className="project-pill active">
                        <strong>{project?.code || 'PX'}</strong>
                        <span>{project?.name || projectId}</span>
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">Cuando aceptes una invitacion de equipo, tus companeros apareceran aqui.</p>
              </div>
            )}
          </motion.article>

          <motion.article className="page-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Companeros</p>
                <h2>Personas visibles en tu equipo</h2>
              </div>
            </div>

            <div className="card-list compact-card-list">
              {(selectedGroup?.members || []).map((member) => (
                <article key={member.id} className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag">{member.role === 'Group Lead' ? 'Responsable' : 'Miembro'}</span>
                    <span>{member.status}</span>
                  </div>
                  <h3>{member.name}</h3>
                  <p className="body-copy">{member.email || 'Cuenta vinculada al espacio.'}</p>
                </article>
              ))}
            </div>
          </motion.article>
        </motion.section>
      </motion.div>
    );
  }

  function updateGroupForm(name, value) {
    setGroupForm((current) => ({
      ...current,
      [name]: name === 'summary' ? sanitizeMultilineText(value) : sanitizePlainText(value)
    }));
  }

  function updateMemberForm(name, value) {
    setMemberForm((current) => ({
      ...current,
      [name]: sanitizePlainText(value)
    }));
  }

  function toggleProject(projectId) {
    setGroupForm((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((item) => item !== projectId)
        : [...current.projectIds, projectId]
    }));
  }

  async function handleCreateGroup(event) {
    event.preventDefault();
    setGroupError('');

    if (!groupForm.name || groupForm.summary.length < 20) {
      setGroupError('Agrega un nombre y una descripcion de al menos 20 caracteres.');
      return;
    }

    const nextId = await createWorkgroup({
      ...groupForm,
      code: groupForm.code || `GRP-${String(workgroups.length + 1).padStart(2, '0')}`,
      lead: groupForm.lead || currentUser?.name || 'Responsable'
    });

    setSelectedGroupId(nextId);
    setGroupForm({
      ...initialGroupForm,
      lead: currentUser?.name || ''
    });
  }

  async function handleSaveGroup() {
    if (!selectedGroup || !groupDraft) {
      return;
    }

    await updateWorkgroup(selectedGroup.id, {
      ...groupDraft,
      summary: sanitizeMultilineText(groupDraft.summary),
      focus: sanitizePlainText(groupDraft.focus),
      cadence: sanitizePlainText(groupDraft.cadence),
      security: sanitizePlainText(groupDraft.security),
      projectIds: groupDraft.projectIds || []
    });
  }

  async function handleAddMember(event) {
    event.preventDefault();
    setMemberError('');

    if (!selectedGroup || !memberForm.userId || !memberForm.role) {
      setMemberError('Selecciona una persona y el rol que tendra dentro del equipo.');
      return;
    }

    await addWorkgroupMember(selectedGroup.id, memberForm);
    setMemberForm(initialMemberForm);
  }

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="hero-surface workgroup-hero" variants={revealPanel}>
        <div>
          <p className="eyebrow">Equipos</p>
          <h1>Personas, proyectos y responsabilidades alineadas</h1>
          <p className="body-copy hero-copy">
            Crea equipos, asigna responsables y mantene visible quien participa en cada proyecto.
          </p>
        </div>

        <div className="hero-actions hero-stats">
          <article className="hero-stat-chip">
            <span>Equipos activos</span>
            <strong>{workgroups.length}</strong>
          </article>
          <article className="hero-stat-chip">
            <span>Proyectos vinculados</span>
            <strong>{metrics.connectedProjects}</strong>
          </article>
          <article className="hero-stat-chip">
            <span>Personas visibles</span>
            <strong>{metrics.totalMembers}</strong>
          </article>
        </div>
      </motion.section>

      <motion.section className="metric-grid" variants={staggerParent}>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Equipos con actividad</span>
          <strong>{metrics.activeGroups}</strong>
          <p className="body-copy">Equipos que ya tienen al menos una persona activa y proyectos en seguimiento.</p>
        </motion.article>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Proyectos vinculados</span>
          <strong>{metrics.connectedProjects}</strong>
          <p className="body-copy">Entregas que ya tienen equipo definido y responsables visibles.</p>
        </motion.article>
        <motion.article className="metric-card glass-card" variants={staggerItem} initial="rest" whileHover="hover" animate="animate">
          <span>Personas mapeadas</span>
          <strong>{metrics.totalMembers}</strong>
          <p className="body-copy">Quienes ya aparecen listos para colaborar dentro del espacio.</p>
        </motion.article>
      </motion.section>

      <motion.section className="two-column-grid align-start-grid workgroup-layout" variants={staggerParent}>
        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Lista de equipos</p>
              <h2>Encuentra rapido quien lleva cada frente</h2>
            </div>
          </div>

          <div className="card-list workgroup-list">
            {workgroups.map((group) => (
              <motion.button
                key={group.id}
                type="button"
                className={group.id === selectedGroup?.id ? 'detail-card link-card workgroup-card active' : 'detail-card link-card workgroup-card'}
                variants={floatingCard}
                initial="rest"
                whileHover="hover"
                onClick={() => setSelectedGroupId(group.id)}
              >
                <div className="detail-card-top">
                  <span className="tag">{group.code}</span>
                  <span className="risk-pill">{visibilityLabel(group.security)}</span>
                </div>
                <h3>{group.name}</h3>
                <p className="body-copy">{group.summary}</p>
                <div className="project-meta-grid">
                  <span>{group.lead}</span>
                  <span>{group.members?.length || 0} personas</span>
                </div>
                <div className="signal-row">
                  {(group.projectIds || []).map((projectId) => {
                    const project = projects.find((item) => item.id === projectId);
                    return (
                      <span key={projectId} className="tag subtle-tag">
                        {project?.code || projectId}
                      </span>
                    );
                  })}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.article>

        <motion.article className="page-panel sticky-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{isAdmin ? 'Nuevo equipo' : 'Tu equipo'}</p>
              <h2>{isAdmin ? 'Crea un equipo con responsables claros' : 'Vista de companeros y responsable'}</h2>
            </div>
          </div>

          {isAdmin ? (
            <form className="form-stack" onSubmit={handleCreateGroup}>
              <label className="field">
                Nombre del equipo
                <input value={groupForm.name} onChange={(event) => updateGroupForm('name', event.target.value)} />
              </label>

              <div className="form-row">
                <label className="field">
                  Codigo
                  <input value={groupForm.code} onChange={(event) => updateGroupForm('code', event.target.value)} placeholder="GRP-03" />
                </label>
                <label className="field">
                  Responsable
                  <input value={groupForm.lead} onChange={(event) => updateGroupForm('lead', event.target.value)} placeholder={currentUser?.name || 'Responsable'} />
                </label>
              </div>

              <div className="form-row">
                <label className="field">
                  Enfoque
                  <input value={groupForm.focus} onChange={(event) => updateGroupForm('focus', event.target.value)} placeholder="Producto, Operaciones, Analisis..." />
                </label>
                <label className="field">
                  Visibilidad
                  <select value={groupForm.security} onChange={(event) => updateGroupForm('security', event.target.value)}>
                    <option value="Internal">Interno</option>
                    <option value="Restricted">Solo equipo</option>
                    <option value="Confidential">Reservado</option>
                  </select>
                </label>
              </div>

              <label className="field">
                Ritmo del equipo
                <input value={groupForm.cadence} onChange={(event) => updateGroupForm('cadence', event.target.value)} placeholder="Semanal, diario, quincenal..." />
              </label>

              <label className="field">
                Descripcion
                <textarea rows="4" value={groupForm.summary} onChange={(event) => updateGroupForm('summary', event.target.value)} />
              </label>

              <div className="project-selector">
                <span className="field-label">Proyectos relacionados</span>
                <div className="project-pill-grid">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={groupForm.projectIds.includes(project.id) ? 'project-pill active' : 'project-pill'}
                      onClick={() => toggleProject(project.id)}
                    >
                      <strong>{project.code}</strong>
                      <span>{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {groupError ? <span className="field-error">{groupError}</span> : null}

              <button type="submit" className="primary-button block-button">
                Crear equipo
              </button>
            </form>
          ) : (
            <div className="empty-state subtle-empty-state">
              <p className="body-copy">
                Aqui solo ves a tus companeros, el responsable y los proyectos vinculados. La gestion del equipo queda reservada para cuentas administradoras.
              </p>
            </div>
          )}
        </motion.article>
      </motion.section>

      {!workgroups.length ? (
        <motion.section className="page-panel empty-state subtle-empty-state" variants={staggerItem}>
          <div>
            <p className="eyebrow">Sin equipos todavia</p>
            <h2>Este espacio ya puede usarse, pero todavia falta crear el primer equipo.</h2>
          </div>
        </motion.section>
      ) : null}

      {selectedGroup && groupDraft ? (
        <motion.section className="two-column-grid align-start-grid workgroup-detail-grid" variants={staggerParent}>
          <motion.article className="page-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Equipo seleccionado</p>
                <h2>{selectedGroup.name}</h2>
              </div>
              {isAdmin ? (
                <button type="button" className="ghost-button" onClick={() => void handleSaveGroup()}>
                  Guardar cambios
                </button>
              ) : null}
            </div>

            {isAdmin ? (
              <>
                <div className="group-editor-grid">
                  <label className="field">
                    Enfoque
                    <input
                      value={groupDraft.focus || ''}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        setGroupDraft((current) => ({
                          ...current,
                          focus: sanitizePlainText(event.target.value)
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    Ritmo
                    <input
                      value={groupDraft.cadence || ''}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        setGroupDraft((current) => ({
                          ...current,
                          cadence: sanitizePlainText(event.target.value)
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    Visibilidad
                    <select
                      value={groupDraft.security || 'Restricted'}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        setGroupDraft((current) => ({
                          ...current,
                          security: event.target.value
                        }))
                      }
                    >
                      <option value="Internal">Interno</option>
                      <option value="Restricted">Solo equipo</option>
                      <option value="Confidential">Reservado</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  Descripcion
                  <textarea
                    rows="4"
                    value={groupDraft.summary || ''}
                    disabled={!isAdmin}
                    onChange={(event) =>
                      setGroupDraft((current) => ({
                        ...current,
                        summary: sanitizeMultilineText(event.target.value)
                      }))
                    }
                  />
                </label>

                <div className="project-selector">
                  <span className="field-label">Proyectos relacionados</span>
                  <div className="project-pill-grid">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        disabled={!isAdmin}
                        className={(groupDraft.projectIds || []).includes(project.id) ? 'project-pill active' : 'project-pill'}
                        onClick={() =>
                          setGroupDraft((current) => ({
                            ...current,
                            projectIds: (current.projectIds || []).includes(project.id)
                              ? current.projectIds.filter((item) => item !== project.id)
                              : [...(current.projectIds || []), project.id]
                          }))
                        }
                      >
                        <strong>{project.code}</strong>
                        <span>{project.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="signal-row workgroup-signal-row">
                  <span className="tag subtle-tag">{selectedGroup.code}</span>
                  <span className="tag subtle-tag">{visibilityLabel(groupDraft.security || selectedGroup.security)}</span>
                  <span className="tag subtle-tag">{selectedGroup.lead}</span>
                </div>
              </>
            ) : (
              <div className="members-summary-stack">
                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Responsable</span>
                  </div>
                  <h3>{selectedGroup.lead}</h3>
                  <p className="body-copy">La persona que coordina el trabajo y toma decisiones del equipo.</p>
                </article>
                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Enfoque</span>
                  </div>
                  <h3>{groupDraft.focus || selectedGroup.focus}</h3>
                  <p className="body-copy">{groupDraft.summary || selectedGroup.summary || 'Este equipo mantiene alineado su trabajo desde un mismo espacio.'}</p>
                </article>
                <article className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag subtle-tag">Proyectos relacionados</span>
                  </div>
                  <div className="signal-row">
                    {(selectedGroup.projectIds || []).length ? (
                      (selectedGroup.projectIds || []).map((projectId) => {
                        const project = projects.find((item) => item.id === projectId);
                        return (
                          <span key={projectId} className="tag subtle-tag">
                            {project?.name || projectId}
                          </span>
                        );
                      })
                    ) : (
                      <span className="tag subtle-tag">Sin proyectos vinculados</span>
                    )}
                  </div>
                </article>
              </div>
            )}
          </motion.article>

          <motion.article className="page-panel" variants={staggerItem}>
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Personas del equipo</p>
                <h2>Quienes participan aqui</h2>
              </div>
            </div>

            <div className="card-list compact-card-list">
              {(selectedGroup.members || []).map((member) => (
                <article key={member.id} className="detail-card">
                  <div className="detail-card-top">
                    <span className="tag">{member.status}</span>
                    <span>{member.role}</span>
                  </div>
                  <h3>{member.name}</h3>
                  <p className="body-copy">{member.email || 'Cuenta ya vinculada al directorio del espacio.'}</p>
                  {isAdmin && member.id !== currentUser?.id ? (
                    <button
                      type="button"
                      className="auth-inline-link"
                      onClick={() => void removeWorkgroupMember(selectedGroup.id, member.id)}
                    >
                      Quitar del equipo
                    </button>
                  ) : null}
                </article>
              ))}
            </div>

            {isAdmin ? (
              <form className="form-stack" onSubmit={handleAddMember}>
                <div className="form-row">
                  <label className="field">
                    Persona disponible
                    <select value={memberForm.userId} onChange={(event) => updateMemberForm('userId', event.target.value)}>
                      <option value="">Selecciona una persona</option>
                      {availableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Rol
                    <select value={memberForm.role} onChange={(event) => updateMemberForm('role', event.target.value)}>
                      <option value="Member">Miembro</option>
                      <option value="Group Lead">Responsable</option>
                    </select>
                  </label>
                </div>

                {memberError ? <span className="field-error">{memberError}</span> : null}

                <button type="submit" className="primary-button block-button">
                  Agregar persona
                </button>
              </form>
            ) : (
              <div className="empty-state subtle-empty-state">
                <p className="body-copy">La asignacion de personas queda disponible para cuentas administradoras.</p>
              </div>
            )}
          </motion.article>
        </motion.section>
      ) : null}
    </motion.div>
  );
}
