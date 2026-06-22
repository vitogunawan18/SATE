'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal. Coba lagi.');
      }

      // Redirect to original destination or dashboard
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }} className="canvas-bg glow-blue-wash">
      {/* Decorative Blur Orbs */}
      <motion.div 
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-accent-blue-glow)',
          filter: 'blur(80px)',
          top: '10%',
          left: '10%',
          zIndex: 0,
          opacity: 0.8
        }} 
      />
      <motion.div 
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-accent-green-glow)',
          filter: 'blur(80px)',
          bottom: '10%',
          right: '10%',
          zIndex: 0,
          opacity: 0.6
        }} 
      />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="elevation-card" 
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px 28px',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'var(--color-surface-card)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Branding header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            border: '1.5px solid var(--color-accent-blue)',
            backgroundColor: 'var(--color-accent-blue-glow)',
            marginBottom: '16px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="var(--color-accent-blue)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="page-header-title" style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>SATE</h1>
          <p className="caption-editorial" style={{ color: 'var(--color-mute)', marginTop: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Smart Assessment & Placement
          </p>
        </motion.div>

        {/* Login form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                backgroundColor: 'var(--color-accent-red-glow)',
                border: '1px solid rgba(220, 38, 38, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--color-accent-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflow: 'hidden'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <label htmlFor="username" className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
              USERNAME
            </label>
            <input
              id="username"
              type="text"
              className="text-input-editorial"
              placeholder="Masukkan username (cth: hrd)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
              style={{ fontSize: '13px' }}
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <label htmlFor="password" className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              className="text-input-editorial"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              style={{ fontSize: '13px' }}
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-primary-editorial touch-target-mobile"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              marginTop: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="spinner-loader">
                  <path d="M21 12a9 9 0 01-9 9m-9-9a9 9 0 019-9" />
                </svg>
                <span>MEMVERIFIKASI...</span>
              </>
            ) : (
              <span>MASUK KE SISTEM</span>
            )}
          </motion.button>
        </form>

        {/* Demo credentials hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            borderTop: '1px dashed var(--color-hairline-strong)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <span className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-mute)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Kredensial Demo (Pakar & HRD):
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}>
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: 'var(--color-accent-blue-glow)' }}
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--color-hairline)',
                cursor: 'pointer'
              }}
              onClick={() => { setUsername('hrd'); setPassword('hrdpassword'); }}
            >
              <p style={{ fontWeight: 600, margin: 0, color: 'var(--color-ink)' }}>HR Manager</p>
              <p style={{ margin: '2px 0 0', color: 'var(--color-mute)', fontSize: '10px' }}>user: hrd</p>
              <p style={{ margin: 0, color: 'var(--color-mute)', fontSize: '10px' }}>pass: hrdpassword</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: 'var(--color-accent-blue-glow)' }}
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--color-hairline)',
                cursor: 'pointer'
              }}
              onClick={() => { setUsername('admin'); setPassword('adminpassword'); }}
            >
              <p style={{ fontWeight: 600, margin: 0, color: 'var(--color-ink)' }}>Admin/Pakar</p>
              <p style={{ margin: '2px 0 0', color: 'var(--color-mute)', fontSize: '10px' }}>user: admin</p>
              <p style={{ margin: 0, color: 'var(--color-mute)', fontSize: '10px' }}>pass: adminpassword</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-loader {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="canvas-bg">
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-mute)', fontSize: '13px' }}>LOADING...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
