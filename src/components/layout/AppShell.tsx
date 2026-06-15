'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/auth-actions';

export default function AppShell({ children, userName }: { children: React.ReactNode, userName?: string | null }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/app', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Historial', href: '/app/history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Nuevo', href: '/app/new', icon: 'M12 4v16m8-8H4' },
    { name: 'Billeteras', href: '/app/accounts', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Categorías', href: '/app/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { name: 'Metas', href: '/app/goals', icon: 'M12 22a10 10 0 110-20 10 10 0 010 20z M12 16a4 4 0 110-8 4 4 0 010 8z' },
    { name: 'Chat', href: '/app/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  const currentDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="flex h-screen bg-warm-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-soft-gray bg-white">
        <div className="p-6">
          {/* Nexum Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-graphite-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">N</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-graphite-blue">Nexum</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-soft-gray text-graphite-blue'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-graphite-blue'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-soft-gray">
          <form action={logout}>
            <button className="flex w-full items-center gap-3 px-3 py-2 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="px-6 py-6 md:py-8">
          <p className="text-sm text-gray-500 font-medium mb-1">{capitalize(currentDate)}</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-graphite-blue">
            Hola{userName ? `, ${userName}` : ', te damos la bienvenida'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-soft-gray flex justify-around p-3 z-50">
          {navItems.filter(item => item.name !== 'Categorías' && item.name !== 'Metas').map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 ${
                  isActive ? 'text-graphite-blue' : 'text-gray-400'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                </svg>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
