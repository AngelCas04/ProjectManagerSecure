import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { currentUser, session, updateProfile } = useAppContext();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    team: currentUser?.team || '',
    avatarUrl: currentUser?.avatarUrl || ''
  });

  useEffect(() => {
    setForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      team: currentUser?.team || '',
      avatarUrl: currentUser?.avatarUrl || ''
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

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setForm((current) => ({
      ...current,
      avatarUrl: dataUrl
    }));
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name || !form.email || !form.team) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        ...currentUser,
        ...form
      });
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.div className="page-stack" variants={staggerParent} initial="initial" animate="animate">
      <motion.section className="hero-surface compact-hero" variants={staggerItem}>
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Tu perfil, tu foto y la forma en que te ve el equipo</h1>
          <p className="body-copy hero-copy">
            Mantene tus datos al dia para que sea facil encontrarte, asignarte trabajo y ubicarte dentro del equipo correcto.
          </p>
        </div>
        <div className="hero-actions profile-chip-group">
          <span className="tag">Rol: {currentUser?.role || 'Miembro'}</span>
          <span className="tag">Desde: {profileInfo.joinedAt}</span>
        </div>
      </motion.section>

      <section className="profile-layout">
        <motion.article className="page-panel profile-card-panel" variants={staggerItem}>
          <div className={form.avatarUrl ? 'profile-avatar has-image' : 'profile-avatar'}>
            {form.avatarUrl ? <img src={form.avatarUrl} alt={`Foto de ${form.name || 'perfil'}`} /> : profileInfo.initials}
          </div>
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
            <div className="profile-photo-row">
              <div className={form.avatarUrl ? 'profile-upload-preview has-image' : 'profile-upload-preview'}>
                {form.avatarUrl ? <img src={form.avatarUrl} alt={`Foto de ${form.name || 'perfil'}`} /> : profileInfo.initials}
              </div>
              <label className="field profile-photo-field">
                Foto de perfil
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                <span className="field-help">Sube una imagen cuadrada o vertical. La usaremos en tu cuenta y en las listas del equipo.</span>
              </label>
            </div>

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
              <input
                value={form.team}
                onChange={(event) => updateField('team', event.target.value)}
                maxLength="60"
                required
                disabled={currentUser?.canManageMembers}
              />
              {currentUser?.canManageMembers ? (
                <span className="field-help">
                  El nombre de tu equipo se administra desde <Link to="/app/members">Miembros</Link>.
                </span>
              ) : null}
            </label>

            <div className="profile-actions">
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {saved ? <span className="save-badge">Cambios guardados</span> : null}
            </div>
          </form>
        </motion.article>
      </section>
    </motion.div>
  );
}
