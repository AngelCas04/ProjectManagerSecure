import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthHelpDrawer } from '../components/AuthHelpDrawer';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { revealPanel, staggerItem, staggerParent } from '../utils/motion';
import { sanitizePlainText, validateCredentials } from '../utils/security';

const demoCredentials = {
  email: 'valeria.ruiz@acme.dev',
  password: 'SecurePass123!'
};

const helpLabel = '\u00BFNecesitas ayuda?';

const initialForm = {
  mode: 'login',
  name: '',
  team: 'Producto',
  email: demoCredentials.email,
  password: demoCredentials.password,
  confirmPassword: demoCredentials.password
};

const experienceHighlights = [
  {
    title: 'Proyectos claros',
    body: 'Ve avances, prioridades y fechas sin navegar entre pantallas confusas.'
  },
  {
    title: 'Mensajes con contexto',
    body: 'Conversa con tu equipo desde salas ligadas a los proyectos en los que participas.'
  },
  {
    title: 'Seguimiento diario',
    body: 'Ten a mano tareas, calendario y actividad reciente en el mismo espacio.'
  }
];

function buildFriendlyAuthError(requestError) {
  const message = String(requestError?.message || '').toLowerCase();

  if (message.includes('401') || message.includes('unauthorized')) {
    return 'Revisa tu correo y contrasena para volver a intentarlo.';
  }

  if (message.includes('429')) {
    return 'Hiciste varios intentos seguidos. Espera un momento y vuelve a probar.';
  }

  return 'No pudimos abrir tu espacio en este momento. Intentalo nuevamente.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, isLoading, signIn, registerAccount } = useAppContext();
  const { language, toggleLanguage, translate } = useI18n();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const destination = location.state?.from?.pathname || '/app/overview';
  const errors = useMemo(() => {
    const nextErrors = validateCredentials(form);

    if (form.mode === 'register' && !sanitizePlainText(form.team)) {
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

    if (nextMode === 'login') {
      setForm({
        ...initialForm,
        mode: 'login'
      });
      return;
    }

    setForm({
      mode: 'register',
      name: '',
      team: 'Producto',
      email: '',
      password: '',
      confirmPassword: ''
    });
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'password' || name === 'confirmPassword' ? value.trim() : sanitizePlainText(value)
    }));
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
        await registerAccount(form);
        navigate('/app/groups', { replace: true });
      } else {
        await signIn(form);
        navigate(destination, { replace: true });
      }
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
                  Equipo
                  <input
                    name="team"
                    value={form.team}
                    onChange={(event) => updateField('team', event.target.value)}
                    autoComplete="organization"
                    maxLength="60"
                    placeholder="Ejemplo: Producto"
                  />
                  {submitted && errors.team ? <span className="field-error">{translate(errors.team)}</span> : null}
                </label>
              </>
            ) : null}

            <label className="field">
              Correo
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                autoComplete="username"
                inputMode="email"
                placeholder="nombre@empresa.com"
              />
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
            <button type="button" className="auth-inline-link" onClick={() => setIsHelpOpen(true)}>
              {helpLabel}
            </button>
          </div>

          <p className="auth-soft-note">
            Usa la cuenta de demostracion para conocer la experiencia o crea la tuya para empezar a trabajar con tu equipo.
          </p>
        </motion.section>
      </div>

      <AuthHelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
