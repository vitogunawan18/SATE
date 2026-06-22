'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;

interface UserProfile {
  userId: string;
  username: string;
  name: string;
  role: string;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'company'>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile name edit state
  const [fullNameInput, setFullNameInput] = useState('');
  const [profileNameLoading, setProfileNameLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Show/hide password
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Company settings form state
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [outletName, setOutletName] = useState('');
  const [compError, setCompError] = useState('');
  const [compSuccess, setCompSuccess] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);

  useEffect(() => {
    // Fetch user profile
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setFullNameInput(data.user.name || '');
        }
        else router.push('/login');
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    // Fetch company settings
    fetch('/api/settings/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCompanyName(data.data.company_name || '');
          setAddress(data.data.address || '');
          setPhone(data.data.phone || '');
          setEmail(data.data.email || '');
          setWebsite(data.data.website || '');
          setLogo(data.data.logo || '');
          setOutletName(data.data.outlet_name || 'Kantor Pusat');
        }
      })
      .catch(err => console.error('Error loading company settings:', err))
      .finally(() => setFetchingSettings(false));
  }, []);

  const handleUpdateProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullNameInput.trim()) {
      setProfileError('Nama lengkap wajib diisi');
      return;
    }

    setProfileNameLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullNameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui nama');
      
      setUser(data.user);
      setFullNameInput(data.user.name);
      setProfileSuccess('Nama lengkap berhasil diperbarui!');
      
      // Dispatch event to notify layout/sidebar
      window.dispatchEvent(new Event('user-profile-updated'));
      
      router.refresh();
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan nama');
    } finally {
      setProfileNameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) {
      setPwError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi password tidak cocok');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');
      setPwSuccess('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengubah password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompError('');
    setCompSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCompError('Ukuran file logo terlalu besar. Maksimal 10MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setCompError('Format file harus berupa gambar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Resize parameters (Max 400px width or height)
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setCompError('Gagal memproses gambar untuk kompresi.');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format with 0.8 quality
        try {
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
          setLogo(compressedDataUrl);
        } catch (err) {
          console.error('Failed to compress image:', err);
          setCompError('Gagal melakukan kompresi gambar.');
        }
      };
      img.onerror = () => {
        setCompError('Gagal memuat berkas gambar.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setCompError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError('');
    setCompSuccess('');

    if (!companyName.trim()) {
      setCompError('Nama perusahaan wajib diisi');
      return;
    }

    setCompLoading(true);
    try {
      const res = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          address,
          phone,
          email,
          website,
          logo,
          outlet_name: outletName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');
      setCompSuccess('Informasi perusahaan berhasil diperbarui!');
    } catch (err: unknown) {
      setCompError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setCompLoading(false);
    }
  };

  // Guard handled via AnimatePresence below
  
  const roleLabel = user?.role === 'admin' ? 'Admin / Pakar' : 'HR Manager';
  const roleColor = user?.role === 'admin' ? 'var(--color-accent-yellow)' : 'var(--color-accent-blue)';
  const initials = user?.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '';

  return (
    <div style={{ paddingBottom: '40px' }} className="min-h-full">
      <AnimatePresence mode="wait">
        {loading || !user ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ minHeight: '80vh' }}
            className="canvas-bg flex flex-col items-center justify-center gap-5"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-slate-700 dark:text-slate-200 text-sm font-bold tracking-wide uppercase">
                Memuat Profil Pengguna
              </p>
              <p className="text-slate-400 dark:text-[#7f8087] text-[11px] animate-pulse">
                Menghubungkan ke session server & memuat kredensial...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
      <style>{`
        .profile-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .profile-card {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline-strong);
          border-radius: 2rem; /* rounded-2rem */
          padding: 24px 20px;
        }
        @media (min-width: 640px) {
          .profile-card {
            padding: 32px;
          }
        }
        .profile-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-mute);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-field-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 14px 0;
          border-bottom: 1px solid var(--color-hairline-strong);
        }
        @media (min-width: 640px) {
          .profile-field-row {
            flex-direction: row;
            gap: 16px;
            align-items: flex-start;
          }
        }
        .profile-field-row:last-child { border-bottom: none; }
        .profile-field-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-mute);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          width: auto;
          flex-shrink: 0;
          padding-top: 2px;
        }
        .profile-field-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-ink);
          font-family: var(--font-sans), sans-serif;
        }
        .pw-input-wrapper {
          position: relative;
          width: 100%;
        }
        .pw-input-wrapper input {
          width: 100%;
          padding-right: 40px !important;
        }
        .pw-toggle-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-mute);
          display: flex;
          align-items: center;
          padding: 0;
        }
        .pw-toggle-btn:hover { color: var(--color-ink); }
        
        /* Tab Navigation Bar */
        .profile-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-hairline-strong);
          margin-bottom: 8px;
          gap: 8px;
        }
        .profile-tab-btn {
          background: transparent;
          border: none;
          color: var(--color-mute);
          font-size: 13.5px;
          font-weight: 600;
          padding: 16px 12px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          outline: none;
          font-family: var(--font-sans), sans-serif;
        }
        @media (min-width: 640px) {
          .profile-tab-btn {
            padding: 12px 16px;
          }
        }
        .profile-tab-btn:hover {
          color: var(--color-ink);
        }
        .profile-tab-btn.active {
          color: var(--color-primary-white);
          border-bottom-color: var(--color-primary-white);
        }
 
        /* Company tab grid layout */
        .company-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 640px) {
          .company-grid {
            grid-template-columns: 1fr 1fr;
          }
          .profile-field-label { width: 160px; }
        }

        /* Logo upload card */
        .logo-upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background-color: var(--color-surface-deep);
          border: 1px dashed var(--color-hairline-strong);
          border-radius: 16px; /* rounded-2xl */
          margin-bottom: 12px;
        }
        @media (min-width: 640px) {
          .logo-upload-container {
            flex-direction: row;
            align-items: flex-start;
          }
        }
        
        .logo-preview-box {
          width: 96px;
          height: 96px;
          border: 1px solid var(--color-hairline-strong);
          border-radius: 12px;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .logo-preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .textarea-input-editorial {
          background-color: var(--color-surface-card);
          color: var(--color-ink);
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 14px;
          border: 1px solid var(--color-hairline-strong);
          border-radius: 16px; /* rounded-2xl */
          padding: 10px 14px;
          min-height: 80px;
          outline: none;
          transition: border-color 0.15s ease;
          width: 100%;
          resize: vertical;
        }
        .textarea-input-editorial:focus {
          border-color: var(--color-primary-white);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
      `}</style>

      <div className="profile-container">

        {/* Header */}
        <motion.div variants={itemVariants} className="page-header-group">
          <div className="page-header-badge">PENGATURAN SISTEM</div>
          <div className="page-header-row">
            <div>
              <h1 className="page-header-title">Profil & Pengaturan</h1>
              <p className="page-header-subtitle">Kelola informasi akun pribadi dan identitas korporasi perusahaan.</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div variants={itemVariants} className="profile-tabs">
          <button
            className={`profile-tab-btn ${activeSubTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('profile')}
          >
            👤 Akun & Keamanan
          </button>
          <button
            className={`profile-tab-btn ${activeSubTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('company')}
          >
            🏢 Informasi Perusahaan
          </button>
        </motion.div>

        {/* TAB 1: USER PROFILE & PASSWORD */}
        {activeSubTab === 'profile' && (
          <>
            {/* Profile Info */}
            <div className="profile-card">
              <div className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Informasi Akun
              </div>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--color-hairline)' }}>
                <div style={{
                  width: '72px', height: '72px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-accent-blue-glow)',
                  border: '2px solid var(--color-accent-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 800, color: 'var(--color-accent-blue)',
                  letterSpacing: '-0.02em', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: roleColor, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleLabel}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-mute)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>@{user.username}</div>
                </div>
              </div>

              {/* Fields */}
              <div>
                <form onSubmit={handleUpdateProfileName} className="profile-field-row" style={{ width: '100%' }}>
                  <span className="profile-field-label" style={{ paddingTop: '10px' }}>Nama Lengkap</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="text-input-editorial"
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          setProfileSuccess('');
                          setProfileError('');
                        }}
                        placeholder="Nama Lengkap HRD"
                        style={{ flex: 1, fontSize: '13px', height: '40px' }}
                      />
                      <button
                        type="submit"
                        disabled={profileNameLoading || !fullNameInput.trim() || fullNameInput.trim() === user.name}
                        className="btn-primary-editorial touch-target-mobile"
                        style={{ height: '40px', padding: '0 16px', fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', opacity: (profileNameLoading || !fullNameInput.trim() || fullNameInput.trim() === user.name) ? 0.6 : 1 }}
                      >
                        {profileNameLoading ? 'Menyimpan...' : 'Simpan Nama'}
                      </button>
                    </div>
                    {profileSuccess && (
                      <p style={{ color: 'var(--color-accent-green)', fontSize: '11px', margin: '2px 0 0' }}>✓ {profileSuccess}</p>
                    )}
                    {profileError && (
                      <p style={{ color: 'var(--color-accent-red)', fontSize: '11px', margin: '2px 0 0' }}>⚠ {profileError}</p>
                    )}
                  </div>
                </form>
                <div className="profile-field-row">
                  <span className="profile-field-label">Username</span>
                  <span className="profile-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{user.username}</span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Role / Hak Akses</span>
                  <span className="profile-field-value">
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', backgroundColor: user.role === 'admin' ? 'rgba(255,197,61,0.1)' : 'rgba(59,158,255,0.1)', color: roleColor, border: `1px solid ${roleColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {roleLabel}
                    </span>
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">ID Pengguna</span>
                  <span className="profile-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-mute)' }}>{user.userId}</span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-card">
              <div className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Keamanan — Ganti Password
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pwSuccess && (
                  <div style={{ backgroundColor: 'rgba(17,255,153,0.06)', border: '1px solid rgba(17,255,153,0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {pwSuccess}
                  </div>
                )}

                {pwError && (
                  <div style={{ backgroundColor: 'var(--color-accent-red-glow)', border: '1px solid rgba(255,32,71,0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'var(--color-accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {pwError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>PASSWORD LAMA</label>
                  <div className="pw-input-wrapper">
                    <input
                      type={showOld ? 'text' : 'password'}
                      className="text-input-editorial"
                      placeholder="Password saat ini"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                    <button type="button" className="pw-toggle-btn" onClick={() => setShowOld(!showOld)}>
                      <EyeIcon open={showOld} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>PASSWORD BARU</label>
                  <div className="pw-input-wrapper">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="text-input-editorial"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                    <button type="button" className="pw-toggle-btn" onClick={() => setShowNew(!showNew)}>
                      <EyeIcon open={showNew} />
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-accent-red)' }}>⚠ Password minimal 6 karakter</p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>KONFIRMASI PASSWORD BARU</label>
                  <div className="pw-input-wrapper">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="text-input-editorial"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                    <button type="button" className="pw-toggle-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-accent-red)' }}>⚠ Password tidak cocok</p>
                  )}
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="submit"
                    className="btn-primary-editorial touch-target-mobile"
                    disabled={pwLoading}
                    style={{ height: '44px', padding: '0 28px', fontWeight: 600, fontSize: '13px', opacity: pwLoading ? 0.7 : 1 }}
                  >
                    {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* TAB 2: COMPANY INFORMATION SETTINGS */}
        {activeSubTab === 'company' && (
          <div className="profile-card">
            <div className="profile-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M5 21V7M19 21V7M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
              </svg>
              Identitas & Informasi Perusahaan
            </div>

            {fetchingSettings ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 bg-transparent">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-slate-400 dark:text-[#7f8087] text-[11px] animate-pulse">
                  Memuat data profil perusahaan...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {compSuccess && (
                  <div style={{ backgroundColor: 'rgba(17,255,153,0.06)', border: '1px solid rgba(17,255,153,0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {compSuccess}
                  </div>
                )}

                {compError && (
                  <div style={{ backgroundColor: 'var(--color-accent-red-glow)', border: '1px solid rgba(255,32,71,0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'var(--color-accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {compError}
                  </div>
                )}

                {/* Logo Uploader */}
                <div>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)', display: 'block', marginBottom: '8px' }}>
                    LOGO PERUSAHAAN
                  </label>
                  <div className="logo-upload-container">
                    <div className="logo-preview-box">
                      {logo ? (
                        <img src={logo} alt="Company Logo" className="logo-preview-img" />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-mute)' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5 }}>
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          <span style={{ fontSize: '9px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DEFAULT</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, width: '100%' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                          accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn-outline-editorial touch-target-mobile"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ height: '44px', fontSize: '12.5px', padding: '0 14px' }}
                        >
                          Choose Logo File
                        </button>
                        {logo && (
                          <button
                            type="button"
                            className="btn-ghost-editorial touch-target-mobile"
                            onClick={handleRemoveLogo}
                            style={{ height: '44px', fontSize: '12.5px', padding: '0 14px', color: 'var(--color-accent-red)', borderColor: 'rgba(255, 32, 71, 0.15)' }}
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      <p className="caption-editorial" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
                        Unggah berkas PNG, JPG, JPEG, atau SVG (Maks. 10 MB). Gambar akan otomatis dikompresi ke format WebP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>NAMA PERUSAHAAN *</label>
                  <input
                    type="text"
                    className="text-input-editorial"
                    placeholder="Contoh: PT Sinar Agung Terang F&B"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                    style={{ fontSize: '13px' }}
                  />
                </div>

                {/* Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>ALAMAT PERUSAHAAN</label>
                  <textarea
                    className="textarea-input-editorial"
                    placeholder="Contoh: Gedung Sinar Agung, Lantai 5, Jl. H.R. Rasuna Said Kav. B-10, Jakarta Selatan 12920"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                {/* Grid for details */}
                <div className="company-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>NOMOR TELEPON</label>
                    <input
                      type="text"
                      className="text-input-editorial"
                      placeholder="Contoh: (021) 520-4567"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>EMAIL PERUSAHAAN</label>
                    <input
                      type="email"
                      className="text-input-editorial"
                      placeholder="Contoh: hr@sinaragungterang.co.id"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Website */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>WEBSITE PERUSAHAAN</label>
                  <input
                    type="text"
                    className="text-input-editorial"
                    placeholder="Contoh: www.sinaragungterang.co.id"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                {/* Outlet / Cabang */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>OUTLET / CABANG UTAMA *</label>
                  <input
                    type="text"
                    className="text-input-editorial"
                    placeholder="Contoh: Kantor Pusat / Outlet Dago"
                    value={outletName}
                    onChange={e => setOutletName(e.target.value)}
                    required
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="submit"
                    className="btn-primary-editorial touch-target-mobile"
                    disabled={compLoading}
                    style={{ height: '44px', padding: '0 28px', fontWeight: 600, fontSize: '13px', opacity: compLoading ? 0.7 : 1 }}
                  >
                    {compLoading ? 'Menyimpan...' : 'Simpan Informasi Perusahaan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
