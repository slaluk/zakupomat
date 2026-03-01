import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login } from '../api/client';

export function Register({ onLogin }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await register(name.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Blad podczas tworzenia rodziny');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = result
    ? `${window.location.origin}/?key=${encodeURIComponent(result.access_key)}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the input
      const input = document.querySelector('.share-link-input');
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
      }
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Zakupomat',
        text: `Dolacz do rodziny "${result.household_name}" w Zakupomat`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share failed - ignore
    }
  };

  const handleGoToApp = async () => {
    if (onLogin) {
      try {
        const loginResult = await login(result.access_key);
        if (loginResult.success) {
          onLogin(loginResult.household_name);
          navigate('/');
        }
      } catch {
        // Fallback: navigate with key param
        window.location.href = shareUrl;
      }
    } else {
      navigate('/');
    }
  };

  if (result) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Rodzina utworzona!</h1>
          <p style={{ marginBottom: 16, color: 'var(--gray-600)' }}>
            {result.household_name}
          </p>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
            Udostepnij ten link rodzinie, zeby mogli korzystac z aplikacji:
          </p>
          <div className="share-link-container">
            <input
              className="share-link-input"
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <button
              className="btn btn-primary btn-small share-link-copy"
              onClick={handleCopy}
            >
              {copied ? 'Skopiowano!' : 'Kopiuj'}
            </button>
          </div>
          {navigator.share && (
            <button
              className="btn btn-secondary"
              onClick={handleShare}
              style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" />
                <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" />
                <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" />
                <path d="M8.59 13.51L15.42 17.49" />
                <path d="M15.41 6.51L8.59 10.49" />
              </svg>
              Udostepnij
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleGoToApp}
            style={{ marginTop: 16 }}
          >
            {onLogin ? 'Przejdz do aplikacji' : 'Wroc do listy zakupow'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Zakupomat</h1>
        <p style={{ marginBottom: 16, color: 'var(--gray-500)', fontSize: 14 }}>
          Utworz nowa rodzine, zeby zaczac korzystac z aplikacji
        </p>
        {error && <div className="login-error">{error}</div>}
        <input
          type="text"
          placeholder="Nazwa rodziny"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Tworzenie...' : 'Utworz rodzine'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <a href="/" style={{ color: 'var(--primary)' }}>
            Masz juz dostep? Zaloguj sie
          </a>
        </p>
      </form>
    </div>
  );
}
