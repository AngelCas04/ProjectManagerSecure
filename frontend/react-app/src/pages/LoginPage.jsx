import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthHelpDrawer } from '../components/AuthHelpDrawer';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { revealPanel, staggerItem, staggerParent } from '../utils/motion';
import { normalizeEmail, sanitizePlainText, validateCredentials } from '../utils/security';

const demoCredentials = {
  email: 'valeria.ruiz@acme.dev',
  password: 'SecurePass123!'
};

const helpLabel = '\u00BFNecesitas ayuda?';

function buildInitialForm(search) {
  const params = new URLSearchParams(search);
  const inviteToken = params.get('inviteToken') || '';
  const inviteEmail = params.get('email') || '';
  const inviteTeam = params.get('team') || '';
  const requestedMode = params.get('mode') === 'register' ? 'register' : 'login';

  if (requestedMode === 'register') {
    return {
      mode: 'register',
      accountType: 'MIEMBRO_PROYECTO',
      name: '',
      team: inviteTeam,
      email: inviteEmail,
      password: '',
      confirmPassword: '',
      inviteToken
    };
  }

  return {
    mode: 'login',
    accountType: 'MIEMBRO_PROYECTO',
    name: '',
    team: 'Producto',
    email: inviteEmail || demoCredentials.email,
    password: demoCredentials.password,
    confirmPassword: demoCredentials.password,
    inviteToken
  };
}

const experienceHighlights = [
  {
    title: 'Trabajo claro',
    body: 'Ve tus proyectos, pendientes y conversaciones sin navegar entre pantallas confusas.'
  },
  {
    title: 'Equipo visible',
    body: 'Cada espacio agrupa personas, roles y ritmo de trabajo en un solo lugar.'
  },
  {
    title: 'Acceso recuperable',
    body: 'Tu cuenta guarda una palabra de recuperación para volver a entrar con seguridad.'
  }
];

function buildFriendlyAuthError(requestError) {
  const rawMessage = String(requestError?.message || '');
  const message = rawMessage.toLowerCase();

  if (message.includes('401') || message.includes('unauthorized')) {
    return 'Revisa tu correo y contrasena para volver a intentarlo.';
  }

  if (message.includes('429')) {
    return 'Hiciste varios intentos seguidos. Espera un momento y vuelve a probar.';
  }

  if (message.includes('already registered')) {
    return 'Ese correo ya tiene una cuenta. Inicia sesion o recupera tu acceso.';
  }

  if (message.includes('at least 12 characters')) {
    return 'Usa una contrasena de al menos 12 caracteres.';
  }

  if (message.includes('upper, lower, number and special character')) {
    return 'La contrasena debe incluir mayuscula, minuscula, numero y simbolo.';
  }

  if (message.includes('invitation')) {
    return 'No pudimos completar la invitacion. Vuelve a abrir el enlace o solicita una nueva.';
  }

  if (message.includes('name is required')) {
    return 'Escribe tu nombre para crear la cuenta.';
  }

  if (rawMessage.trim()) {
    return rawMessage;
  }

  return 'No pudimos abrir tu espacio en este momento. Intentalo nuevamente.';
}

function copyText(text) {
  if (!navigator?.clipboard?.writeText) {
    return Promise.reject(new Error('Clipboard unavailable'));
  }

  return navigator.clipboard.writeText(text);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, isLoading, signIn, registerAccount, acceptTeamInvitation } = useAppContext();
  const { language, toggleLanguage, translate } = useI18n();
  const [form, setForm] = useState(() => buildInitialForm(location.search));
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice] = useState(location.state?.authNotice || '');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showRecoveryReveal, setShowRecoveryReveal] = useState(false);
  const [recoveryWord, setRecoveryWord] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryWordCopied, setRecoveryWordCopied] = useState(false);
  const [postRecoveryDestination, setPostRecoveryDestination] = useState('/app/overview');

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const inviteToken = searchParams.get('inviteToken') || form.inviteToken || '';
  const inviteTeam = sanitizePlainText(searchParams.get('team') || '');
  const isInvitationRegistration = form.mode === 'register' && Boolean(inviteToken);
  const destination = location.state?.from?.pathname || '/app/overview';
  const errors = useMemo(() => {
    const nextErrors = validateCredentials(form);

    if (form.mode === 'register' && form.accountType !== 'ADMINISTRADOR' && !sanitizePlainText(form.team)) {
      nextErrors.team = 'Indica el equipo al que perteneces.';
    }

    if (form.mode === 'register' && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contrasenas no coinciden.';
    }

    return nextErrors;
  }, [form]);

  function switchMode(nextMode) {
    setSubmitted(false);
    setAuthError('');
    setShowRecoveryReveal(false);
    setRecoveryWord('');
    setRecoveryMessage('');
    setRecoveryWordCopied(false);
    setPostRecoveryDestination('/app/overview');

    if (nextMode === 'login') {
      setForm({
        ...buildInitialForm(location.search),
        mode: 'login'
      });
      return;
    }

    setForm({
      mode: 'register',
      accountType: 'MIEMBRO_PROYECTO',
      name: '',
      team: inviteTeam,
      email: searchParams.get('email') || '',
      password: '',
      confirmPassword: '',
      inviteToken
    });
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'password' || name === 'confirmPassword' ? value.trim() : sanitizePlainText(value)
    }));
  }

  function openRecoveryPage() {
    const email = normalizeEmail(form.email);
    navigate(email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password');
  }

  async function revealRecoveryWord(recoveryKit, nextPath) {
    setRecoveryWord(recoveryKit?.passphrase || '');
    setRecoveryMessage(recoveryKit?.message || 'La necesitaras junto a tu correo si algun dia quieres restablecer tu contrasena.');
    setRecoveryWordCopied(false);
    setPostRecoveryDestination(nextPath || destination);
    setShowRecoveryReveal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (form.mode === 'register') {
        const registration = await registerAccount(form);
        if (registration?.recoveryKit?.passphrase) {
          await revealRecoveryWord(
            registration.recoveryKit,
            registration?.currentUser?.needsTeamSetup ? '/app/members?setup=1' : '/app/groups'
          );
          return;
        }
        navigate(registration?.currentUser?.needsTeamSetup ? '/app/members?setup=1' : '/app/groups', { replace: true });
        return;
      }

      const session = await signIn(form);
      if (inviteToken) {
        await acceptTeamInvitation(inviteToken);
        if (session?.recoveryKit?.passphrase) {
          await revealRecoveryWord(session.recoveryKit, '/app/overview');
          return;
        }
        navigate('/app/overview', { replace: true });
        return;
      }
      if (session?.recoveryKit?.passphrase) {
        await revealRecoveryWord(
          session.recoveryKit,
          session?.currentUser?.needsTeamSetup ? '/app/members?setup=1' : destination
        );
        return;
      }
      navigate(session?.currentUser?.needsTeamSetup ? '/app/members?setup=1' : destination, { replace: true });
    } catch (requestError) {
      setAuthError(buildFriendlyAuthError(requestError));
    }
  }

  async function enterDemoWorkspace() {
    setAuthError('');

    try {
      await signIn(demoCredentials);
      navigate('/app/overview', { replace: true });
    } catch (requestError) {
      setAuthError(buildFriendlyAuthError(requestError));
    }
  }

  async function handleCopyRecoveryWord() {
    try {
      await copyText(recoveryWord);
      setRecoveryWordCopied(true);
    } catch {
      setRecoveryWordCopied(false);
    }
  }

  function handleRecoveryContinue() {
    setShowRecoveryReveal(false);
    navigate(postRecoveryDestination, { replace: true });
  }

  return (
    <>
      <div className="auth-shell auth-shell-product">
        <motion.section className="auth-brand-panel auth-stage-panel" variants={revealPanel} initial="initial" animate="animate">
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />

          <div className="auth-stage-header">
            <div>
              <p className="eyebrow">Project Manager</p>
              <h1>Todo el trabajo del equipo, claro y en un solo lugar.</h1>
              <p className="body-copy muted-on-dark">
                Organiza proyectos, conversa con tu equipo y sigue las fechas importantes sin perder el contexto de cada entrega.
              </p>
            </div>

            <div className="language-switch hero-language-switch" role="group" aria-label="Language switcher">
              <button type="button" className={language === 'es' ? 'language-pill active' : 'language-pill'} onClick={() => toggleLanguage('es')}>
                ES
              </button>
              <button type="button" className={language === 'en' ? 'language-pill active' : 'language-pill'} onClick={() => toggleLanguage('en')}>
                EN
              </button>
            </div>
          </div>

          <motion.div className="auth-story-grid" variants={staggerParent} initial="initial" animate="animate">
            {experienceHighlights.map((item) => (
              <motion.article key={item.title} className="auth-story-card" variants={staggerItem}>
                <span>{item.title}</span>
                <p>{item.body}</p>
              </motion.article>
            ))}
          </motion.div>

          <div className="auth-brand-actions">
            <button type="button" className="primary-button" onClick={enterDemoWorkspace}>
              Entrar con demo
            </button>
            <button type="button" className="ghost-button" onClick={() => setIsHelpOpen(true)}>
              {helpLabel}
            </button>
          </div>

          <div className="auth-value-strip">
            {['Tableros por proyecto', 'Mensajes por equipo', 'Calendario compartido'].map((item) => (
              <span key={item} className="tag subtle-tag">
                {translate(item)}
              </span>
            ))}
          </div>
        </motion.section>

        <motion.section className="auth-form-panel auth-form-panel-product" variants={revealPanel} initial="initial" animate="animate">
          <div className="auth-mode-toggle" role="tablist" aria-label="Modo de acceso">
            <button
              type="button"
              className={form.mode === 'login' ? 'auth-mode-pill active' : 'auth-mode-pill'}
              onClick={() => switchMode('login')}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              className={form.mode === 'register' ? 'auth-mode-pill active' : 'auth-mode-pill'}
              onClick={() => switchMode('register')}
            >
              Crear cuenta
            </button>
          </div>

          <div className="panel-headline">
            <div>
              <p className="eyebrow">{form.mode === 'login' ? 'Bienvenido' : 'Empieza hoy'}</p>
              <h2>{form.mode === 'login' ? 'Entra a tu espacio de trabajo' : 'Crea tu cuenta y comienza a colaborar'}</h2>
              <p className="body-copy">
                {form.mode === 'login'
                  ? 'Retoma tus proyectos, conversaciones y pendientes desde donde los dejaste.'
                  : 'Tu cuenta quedara lista para unirse a proyectos, conversar con tu equipo y dar seguimiento al trabajo.'}
              </p>
            </div>

            <button type="button" className="ghost-button auth-help-trigger" onClick={() => setIsHelpOpen(true)}>
              {helpLabel}
            </button>
          </div>

          <form className="auth-grid auth-grid-product" onSubmit={handleSubmit}>
            {form.mode === 'register' ? (
              <>
                <div className="account-type-toggle" role="group" aria-label="Tipo de cuenta">
                  <button
                    type="button"
                    className={form.accountType === 'MIEMBRO_PROYECTO' ? 'auth-mode-pill active' : 'auth-mode-pill'}
                    onClick={() => updateField('accountType', 'MIEMBRO_PROYECTO')}
                    disabled={Boolean(inviteToken)}
                  >
                    Miembro
                  </button>
                  <button
                    type="button"
                    className={form.accountType === 'ADMINISTRADOR' ? 'auth-mode-pill active' : 'auth-mode-pill'}
                    onClick={() => updateField('accountType', 'ADMINISTRADOR')}
                    disabled={Boolean(inviteToken)}
                  >
                    Administrador de equipo
                  </button>
                </div>

                {inviteToken ? (
                  <div className="auth-registration-note">
                    <strong>Esta cuenta se creara para unirse al equipo de una invitacion</strong>
                    <p>Usaremos el correo y el equipo del enlace, y te agregaremos como miembro cuando termines el registro.</p>
                  </div>
                ) : null}

                <label className="field">
                  Nombre completo
                  <input
                    name="name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    autoComplete="name"
                    maxLength="60"
                    placeholder="Tu nombre"
                  />
                  {submitted && errors.name ? <span className="field-error">{translate(errors.name)}</span> : null}
                </label>

                <label className="field">
                  {form.accountType === 'ADMINISTRADOR' ? 'Nombre del equipo inicial (opcional)' : 'Equipo'}
                  <input
                    name="team"
                    value={form.team}
                    onChange={(event) => updateField('team', event.target.value)}
                    autoComplete="organization"
                    maxLength="60"
                    placeholder={form.accountType === 'ADMINISTRADOR' ? 'Puedes crearlo despues desde Miembros' : 'Ejemplo: Producto'}
                    readOnly={isInvitationRegistration}
                    aria-readonly={isInvitationRegistration}
                    className={isInvitationRegistration ? 'locked-field-input' : ''}
                  />
                  {isInvitationRegistration ? <span className="field-help">Este equipo viene definido por la invitacion.</span> : null}
                  {submitted && errors.team ? <span className="field-error">{translate(errors.team)}</span> : null}
                </label>
              </>
            ) : null}

            <label className="field">
              Correo corporativo
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                autoComplete="username"
                inputMode="email"
                placeholder="nombre@empresa.com"
                readOnly={Boolean(inviteToken)}
                aria-readonly={Boolean(inviteToken)}
                className={inviteToken ? 'locked-field-input' : ''}
              />
              {inviteToken ? <span className="field-help">Este correo queda reservado para aceptar la invitacion.</span> : null}
              {submitted && errors.email ? <span className="field-error">{translate(errors.email)}</span> : null}
            </label>

            <label className="field">
              Contrasena
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                autoComplete={form.mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={form.mode === 'login' ? 'Tu contrasena' : 'Crea una contrasena segura'}
              />
              {submitted && errors.password ? <span className="field-error">{translate(errors.password)}</span> : null}
            </label>

            {form.mode === 'login' ? (
              <button type="button" className="auth-inline-link auth-inline-link-left" onClick={openRecoveryPage}>
                Olvidaste tu contrasena?
              </button>
            ) : null}

            {form.mode === 'register' ? (
              <label className="field">
                Confirmar contrasena
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repite tu contrasena"
                />
                {submitted && errors.confirmPassword ? <span className="field-error">{translate(errors.confirmPassword)}</span> : null}
              </label>
            ) : null}

            {form.mode === 'register' ? (
              <div className="auth-registration-note">
                <strong>{form.accountType === 'ADMINISTRADOR' ? 'Despues podras crear tu equipo e invitar miembros' : 'La app generara una palabra de recuperacion'}</strong>
                <p>
                  {form.accountType === 'ADMINISTRADOR'
                    ? 'Terminando tu cuenta te llevaremos a Miembros para crear el equipo, agregar correos o saltarte ese paso y volver despues.'
                    : 'La veras una sola vez al crear tu cuenta. Guardala en un lugar seguro porque la necesitaras si olvidas tu contrasena.'}
                </p>
              </div>
            ) : null}

            {authNotice ? <span className="auth-success-note">{authNotice}</span> : null}
            {authError || error ? <span className="field-error">{translate(authError || error)}</span> : null}

            <button type="submit" className="primary-button block-button" disabled={isLoading}>
              {translate(
                isLoading
                  ? 'Preparando tu espacio...'
                  : form.mode === 'login'
                    ? 'Entrar'
                    : 'Crear cuenta'
              )}
            </button>
          </form>

          <div className="auth-foot-actions">
            <button
              type="button"
              className="auth-inline-link"
              onClick={() => switchMode(form.mode === 'login' ? 'register' : 'login')}
            >
              {form.mode === 'login' ? 'No tienes cuenta? Crear una' : 'Ya tienes cuenta? Inicia sesion'}
            </button>
            <button type="button" className="auth-inline-link" onClick={openRecoveryPage}>
              Olvidaste tu contrasena?
            </button>
          </div>

          <p className="auth-soft-note">
            Usa la cuenta de demostracion para conocer la experiencia o crea la tuya para empezar a trabajar con tu equipo.
          </p>
        </motion.section>
      </div>

      <AnimatePresence>
        {showRecoveryReveal && recoveryWord ? (
          <motion.div className="recovery-modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section
              className="recovery-modal"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="recovery-word-title"
            >
              <p className="eyebrow">Guarda esto ahora</p>
              <h3 id="recovery-word-title">Tu palabra de recuperacion</h3>
              <p className="body-copy">{recoveryMessage || 'Es la llave que pediremos si algun dia necesitas volver a entrar. La vas a ver solo una vez.'}</p>

              <div className="recovery-word-card">
                <strong>{recoveryWord}</strong>
                <span>Clave generada para esta cuenta</span>
              </div>

              <div className="recovery-modal-actions">
                <button type="button" className="ghost-button" onClick={handleCopyRecoveryWord}>
                  {recoveryWordCopied ? 'Copiada' : 'Copiar clave'}
                </button>
                <button type="button" className="primary-button" onClick={handleRecoveryContinue}>
                  Ya la guarde
                </button>
              </div>

              <p className="recovery-modal-foot">
                La usaremos junto a tu correo para validar que realmente eres tu antes de enviarte un enlace de recuperacion.
              </p>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AuthHelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
