'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BUTTONS, ButtonId, BUTTON_STYLE, SHOWING_MESSAGES,
  getSpeed, playButton, playError, randomButton, SPEED_B,
} from '@/lib/simon';
import Leaderboard, { LbEntry } from './Leaderboard';
import TTEvents from './TTEvents';
import { useKeyboardHints } from './KeyboardHintsProvider';

type Phase = 'idle' | 'showing' | 'player' | 'gameover';

interface GameOverData {
  id: number;
  position: number;
  entries: LbEntry[];
}

interface Props {
  initialLeaderboard: LbEntry[];
}

const PODIUM: Record<number, { emoji: string; color: string; bg: string; border: string; msg: (n: string) => string; sub: string }> = {
  1: {
    emoji: '🥇',
    color: '#eec416',
    bg: 'rgba(238,196,22,0.08)',
    border: 'rgba(238,196,22,0.3)',
    msg: n => `¡${n} se adelanta y roba el primer puesto!`,
    sub: 'Sos el rey del tablero 👑',
  },
  2: {
    emoji: '🥈',
    color: '#e2e8f0',
    bg: 'rgba(226,232,240,0.05)',
    border: 'rgba(226,232,240,0.18)',
    msg: n => `¡${n} entra al podio en segundo lugar!`,
    sub: 'Muy cerca del número uno 🔥',
  },
  3: {
    emoji: '🥉',
    color: '#cd7f32',
    bg: 'rgba(205,127,50,0.06)',
    border: 'rgba(205,127,50,0.22)',
    msg: n => `¡${n} completa el podio!`,
    sub: 'Top 3, impresionante 💪',
  },
};

export default function SimonGame({ initialLeaderboard }: Props) {
  const { hints, hardMode } = useKeyboardHints();
  // ── Visual state ──────────────────────────────────────────────────────────
  const [phase, _setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [litButton, setLitButton] = useState<ButtonId | null>(null);
  const [timerProgress, setTimerProgress] = useState(1);
  const [currentMessage, setCurrentMessage] = useState('');
  const [centerText, setCenterText] = useState('');
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [lbEntries, setLbEntries] = useState<LbEntry[]>(initialLeaderboard);

  // ── Form state ────────────────────────────────────────────────────────────
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [nameError, setNameError] = useState('');

  // ── Game refs (stable across renders, readable in async context) ──────────
  const phaseRef = useRef<Phase>('idle');
  const cancelToken = useRef({ cancelled: false });
  const inputResolverRef = useRef<((v: ButtonId | 'timeout') => void) | null>(null);
  const inputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const litGenRef = useRef(0);
  const playerNameRef = useRef('');
  const playerEmailRef = useRef('');
  const scoreRef = useRef(0);

  function setPhase(p: Phase) {
    phaseRef.current = p;
    _setPhase(p);
  }

  // ── Leaderboard polling ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchLb = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLbEntries(data.entries);
        }
      } catch { /* ignore */ }
    };
    const id = setInterval(fetchLb, 15000);
    return () => clearInterval(id);
  }, []);

  // ── Visual timer ──────────────────────────────────────────────────────────
  function startVisualTimer(durationMs: number) {
    if (visualTimerRef.current) clearInterval(visualTimerRef.current);
    const start = Date.now();
    setTimerProgress(1);
    visualTimerRef.current = setInterval(() => {
      const p = Math.max(0, 1 - (Date.now() - start) / durationMs);
      setTimerProgress(p);
      if (p <= 0) {
        clearInterval(visualTimerRef.current!);
        visualTimerRef.current = null;
      }
    }, 40);
  }

  function stopVisualTimer() {
    if (visualTimerRef.current) {
      clearInterval(visualTimerRef.current);
      visualTimerRef.current = null;
    }
    setTimerProgress(1);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  function awaitInput(timeoutMs: number): Promise<ButtonId | 'timeout'> {
    return new Promise(resolve => {
      inputResolverRef.current = resolve;
      if (inputTimerRef.current) clearTimeout(inputTimerRef.current);
      inputTimerRef.current = setTimeout(() => {
        if (inputResolverRef.current === resolve) {
          inputResolverRef.current = null;
          resolve('timeout');
        }
      }, timeoutMs);
    });
  }

  const KEY_MAP: Record<string, ButtonId> = {
    q: 'green', e: 'red', a: 'yellow', d: 'blue',
  };

  const BUTTON_KEYS: Record<ButtonId, string> = {
    green: 'Q', red: 'E', yellow: 'A', blue: 'D',
  };

  function handlePress(id: ButtonId) {
    if (phaseRef.current !== 'player') return;
    const resolve = inputResolverRef.current;
    if (!resolve) return;
    inputResolverRef.current = null;
    if (inputTimerRef.current) { clearTimeout(inputTimerRef.current); inputTimerRef.current = null; }
    resolve(id);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const id = KEY_MAP[e.key.toLowerCase()];
      if (id) handlePress(id);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function cancelInput() {
    if (inputResolverRef.current) { inputResolverRef.current('timeout'); inputResolverRef.current = null; }
    if (inputTimerRef.current) { clearTimeout(inputTimerRef.current); inputTimerRef.current = null; }
    stopVisualTimer();
  }

  // ── Score submit ──────────────────────────────────────────────────────────
  async function submitScore(name: string, email: string, finalScore: number, isHardMode: boolean) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, score: finalScore, hardMode: isHardMode }),
      });
      const data = await res.json();
      const entries: LbEntry[] = Array.isArray(data.entries) ? data.entries : lbEntries;
      if (Array.isArray(data.entries)) setLbEntries(data.entries);
      setGameOverData({ id: data.id ?? -1, position: data.position ?? -1, entries });
    } catch {
      setGameOverData({ id: -1, position: -1, entries: lbEntries });
    }
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  async function gameLoop(token: { cancelled: boolean }) {
    const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    let seq: ButtonId[] = [];
    let currentScore = 0;

    while (!token.cancelled) {
      seq = [...seq, randomButton()];

      // Show sequence — increment gen to invalidate any pending player-phase clear
      setPhase('showing');
      litGenRef.current++;
      setCurrentMessage(SHOWING_MESSAGES[Math.floor(Math.random() * SHOWING_MESSAGES.length)]);

      const speed = hardMode ? SPEED_B : getSpeed(currentScore);
      await delay(480);
      if (token.cancelled) return;

      for (const btn of seq) {
        if (token.cancelled) return;
        setLitButton(btn);
        playButton(btn, speed.flashMs);
        await delay(speed.flashMs);
        if (token.cancelled) return;
        setLitButton(null);
        await delay(speed.gapMs);
      }
      if (token.cancelled) return;

      // Player's turn
      setPhase('player');
      let roundOk = true;

      for (let i = 0; i < seq.length; i++) {
        if (token.cancelled) return;

        startVisualTimer(speed.timerMs);
        const input = await awaitInput(speed.timerMs);
        stopVisualTimer();

        if (token.cancelled) return;
        if (input === 'timeout') { roundOk = false; break; }

        // Non-blocking feedback: light up and schedule clear via setTimeout.
        // Gen prevents a stale clear from a previous press from wiping the new button.
        // setLitButton('x') and the setTimeout run after await yields, so React renders
        // the lit state before the next iteration's awaitInput yields again.
        const pressDuration = Math.min(speed.flashMs, 200);
        const gen = ++litGenRef.current;
        setLitButton(input as ButtonId);
        playButton(input as ButtonId, pressDuration);
        setTimeout(() => { if (litGenRef.current === gen) setLitButton(null); }, pressDuration);

        if (input !== seq[i]) {
          await delay(pressDuration);
          roundOk = false;
          break;
        }
        // No await — immediately open window for next button
      }

      if (token.cancelled) return;

      if (!roundOk) {
        playError();
        setLitButton(null);
        setPhase('gameover');
        await submitScore(playerNameRef.current, playerEmailRef.current, currentScore, hardMode);
        return;
      }

      // Round complete
      currentScore++;
      scoreRef.current = currentScore;
      setScore(currentScore);
      setCenterText('✓');
      await delay(380);
      setCenterText('');
      await delay(180);
    }
  }

  // ── Start / reset ─────────────────────────────────────────────────────────
  function startGame() {
    if (!playerName.trim()) { setNameError('Ingresá tu nombre para jugar'); return; }
    setNameError('');
    playerNameRef.current = playerName.trim();
    playerEmailRef.current = playerEmail.trim();

    cancelToken.current.cancelled = true;
    cancelInput();

    setScore(0);
    scoreRef.current = 0;
    setLitButton(null);
    setGameOverData(null);
    setCenterText('');

    const token = { cancelled: false };
    cancelToken.current = token;
    gameLoop(token);
  }

  function resetGame() {
    cancelToken.current.cancelled = true;
    cancelInput();
    setScore(0);
    scoreRef.current = 0;
    setLitButton(null);
    setGameOverData(null);
    setCenterText('');
    setPhase('idle');
  }

  useEffect(() => {
    return () => {
      cancelToken.current.cancelled = true;
      if (inputResolverRef.current) { inputResolverRef.current('timeout'); inputResolverRef.current = null; }
      if (inputTimerRef.current) clearTimeout(inputTimerRef.current);
      if (visualTimerRef.current) clearInterval(visualTimerRef.current);
    };
  }, []);

  // ── Leaderboard context (for #4+ game over) ───────────────────────────────
  const leaderboardCtx = useMemo(() => {
    if (!gameOverData || gameOverData.position <= 3 || gameOverData.position <= 0) return null;
    const { id, position, entries } = gameOverData;
    if (!Array.isArray(entries)) return null;
    const userIdx = entries.findIndex(e => e.id === id);
    if (userIdx === -1) return null;
    const above = entries.slice(Math.max(0, userIdx - 2), userIdx);
    const below = entries.slice(userIdx + 1, Math.min(entries.length, userIdx + 3));
    return { above, below, position };
  }, [gameOverData]);

  // ── Render helpers ────────────────────────────────────────────────────────

  // Simon board (reused in both game and idle views)
  const board = (
    <div
      className="relative w-full aspect-square rounded-full overflow-hidden"
      style={{ background: '#090909', border: '3px solid #161616', maxWidth: 440 }}
    >
      <div className="grid grid-cols-2 w-full h-full p-2.5 gap-2.5">
        {BUTTONS.map(id => {
          const st = BUTTON_STYLE[id];
          const isLit = litButton === id;
          return (
            <button
              key={id}
              onClick={() => handlePress(id)}
              disabled={phase !== 'player'}
              aria-label={id}
              className="relative w-full h-full select-none cursor-pointer disabled:cursor-default active:opacity-80"
              style={{
                borderRadius: st.borderRadius,
                background: isLit ? st.lit : st.dim,
                boxShadow: isLit ? st.shadow : 'none',
                transition: isLit
                  ? 'background 0.04s ease, box-shadow 0.04s ease'
                  : 'background 0.25s ease, box-shadow 0.25s ease',
                border: 'none',
                outline: 'none',
              }}
            >
              {hints && (
                <span
                  className="absolute inset-0 flex items-center justify-center font-bold opacity-30 pointer-events-none select-none"
                  style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(0.7rem, 2.5vw, 1.1rem)' }}
                >
                  {BUTTON_KEYS[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Center hub */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 rounded-full"
        style={{
          width: '27%',
          height: '27%',
          background: '#090909',
          border: '2px solid #1a1a1a',
        }}
      >
        <AnimatePresence mode="wait">
          {centerText ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, color: '#4ade80', fontSize: 'clamp(0.9rem, 3vw, 1.4rem)' }}
            >
              {centerText}
            </motion.span>
          ) : (
            <motion.span
              key="score"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 800,
                color: phase === 'idle' ? '#333' : '#fff',
                fontSize: phase === 'idle' ? 'clamp(0.55rem, 2vw, 0.85rem)' : 'clamp(1rem, 4.5vw, 1.9rem)',
              }}
            >
              {phase === 'idle' ? 'TT' : score}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Timer / message strip (below board during game)
  const timerStrip = (
    <div className="w-full flex flex-col items-center justify-center h-14" style={{ maxWidth: 440 }}>
      <AnimatePresence mode="wait">
        {phase === 'showing' && (
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-center px-4 text-[#888]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {currentMessage}
          </motion.p>
        )}
        {phase === 'player' && (
          <motion.div
            key="timer-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col gap-1.5 px-1"
          >
            <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full rounded-full transition-[background] duration-300"
                style={{
                  width: `${timerProgress * 100}%`,
                  background: timerProgress > 0.5 ? '#eec416' : timerProgress > 0.25 ? '#f97316' : '#ef4444',
                  transition: 'background 0.3s ease',
                }}
              />
            </div>
            <p className="text-xs text-center text-[#444]" style={{ fontFamily: 'var(--font-inter)' }}>
              tu turno
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Game Over screen ──────────────────────────────────────────────────────
  if (phase === 'gameover' && gameOverData) {
    const { id, position, entries } = gameOverData;
    const podium = PODIUM[position];

    const resultContent = (
      <>
        {/* Podium message (top 3) */}
        {position >= 1 && position <= 3 && podium && (
          <div
            className="rounded-2xl p-8 text-center mb-6 w-full"
            style={{ background: podium.bg, border: `1px solid ${podium.border}` }}
          >
            <div className="text-5xl mb-3">{podium.emoji}</div>
            <h3
              className="text-xl font-bold mb-2 leading-snug"
              style={{ color: podium.color, fontFamily: 'var(--font-syne)' }}
            >
              {podium.msg(playerName)}
            </h3>
            <p className="text-sm text-[#888]" style={{ fontFamily: 'var(--font-inter)' }}>
              {podium.sub}
            </p>
          </div>
        )}

        {/* Context table (#4+) */}
        {leaderboardCtx && (
          <div className="mb-6 w-full">
            <p className="text-[#555] text-xs text-center mb-3 uppercase tracking-widest" style={{ fontFamily: 'var(--font-syne)' }}>
              Tu posición
            </p>
            <div className="flex flex-col gap-1">
              {leaderboardCtx.above.map((entry, i) => {
                const rank = leaderboardCtx.position - (leaderboardCtx.above.length - i);
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#111]">
                    <span className="text-[#444] text-xs w-8 text-right shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>#{rank}</span>
                    <span className="text-[#777] flex-1 truncate text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{entry.name}</span>
                    <span className="text-[#555] text-sm font-bold shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>{entry.score}</span>
                  </div>
                );
              })}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ background: 'rgba(238,196,22,0.09)', border: '1px solid rgba(238,196,22,0.32)' }}
              >
                <span className="text-xs w-8 text-right shrink-0 font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#eec416' }}>
                  #{leaderboardCtx.position}
                </span>
                <span className="flex-1 truncate text-sm font-medium" style={{ fontFamily: 'var(--font-inter)', color: '#fff' }}>
                  {playerName}
                </span>
                <span className="text-sm font-bold shrink-0" style={{ fontFamily: 'var(--font-syne)', color: '#eec416' }}>
                  {score}
                </span>
              </div>
              {leaderboardCtx.below.map((entry, i) => {
                const rank = leaderboardCtx.position + i + 1;
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#111]">
                    <span className="text-[#444] text-xs w-8 text-right shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>#{rank}</span>
                    <span className="text-[#777] flex-1 truncate text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{entry.name}</span>
                    <span className="text-[#555] text-sm font-bold shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>{entry.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Position for edge cases */}
        {position > 0 && position > 3 && !leaderboardCtx && (
          <p className="text-center text-[#666] mb-6 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
            Quedaste en el puesto #{position}
          </p>
        )}

        {/* Play again */}
        <div className="text-center w-full">
          <button
            onClick={resetGame}
            className="btn-gold px-8 py-4 bg-[#eec416] text-[#0d0d0d] rounded-full text-sm uppercase tracking-widest hover:bg-[#f5d038] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}
          >
            Jugar de nuevo
          </button>
        </div>
      </>
    );

    return (
      <div className="min-h-screen pt-16">
        <div className="flex max-w-7xl mx-auto px-10 py-10 items-start gap-16">
          {/* Left: TTEvents */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit">
            <TTEvents />
          </div>

          {/* Center: score + result + play again */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center min-w-0 pt-6"
          >
            <p className="text-[#555] text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
              Juego terminado
            </p>
            <h2
              className="text-white mb-8"
              style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem, 7vw, 3.8rem)' }}
            >
              <span className="text-[#eec416]">{score}</span>{' '}
              <span className="text-[#555]">{score === 1 ? 'punto' : 'puntos'}</span>
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              {resultContent}
            </motion.div>
          </motion.div>

          {/* Right: full leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit"
          >
            <Leaderboard entries={entries} highlightId={id} />
          </motion.div>
        </div>

        {/* Mobile: leaderboard + events */}
        <div className="lg:hidden max-w-[440px] mx-auto px-4 pb-12 flex flex-col gap-10">
          <Leaderboard entries={entries} highlightId={id} />
          <TTEvents />
        </div>
      </div>
    );
  }

  // ── Main game view (idle + playing) ───────────────────────────────────────
  return (
    <div className="min-h-screen pt-16">
      <div className="flex max-w-7xl mx-auto px-10 py-10 items-start gap-16">
        {/* Left panel: TT events info */}
        <div className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit">
          <TTEvents />
        </div>

        {/* Simon game area — truly centered */}
        <div className="flex-1 flex flex-col items-center gap-5 min-w-0">
          <div className="w-full max-w-[440px] flex flex-col items-center gap-5">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1
              className="uppercase tracking-widest leading-none"
              style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.5rem, 5vw, 2.4rem)' }}
            >
              TT <span className="text-[#eec416]">Simon</span>
            </h1>
            <p className="text-[#444] text-xs uppercase tracking-widest mt-1" style={{ fontFamily: 'var(--font-inter)' }}>
              ITBA Future Day 2026
            </p>
          </motion.div>

          {/* Board */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 180, damping: 22 }}
            className="w-full"
          >
            {board}
          </motion.div>

          {/* Timer strip during game */}
          {phase !== 'idle' && timerStrip}

          {/* Entry form */}
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="w-full flex flex-col gap-3"
            >
              <div>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  maxLength={20}
                  value={playerName}
                  onChange={e => { setPlayerName(e.target.value); setNameError(''); }}
                  onKeyDown={e => e.key === 'Enter' && startGame()}
                  className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1f1f1f] text-white placeholder-[#444] focus:outline-none focus:border-[#eec416]/60 transition-colors text-sm"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                {nameError && (
                  <p className="text-red-400 text-xs mt-1.5 ml-1" style={{ fontFamily: 'var(--font-inter)' }}>
                    {nameError}
                  </p>
                )}
              </div>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={playerEmail}
                onChange={e => setPlayerEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startGame()}
                className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1f1f1f] text-white placeholder-[#444] focus:outline-none focus:border-[#eec416]/60 transition-colors text-sm"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
              <button
                onClick={startGame}
                className="btn-gold w-full py-4 bg-[#eec416] text-[#0d0d0d] rounded-full text-sm uppercase tracking-widest hover:bg-[#f5d038] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}
              >
                Jugar
              </button>
            </motion.div>
          )}
          </div>
        </div>

        {/* Desktop leaderboard sidebar — right */}
        <div className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit">
          <Leaderboard entries={lbEntries} />
        </div>
      </div>

      {/* Mobile: leaderboard + events — always below, scroll to see */}
      <div
        className={`lg:hidden max-w-[440px] mx-auto px-4 pb-12 flex flex-col gap-10 transition-all duration-300 ${
          phase === 'showing' || phase === 'player' ? 'opacity-30 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Leaderboard entries={lbEntries} />
        <TTEvents />
      </div>
    </div>
  );
}
