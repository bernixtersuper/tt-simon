'use client';

import { motion } from 'framer-motion';

export interface LbEntry {
  id: number;
  name: string;
  score: number;
  hardMode: boolean;
  createdAt: string | Date | null;
}

interface Props {
  entries: LbEntry[];
  highlightId?: number;
  title?: string;
}

const RANK_STYLE: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: '#eec416', bg: 'rgba(238,196,22,0.07)', border: 'rgba(238,196,22,0.25)' },
  2: { color: '#e2e8f0', bg: 'rgba(226,232,240,0.04)', border: 'rgba(226,232,240,0.15)' },
  3: { color: '#cd7f32', bg: 'rgba(205,127,50,0.05)', border: 'rgba(205,127,50,0.2)' },
};

function truncateName(name: string, max = 18): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

export default function Leaderboard({ entries, highlightId, title = 'Leaderboard' }: Props) {
  return (
    <div className="w-full">
      <h3
        className="text-xs uppercase tracking-widest text-[#555] mb-3"
        style={{ fontFamily: 'var(--font-syne)' }}
      >
        {title}
      </h3>

      {entries.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-6" style={{ fontFamily: 'var(--font-inter)' }}>
          Sé el primero en jugar
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isHighlighted = entry.id === highlightId;
            const rankStyle = RANK_STYLE[rank];

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={
                  isHighlighted
                    ? { background: 'rgba(238,196,22,0.09)', border: '1px solid rgba(238,196,22,0.35)' }
                    : rankStyle
                    ? { background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }
                    : { background: 'transparent', border: '1px solid transparent' }
                }
              >
                {/* Rank */}
                <span
                  className="text-xs w-6 text-right shrink-0"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 700,
                    color: isHighlighted ? '#eec416' : rankStyle?.color ?? '#444',
                  }}
                >
                  #{rank}
                </span>

                {/* Name */}
                <span
                  className="flex-1 text-sm truncate"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: isHighlighted ? '#fff' : rankStyle?.color ?? '#888',
                  }}
                >
                  {truncateName(entry.name)}
                </span>

                {/* Hard mode badge */}
                {entry.hardMode && (
                  <span className="text-xs shrink-0" title="Hard mode">⚡</span>
                )}

                {/* Score */}
                <span
                  className="text-sm font-bold shrink-0"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    color: isHighlighted ? '#eec416' : rankStyle?.color ?? '#555',
                  }}
                >
                  {entry.score}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
