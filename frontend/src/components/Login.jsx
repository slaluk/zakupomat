import { useState } from 'react';
import { login } from '../api/client';

export function Login({ onLogin }) {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await login(accessKey.trim());
      if (result.success) {
        onLogin(result.household_name);
      } else {
        setError('Nieprawidlowy klucz dostepu');
      }
    } catch (err) {
      setError('Blad polaczenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Zakupomat</h1>
        {error && <div className="login-error">{error}</div>}
        <input
          type="text"
          placeholder="Klucz dostepu"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>
    </div>
  );
}
