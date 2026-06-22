'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main style={{ width: '100%', minHeight: '100vh' }} className="bg-white dark:bg-[#121214] relative overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="app-layout h-screen w-full bg-slate-50 dark:bg-[#121214] flex flex-col lg:flex-row overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="hidden lg:block w-px bg-slate-100 dark:bg-[#23232a] shrink-0" />
      {/* Explicit background color on main to prevent white flash during transition gap */}
      <main className="main-content flex-1 flex flex-col justify-between overflow-y-scroll p-6 lg:p-8 bg-slate-50 dark:bg-[#121214] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-1 flex flex-col justify-between"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
