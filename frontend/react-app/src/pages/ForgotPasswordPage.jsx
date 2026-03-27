import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { revealPanel } from '../utils/motion';
import { normalizeEmail, sanitizePlainText, validateRecoveryRequest } from '../utils/security';

function buildFriendlyRecoveryError(requestError) {
  const message = String(requestError?.message || '').toLowerCase();

  if (message.includes('correo de recuperacion')) {
    return 'No pudimos enviar el correo de recuperacion. Intenta nuevamente en unos minutos.';
  }

  return 'No pudimos procesar la solicitud. Revisa tus datos e intenta otra vez.';
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestPasswordRecovery } = useAppContext();
  const [form, setForm] = useState({
    email: normalizeEmail(new URLSearchParams(location.search).get('email') || ''),
    recoveryPhrase: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const errors = useMemo(() => validateRecoveryRequest(form), [form]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: name === 'email' ? normalizeEmail(value) : sanitizePlainText(value)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setError('');
    setNotice('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestPasswordRecovery(form);
      setNotice(response.message || 'Si los datos coinciden, te enviamos un enlace para recuperar tu contrasena.');
    } catch (requestError) {
      setError(buildFriendlyRecoveryError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="reset-shell">
      <motion.section className="reset-panel" variants={revealPanel} initial="initial" animate="animate">
        <p className="eyebrow">Recuperar acceso</p>
        <h1>Te ayudamos a volver a entrar</h1>
        <p className="body-copy">
          Ingresa el correo con el que inicias sesion y la clave de recuperacion que guardaste al crear tu cuenta.
        </p>

        <form className="auth-grid auth-grid-product" onSubmit={handleSubmit}>
          <label className="field">
            Correo de tu cuenta
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="username"
              placeholder="nombre@empresa.com"
            />
            {submitted && errors.email ? <span className="field-error">{errors.email}</span> : null}
          </label>

          <label className="field">
            Clave de recuperacion
            <input
              name="recoveryPhrase"
              type="text"
              value={form.recoveryPhrase}
              onChange={(event) => updateField('recoveryPhrase', event.target.value)}
              autoComplete="off"
              placeholder="Ejemplo: amber-faro-lumen"
            />
            {submitted && errors.recoveryPhrase ? <span className="field-error">{errors.recoveryPhrase}</span> : null}
          </label>

          {notice ? <span className="auth-success-note">{notice}</span> : null}
          {error ? <span className="field-error">{error}</span> : null}

          <button type="submit" className="primary-button block-button" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando enlace...' : 'Enviar correo de recuperacion'}
          </button>

          <button type="button" className="auth-inline-link" onClick={() => navigate('/login', { replace: true })}>
            Volver al acceso
          </button>
        </form>
      </motion.section>
    </div>
  );
}
