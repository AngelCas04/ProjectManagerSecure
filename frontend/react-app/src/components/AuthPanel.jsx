import { useMemo, useState } from 'react';
import { sanitizePlainText, validateCredentials } from '../utils/security';

const initialState = {
  name: '',
  email: '',
  password: ''
};

export function AuthPanel() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateCredentials(form), [form]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'password' ? value.trim() : sanitizePlainText(value)
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Autenticacion</p>
          <h3>{mode === 'login' ? 'Acceso seguro' : 'Registro controlado'}</h3>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'register' : 'login'));
            setSubmitted(false);
          }}
        >
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo acceso'}
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Nombre completo
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              maxLength="60"
              required
            />
          </label>
        )}

        <label>
          Correo corporativo
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="username"
            inputMode="email"
            required
          />
          {submitted && errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>

        <label>
          Contrasena
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength="12"
            required
          />
          {submitted && errors.password ? <span className="field-error">{errors.password}</span> : null}
        </label>

        <button type="submit" className="primary-button">
          {mode === 'login' ? 'Iniciar sesion' : 'Solicitar alta'}
        </button>
      </form>

      <div className="security-strip">
        <span>JWT de corta vida</span>
        <span>Refresh tokens</span>
        <span>Cookies HttpOnly</span>
      </div>
    </section>
  );
}
