import type { Metadata } from 'next';
import { Syne, Inter } from 'next/font/google';
import KeyboardHintsProvider from '@/components/KeyboardHintsProvider';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TT Simon — ITBA Future Day 2026',
  description: 'Probá tu memoria. El juego Simon de Tech Trek para el ITBA Future Day 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-[#0d0d0d] text-white antialiased">
        <KeyboardHintsProvider>
          {children}
        </KeyboardHintsProvider>
      </body>
    </html>
  );
}
