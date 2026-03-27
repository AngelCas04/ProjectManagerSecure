import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { revealPanel } from '../utils/motion';
import { validateResetPassword } from '../utils/security';

function buildFriendlyResetError(requestError) {
  const message = String(requestError?.message || '').toLowerCase();

  if (message.includes('vencio') || message.includes('valido')) {
    return 'El enlace ya no esta disponible. Solicita uno nuevo desde la pantalla de acceso.';
  }

  return 'No pudimos actualizar tu contrasena. Revisa los datos e intenta otra vez.';
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { validatePasswordResetToken, resetPassword } = useAppContext();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ valid: false, message: '' });
  const [error, setError] = useState('');

  const errors = useMemo(() => validateResetPassword(form), [form]);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setStatus({ valid: false, message: 'Necesitas un enlace valido para cambiar tu contrasena.' });
          setIsChecking(false);
        }
        return;
      }

      try {
        const response = await validatePasswordResetToken(token);
        if (isMounted) {
          setStatus(response);
        }
      } catch (requestError) {
        if (isMounted) {
          setStatus({ valid: false, message: buildFriendlyResetError(requestError) });
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    void checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, validatePasswordResetToken]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value.trim()
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setError('');

    if (!status.valid || Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await resetPassword({
        token,
        password: form.password
      });
      navigate('/login', {
        replace: true,
        state: {
          authNotice: response.message || 'Tu contrasena fue actualizada. Ya puedes iniciar sesion.'
        }
      });
    } catch (requestError) {
      setError(buildFriendlyResetError(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="reset-shell">
      <motion.section className="reset-panel" variants={revealPanel} initial="initial" animate="animate">
        <p className="eyebrow">Nueva contrasena</p>
        <h1>Actualiza tu acceso</h1>
        <p className="body-copy">
          Elige una contrasena nueva para recuperar tu cuenta y volver a tu espacio de trabajo.
        </p>

        {isChecking ? (
          <div className="reset-status-card">
            <strong>Validando enlace...</strong>
            <p>Estamos comprobando tu solicitud.</p>
          </div>
        ) : !status.valid ? (
          <div className="reset-status-card reset-status-card-danger">
            <strong>Enlace no disponible</strong>
            <p>{status.message}</p>
            <button type="button" className="primary-button" onClick={() => navigate('/forgot-password', { replace: true })}>
              Solicitar uno nuevo
            </button>
          </div>
        ) : (
          <form className="auth-grid auth-grid-product" onSubmit={handleSubmit}>
            <div className="reset-status-card">
              <strong>Enlace listo</strong>
              <p>{status.message}</p>
            </div>

            <label className="field">
              Nueva contrasena
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                autoComplete="new-password"
                placeholder="Crea una contrasena segura"
              />
              {submitted && errors.password ? <span className="field-error">{errors.password}</span> : null}
            </label>

            <label className="field">
              Confirmar contrasena
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                autoComplete="new-password"
                placeholder="Repite tu nueva contrasena"
              />
              {submitted && errors.confirmPassword ? <span className="field-error">{errors.confirmPassword}</span> : null}
            </label>

            {error ? <span className="field-error">{error}</span> : null}

            <button type="submit" className="primary-button block-button" disabled={isSaving}>
              {isSaving ? 'Guardando contrasena...' : 'Guardar contrasena nueva'}
            </button>

            <button type="button" className="auth-inline-link" onClick={() => navigate('/login', { replace: true })}>
              Volver al acceso
            </button>
          </form>
        )}
      </motion.section>
    </div>
  );
}
