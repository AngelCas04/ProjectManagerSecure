import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { revealPanel } from '../utils/motion';

export default function JoinTeamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { acceptTeamInvitation, currentUser, previewTeamInvitation, session } = useAppContext();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setError('La invitacion no tiene un token valido.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await previewTeamInvitation(token);
        if (!cancelled) {
          setPreview(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(String(requestError?.message || 'No pudimos abrir la invitacion.'));
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
  }, [previewTeamInvitation, token]);

  async function handleAccept() {
    setIsJoining(true);
    setError('');
    try {
      await acceptTeamInvitation(token);
      navigate('/app/overview', { replace: true });
    } catch (requestError) {
      setError(String(requestError?.message || 'No pudimos completar la invitacion.'));
    } finally {
      setIsJoining(false);
    }
  }

  function goToAuth(mode) {
    const query = new URLSearchParams({
      mode,
      inviteToken: token
    });
    if (preview?.email) {
      query.set('email', preview.email);
    }
    if (preview?.teamName) {
      query.set('team', preview.teamName);
    }
    navigate(`/login?${query.toString()}`, { replace: true, state: { from: { pathname: '/app/overview' } } });
  }

  return (
    <div className="reset-shell">
      <motion.section className="reset-panel" variants={revealPanel} initial="initial" animate="animate">
        <p className="eyebrow">Unirme a un equipo</p>
        <h1>Tu invitacion ya esta lista</h1>

        {isLoading ? <p className="body-copy">Estamos preparando los detalles de la invitacion...</p> : null}

        {!isLoading && preview?.valid ? (
          <>
            <p className="body-copy">
              <strong>{preview.inviterName}</strong> te invito a unirte al equipo <strong>{preview.teamName}</strong> con el correo <strong>{preview.email}</strong>.
            </p>
            <div className="auth-registration-note">
              <strong>{preview.existingAccount ? 'Ya tienes cuenta' : 'Aun no tienes cuenta'}</strong>
              <p>
                {preview.existingAccount
                  ? 'Entra con tu cuenta y luego acepta la invitacion para entrar directamente al equipo.'
                  : 'Crea tu cuenta con este mismo correo y quedarás unido al equipo en cuanto termines.'}
              </p>
            </div>

            {session ? (
              <button type="button" className="primary-button block-button" disabled={isJoining} onClick={() => void handleAccept()}>
                {isJoining ? 'Uniendo tu cuenta...' : 'Aceptar invitacion'}
              </button>
            ) : (
              <div className="join-team-actions">
                <button type="button" className="primary-button block-button" onClick={() => goToAuth(preview.existingAccount ? 'login' : 'register')}>
                  {preview.existingAccount ? 'Iniciar sesion y unirme' : 'Crear cuenta y unirme'}
                </button>
                {!preview.existingAccount ? (
                  <button type="button" className="ghost-button block-button" onClick={() => goToAuth('login')}>
                    Ya tengo cuenta
                  </button>
                ) : (
                  <button type="button" className="ghost-button block-button" onClick={() => goToAuth('register')}>
                    Crear otra cuenta con este correo
                  </button>
                )}
              </div>
            )}
          </>
        ) : null}

        {!isLoading && !preview?.valid ? (
          <p className="body-copy">La invitacion ya no esta disponible. Pidele al administrador que te envie una nueva.</p>
        ) : null}

        {error ? <span className="field-error">{error}</span> : null}

        {currentUser?.canManageMembers ? (
          <button type="button" className="auth-inline-link" onClick={() => navigate('/app/members', { replace: true })}>
            Volver a Miembros
          </button>
        ) : (
          <button type="button" className="auth-inline-link" onClick={() => navigate('/login', { replace: true })}>
            Volver al acceso
          </button>
        )}
      </motion.section>
    </div>
  );
}
