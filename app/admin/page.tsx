'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setError('Mot de passe incorrect');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="arabic-text text-4xl font-bold text-amber-400 mb-2">مشرب صافي</h1>
          <p className="text-emerald-300 text-sm">Espace Administration</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.2)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-white font-bold text-xl mb-6 text-center">Connexion</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-emerald-300 text-sm mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-400"
                style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: loading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #047857)', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-emerald-400/60 text-sm hover:text-emerald-300 transition-colors">← Retour au site</a>
        </div>
      </div>
    </main>
  );
}
