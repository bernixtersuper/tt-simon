'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const EVENTS = [
  {
    num: '01',
    tag: 'Evento Principal',
    name: 'TT Hub',
    desc: 'Más de 350 estudiantes, empresas líderes y emprendedores en un mismo lugar.',
    date: 'Agosto 2026',
    img: '/images/hub/alumnosenelhub25.JPG',
    href: 'https://techtrek-web.vercel.app/events/hub',
  },
  {
    num: '02',
    tag: 'Visitas a Empresas',
    name: 'TT Visits',
    desc: 'Visitamos las oficinas de empresas sponsor para conocerlas por dentro.',
    date: 'A lo largo del año',
    img: '/images/events/visits/complif/audiencia-speaker.jpg',
    href: 'https://techtrek-web.vercel.app/events/visits',
  },
  {
    num: '03',
    tag: 'Serie de Charlas',
    name: 'TT Talks',
    desc: 'Charlas íntimas con emprendedores reales. Hernán Kazah, Nico Varrone y más.',
    date: 'A lo largo del año',
    img: '/images/talks/hernankazah1.jpg',
    href: 'https://techtrek-web.vercel.app/events/talks',
  },
];

export default function TTEvents() {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="mb-1">
        <p
          className="text-[#eec416] text-[10px] uppercase tracking-[0.25em] mb-1"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Lo que hacemos
        </p>
        <h2
          className="text-white uppercase leading-none"
          style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' }}
        >
          Nuestros<br />
          <span className="text-[#eec416]">eventos</span>
        </h2>
      </div>

      {/* Event cards */}
      {EVENTS.map((ev, i) => (
        <motion.a
          key={ev.num}
          href={ev.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          whileHover={{ y: -2 }}
          className="group relative rounded-xl overflow-hidden cursor-pointer block"
          style={{ border: '1px solid #1f1f1f' }}
        >
          {/* Image */}
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={ev.img}
              alt={ev.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="256px"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent" />
            {/* Gold hover tint */}
            <div className="absolute inset-0 bg-[#eec416]/0 group-hover:bg-[#eec416]/[0.05] transition-colors duration-300" />
          </div>

          {/* Content over image bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-end justify-between mb-0.5">
              <span
                className="text-[8px] uppercase tracking-[0.15em] bg-[#eec416]/15 text-[#eec416] border border-[#eec416]/30 rounded-full px-1.5 py-0.5 font-semibold leading-none"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {ev.tag}
              </span>
              <span
                className="text-[#eec416]/20 leading-none select-none group-hover:text-[#eec416]/35 transition-colors duration-300"
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}
              >
                {ev.num}
              </span>
            </div>
            <h3
              className="text-white uppercase leading-none text-sm tracking-tight"
              style={{ fontFamily: 'var(--font-syne)', fontWeight: 800 }}
            >
              {ev.name}
            </h3>
            <p
              className="text-[#777] text-[11px] mt-1 leading-snug line-clamp-2"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {ev.desc}
            </p>
          </div>

          {/* Gold border on hover */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ border: '1px solid rgba(238,196,22,0.35)' }}
          />
        </motion.a>
      ))}

      {/* Link to TT site */}
      <a
        href="https://techtrek-web.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-[#555] hover:text-[#eec416] transition-colors duration-200 text-[11px] uppercase tracking-widest pt-1"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Ver todo en techtrek.ar
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
