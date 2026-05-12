import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isExpired = new URLSearchParams(window.location.search).get('reason') === 'expired';

  useEffect(() => {
    // Clear any stale tokens on login page load
    // This prevents "session expired" on fresh visits
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (!reason) {
      // Only clear if NOT redirected here due to actual expiry
      localStorage.removeItem('amadeus_access_token');
      localStorage.removeItem('amadeus_refresh_token');
      localStorage.removeItem('selectedTrainId');
    }
  }, []);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 48px',
        width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #1677ff, #0050b3)',
            display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 12,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>E</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>
            AMADEUS ELEVATE
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            SAFe Train Manager
          </div>
        </div>

        {isExpired && (
          <div style={{
            background: '#fff7ed', border: '1px solid #fed7aa',
            borderRadius: 8, padding: '10px 14px',
            color: '#c2410c', fontSize: 13, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⏱ Your session expired. Please sign in again.
          </div>
        )}

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151',
            display: 'block', marginBottom: 6 }}>
            USERNAME
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter username"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151',
            display: 'block', marginBottom: 6 }}>
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter password"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px',
            color: '#dc2626', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', borderRadius: 8,
            background: loading ? '#93c5fd' : '#1677ff',
            color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'background .2s',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24,
          fontSize: 12, color: '#9ca3af' }}>
          © 2026 Amadeus IT Group
        </div>
      </div>
    </div>
  );
}
