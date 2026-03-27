import { AnimatePresence, motion } from 'framer-motion';

const HELP_ITEMS = [
  {
    question: 'Que puedo hacer en esta aplicacion?',
    answer: 'Puedes organizar proyectos, mover tareas en el tablero, coordinar fechas clave y conversar con tu equipo desde un solo lugar.'
  },
  {
    question: 'Como creo mi cuenta?',
    answer: 'Ve a "Crear cuenta", completa tu nombre, equipo, correo y contrasena. Despues entraras a tu espacio para empezar a colaborar.'
  },
  {
    question: 'Como recupero mi contrasena?',
    answer: 'Usa el boton de recuperacion, escribe tu correo y la palabra que guardaste al registrarte. Despues recibiras un enlace para crear una nueva contrasena.'
  },
  {
    question: 'Que es un equipo?',
    answer: 'Es el grupo de trabajo con el que compartes proyectos, mensajes y responsabilidades dentro del espacio.'
  },
  {
    question: 'Donde veo lo mas importante del dia?',
    answer: 'En la vista principal encontraras pendientes cercanos, actividad reciente, proyectos activos y proximos eventos.'
  },
  {
    question: 'Como hablo con mi equipo?',
    answer: 'Usa la seccion de mensajes para conversar en salas vinculadas a tu equipo y a los proyectos en los que participas.'
  },
  {
    question: 'Puedo probar la app antes de registrarme?',
    answer: 'Si. En el acceso principal puedes entrar con la cuenta de demostracion para conocer la experiencia completa.'
  }
];

export function AuthHelpDrawer({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="auth-help-backdrop"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="auth-help-drawer"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 36 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="auth-help-head">
              <div>
                <p className="eyebrow">Centro de ayuda</p>
                <h3>Preguntas frecuentes</h3>
              </div>
              <button type="button" className="ghost-button" onClick={onClose}>
                Cerrar
              </button>
            </div>

            <div className="auth-help-list">
              {HELP_ITEMS.map((item) => (
                <article key={item.question} className="auth-help-card">
                  <h4>{item.question}</h4>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
