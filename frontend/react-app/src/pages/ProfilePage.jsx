import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { staggerItem, staggerParent } from '../utils/motion';
import { normalizeEmail, sanitizePlainText, toInitials } from '../utils/security';

function formatMemberSince(timestamp) {
  if (!timestamp) {
    return 'Hoy';
  }

  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium'
  }).format(new Date(timestamp));
}

export default function ProfilePage() {
  const { currentUser, session, updateProfile } = useAppContext();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    team: currentUser?.team || ''
  });

  useEffect(() => {
    setForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      team: currentUser?.team || ''
    });
  }, [currentUser]);

  const profileInfo = useMemo(
    () => ({
      initials: toInitials(form.name),
      joinedAt: formatMemberSince(session?.issuedAt)
    }),
    [form.name, session?.issuedAt]
  );

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'email' ? normalizeEmail(value) : sanitizePlainText(value)
    }));
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name || !form.email || !form.team) {
      return;
    }

    await updateProfile({
      ...currentUser,
      ...form
    });
    setSaved(true);
  }

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="hero-surface compact-hero" variants={staggerItem}>
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Tu perfil y la informacion que comparte el equipo</h1>
          <p className="body-copy hero-copy">
            Mantene actualizados tus datos para que sea facil encontrarte, asignarte trabajo y ubicarte en el equipo correcto.
          </p>
        </div>
        <div className="hero-actions profile-chip-group">
          <span className="tag">Rol: {currentUser?.role || 'Miembro'}</span>
          <span className="tag">Desde: {profileInfo.joinedAt}</span>
        </div>
      </motion.section>

      <section className="profile-layout">
        <motion.article className="page-panel profile-card-panel" variants={staggerItem}>
          <div className="profile-avatar">{profileInfo.initials}</div>
          <h2>{form.name || 'Tu cuenta'}</h2>
          <p className="body-copy">{currentUser?.role || 'Miembro del equipo'}</p>
          <dl className="profile-list">
            <div>
              <dt>Correo</dt>
              <dd>{form.email || '-'}</dd>
            </div>
            <div>
              <dt>Equipo</dt>
              <dd>{form.team || '-'}</dd>
            </div>
            <div>
              <dt>Miembro desde</dt>
              <dd>{profileInfo.joinedAt}</dd>
            </div>
          </dl>
        </motion.article>

        <motion.article className="page-panel" variants={staggerItem}>
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Editar perfil</p>
              <h2>Actualiza tu informacion principal</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              Nombre completo
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} maxLength="60" required />
            </label>

            <label className="field">
              Correo
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
            </label>

            <label className="field">
              Equipo
              <input value={form.team} onChange={(event) => updateField('team', event.target.value)} maxLength="60" required />
            </label>

            <div className="profile-actions">
              <button type="submit" className="primary-button">
                Guardar cambios
              </button>
              {saved ? <span className="save-badge">Cambios guardados</span> : null}
            </div>
          </form>
        </motion.article>
      </section>
    </motion.div>
  );
}
