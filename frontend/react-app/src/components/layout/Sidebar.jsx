import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { staggerItem, staggerParent } from '../../utils/motion';

export function Sidebar({ currentUser, isOpen, onClose }) {
  const navItems = [
    { to: '/app/overview', label: 'Inicio', caption: 'Resumen general' },
    { to: '/app/projects', label: 'Proyectos', caption: 'Portafolio' },
    { to: '/app/groups', label: 'Equipos', caption: 'Personas y roles' },
    { to: '/app/board', label: 'Tablero', caption: 'Seguimiento' },
    { to: '/app/calendar', label: 'Calendario', caption: 'Fechas y reuniones' },
    { to: '/app/chat', label: 'Mensajes', caption: 'Conversaciones' },
    { to: '/app/timeline', label: 'Actividad', caption: 'Ultimos movimientos' },
    { to: '/app/profile', label: 'Cuenta', caption: 'Perfil y ajustes' }
  ];

  if (currentUser?.canManageMembers) {
    navItems.push({ to: '/app/members', label: 'Miembros', caption: 'Invitaciones y accesos' });
  }

  return (
    <motion.aside
      className={isOpen ? 'shell-sidebar open' : 'shell-sidebar'}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="brand-block">
        <p className="eyebrow">Project Manager</p>
        <h1>Tu espacio para proyectos, mensajes y fechas clave.</h1>
        <p className="body-copy muted-on-dark">
          Manten al equipo alineado, retoma el trabajo rapidamente y encuentra todo en un mismo lugar.
        </p>
      </div>

      <div className="sidebar-status-card">
        <span className="eyebrow">Equipo actual</span>
        <strong>{currentUser?.team || 'Espacio principal'}</strong>
        <p>Accede a tus proyectos, salas y pendientes del dia sin cambiar de contexto.</p>
      </div>

      <motion.nav className="sidebar-nav" aria-label="Navegacion principal" variants={staggerParent} initial="initial" animate="animate">
        {navItems.map((item) => (
          <motion.div key={item.to} variants={staggerItem}>
            <NavLink
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              onClick={onClose}
            >
              <strong>{item.label}</strong>
              <span>{item.caption}</span>
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      <div className="sidebar-footer">
        <div className={currentUser?.avatarUrl ? 'user-badge has-image' : 'user-badge'}>
          {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt={`Foto de ${currentUser?.name || 'mi cuenta'}`} /> : currentUser?.initials || 'PM'}
        </div>
        <div>
          <strong>{currentUser?.name || 'Mi cuenta'}</strong>
          <p>{currentUser?.role || 'Miembro'}</p>
          <span>{currentUser?.team || 'Espacio principal'}</span>
        </div>
      </div>
    </motion.aside>
  );
}
