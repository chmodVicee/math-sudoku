import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setError('');
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username.trim())) {
      setError('El usuario debe tener entre 3 y 30 caracteres: letras, números o guion bajo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      await register({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="auth-kicker">Crear cuenta</span>
        <h2>Empieza tu partida</h2>
        <p className="auth-subtitle">Guarda tu progreso y compite contra tu propio récord.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Usuario</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="tu_usuario"
              required
              autoFocus
            />
            <small>De 3 a 30 caracteres. Letras, números y guion bajo.</small>
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>

          <label className="field">
            <span>Repite la contraseña</span>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta y jugar'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
