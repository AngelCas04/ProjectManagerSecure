import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import { createSessionNotice } from '../../utils/security';

const pageMeta = {
  '/app/overview': {
    title: 'Vista general',
    description: 'Revisa proyectos activos, proximas fechas y el ritmo del equipo.'
  },
  '/app/projects': {
    title: 'Proyectos',
    description: 'Crea, revisa y ordena el trabajo de cada entrega.'
  },
  '/app/groups': {
    title: 'Equipos',
    description: 'Organiza personas, responsables y participacion por equipo.'
  },
  '/app/board': {
    title: 'Tablero',
    description: 'Mueve tareas, prioriza pendientes y acompana el avance diario.'
  },
  '/app/calendar': {
    title: 'Calendario',
    description: 'Mantene visibles reuniones, entregas y momentos importantes.'
  },
  '/app/chat': {
    title: 'Mensajes',
    description: 'Conversa con tu equipo en salas vinculadas a los proyectos que compartes.'
  },
  '/app/timeline': {
    title: 'Actividad',
    description: 'Consulta los ultimos movimientos del espacio y de los proyectos.'
  },
  '/app/profile': {
    title: 'Cuenta',
    description: 'Actualiza tu informacion y revisa los datos basicos de tu perfil.'
  },
  '/app/members': {
    title: 'Miembros',
    description: 'Crea tu equipo, envia invitaciones y gestiona quien puede entrar.'
  }
};

function resolvePageMeta(pathname) {
  if (pathname.startsWith('/app/projects/')) {
    return {
      title: 'Detalle del proyecto',
      description: 'Consulta tareas, conversaciones y proximos pasos de una entrega puntual.'
    };
  }

  return pageMeta[pathname] || pageMeta['/app/overview'];
}

function buildTodayLabel() {
  return new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
}

export function Topbar({ onToggleNavigation, onSignOut, currentUser }) {
  const location = useLocation();
  const { language, toggleLanguage } = useI18n();
  const meta = resolvePageMeta(location.pathname);

  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="topbar-main">
        <button type="button" className="menu-toggle" onClick={onToggleNavigation} aria-label="Abrir menu">
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="eyebrow">{buildTodayLabel()}</p>
          <h2>{meta.title}</h2>
          <p className="body-copy">{meta.description}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-insight">
          <span>Equipo</span>
          <strong>{currentUser?.team || 'Espacio principal'}</strong>
        </div>
        <div className="language-switch" role="group" aria-label="Language switcher">
          <button
            type="button"
            className={language === 'es' ? 'language-pill active' : 'language-pill'}
            onClick={() => toggleLanguage('es')}
          >
            ES
          </button>
          <button
            type="button"
            className={language === 'en' ? 'language-pill active' : 'language-pill'}
            onClick={() => toggleLanguage('en')}
          >
            EN
          </button>
        </div>
        <div className="session-chip" role="status" aria-live="polite">
          {createSessionNotice()}
        </div>
        <div className="session-user">
          <strong>{currentUser?.email || 'Sin cuenta activa'}</strong>
          <button type="button" className="ghost-button" onClick={onSignOut}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </motion.header>
  );
}
