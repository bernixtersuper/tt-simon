'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useKeyboardHints } from './KeyboardHintsProvider';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { hints, toggle } = useKeyboardHints();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-md bg-gradient-to-r from-[#0d0d0d]/95 via-[#eec416]/[0.04] to-[#0d0d0d]/95'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logos/techtrek-logo-full.png"
            alt="Tech Trek"
            width={34}
            height={34}
            className="rounded-full"
          />
          <span
            className="font-bold text-white text-base tracking-tight"
            style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}
          >
            TT Simon
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            title={hints ? 'Ocultar teclas' : 'Mostrar teclas'}
            className="text-xs uppercase tracking-widest border px-3 py-1.5 rounded-full transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-inter)',
              color: hints ? '#eec416' : '#444',
              borderColor: hints ? 'rgba(238,196,22,0.4)' : '#1f1f1f',
            }}
          >
            ⌨ teclas
          </button>
          <a
            href="https://techtrek-web.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#666] hover:text-[#eec416] transition-colors duration-200 uppercase tracking-widest border border-[#1f1f1f] px-3 py-1.5 rounded-full hover:border-[#eec416]/40"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            techtrek.ar ↗
          </a>
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 h-px bg-[#eec416]"
        animate={{ width: scrolled ? '100%' : '0%', opacity: scrolled ? 0.3 : 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.nav>
  );
}
