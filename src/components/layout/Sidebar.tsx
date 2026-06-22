'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, LogOut, Menu, X, Sun, Moon, Monitor, Plus,
  LayoutDashboard, ClipboardList, FileText, Database, User, ShieldAlert, BookOpen
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/evaluasi', label: 'Evaluasi Penempatan', icon: ClipboardList },
  { href: '/hasil', label: 'Hasil Evaluasi', icon: FileText },
  { href: '/knowledge-base', label: 'Basis Pengetahuan', icon: Database },
  { href: '/profile', label: 'Profil Saya', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<{ name: string; username: string; role: string } | null>(null);

  // Refs for closing on click outside
  const profileRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  // Load user details
  useEffect(() => {
    const fetchUser = () => {
      fetch('/api/auth/me')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          if (data.success) {
            setUser(data.user);
          }
        })
        .catch(() => {
          setUser(null);
        });
    };

    fetchUser();
    window.addEventListener('user-profile-updated', fetchUser);
    return () => window.removeEventListener('user-profile-updated', fetchUser);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex w-full lg:w-64 flex-col justify-between shrink-0 no-print p-6 lg:py-8 lg:px-6 bg-white dark:bg-[#121214]">
        <div className="flex flex-col">
          {/* Top Row: Logo & Notifications */}
          <div className="flex items-center mb-8">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight font-sans">
                S<span className="text-cyan-500">A</span>T<span className="text-cyan-500">E</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mt-2 animate-pulse"></span>
            </Link>
          </div>

          {/* Main Navigation Menu */}
          <nav className="space-y-3">
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-medium ${
                      isActive
                        ? 'text-cyan-600 bg-cyan-50/80 dark:bg-cyan-950/20 dark:text-cyan-400 font-semibold shadow-sm shadow-cyan-500/5'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active-indicator"
                        className="ml-auto w-1 h-4 rounded-full bg-cyan-500"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel: Utilities & User Profile */}
        <div className="mt-8 space-y-6">
          {/* Quick CTA Button: Mulai Evaluasi */}
          <Link href="/evaluasi" className="block w-full">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all duration-200 text-sm"
            >
              Mulai Evaluasi
              <Plus className="w-4 h-4" />
            </motion.button>
          </Link>

          {/* Theme Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 gap-1">
            {[
              { key: 'light', icon: Sun },
              { key: 'dark', icon: Moon },
              { key: 'system', icon: Monitor }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key as any)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-white dark:bg-[#121214] text-cyan-500 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={`Tema: ${t.key}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 cursor-pointer relative" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-sm border-2 border-slate-100 dark:border-slate-800 shadow-md">
                {user ? getInitials(user.name) : 'HR'}
              </div>
              <div className="leading-tight">
                <p className="font-bold text-slate-800 dark:text-white text-xs">{user ? user.name : 'HR Manager'}</p>
                <p className="text-[10px] text-slate-400">@{user ? user.username : 'hr_user'}</p>
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE HEADER BAR ================= */}
      <div className="lg:hidden w-full flex items-center justify-between py-4 px-4 border-b border-slate-100 dark:border-[#23232a] bg-white dark:bg-[#121214] no-print">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">SATE</span>
          <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1"></span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ================= MOBILE COLLAPSED SLIDING DRAWER ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] no-print">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 w-72 h-full bg-white dark:bg-[#121214] border-l border-slate-100 dark:border-[#23232a] p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header inside drawer */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-[#23232a]">
                  <span className="text-xl font-bold font-sans tracking-tight flex items-center text-slate-800 dark:text-white">
                    S<span className="text-cyan-500">A</span>T<span className="text-cyan-500">E</span>
                  </span>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col gap-3">
                  {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-cyan-50/80 text-cyan-600 dark:bg-cyan-950/20 dark:text-cyan-400 font-semibold'
                              : 'text-[#9ca3af] hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Quick Action */}
                <div className="mt-6">
                  <Link href="/evaluasi" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
                    >
                      Mulai Evaluasi
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>

                {/* Theme Selector Toggle */}
                <div className="mt-8">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tema Aplikasi</p>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 gap-1">
                    {[
                      { key: 'light', label: 'Terang', icon: Sun },
                      { key: 'dark', label: 'Gelap', icon: Moon },
                      { key: 'system', label: 'Sistem', icon: Monitor }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = theme === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setTheme(t.key as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                            isSelected 
                              ? 'bg-white dark:bg-[#121214] text-cyan-500 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Profile info & logout at bottom */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="border-t border-slate-100 dark:border-[#23232a] pt-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-100 dark:border-slate-800">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{user.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                        {user.role === 'admin' ? 'Admin / Pakar' : 'HR Manager'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-xl font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-transparent hover:border-red-500/25 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
