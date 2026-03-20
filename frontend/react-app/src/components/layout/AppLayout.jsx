import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { pageTransition } from '../../utils/motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const { currentUser, signOut } = useAppContext();
  const { translate } = useI18n();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="shell-layout">
      <Sidebar currentUser={currentUser} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <button
        type="button"
        className={isSidebarOpen ? 'shell-overlay visible' : 'shell-overlay'}
        onClick={() => setIsSidebarOpen(false)}
        aria-label={translate('Close navigation')}
      />

      <div className="shell-main">
        <Topbar
          currentUser={currentUser}
          onToggleNavigation={() => setIsSidebarOpen((open) => !open)}
          onSignOut={() => {
            void signOut();
          }}
        />
        <main className="shell-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              className="route-frame"
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
