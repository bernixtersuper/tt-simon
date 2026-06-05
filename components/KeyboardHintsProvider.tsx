'use client';

import { createContext, useContext, useState } from 'react';

interface GameSettingsCtx {
  hints: boolean;
  toggleHints: () => void;
  hardMode: boolean;
  toggleHardMode: () => void;
}

const Ctx = createContext<GameSettingsCtx>({ hints: true, toggleHints: () => {}, hardMode: false, toggleHardMode: () => {} });
export const useGameSettings = () => useContext(Ctx);
export const useKeyboardHints = () => useContext(Ctx); // backwards compat

export default function KeyboardHintsProvider({ children }: { children: React.ReactNode }) {
  const [hints, setHints] = useState(true);
  const [hardMode, setHardMode] = useState(false);
  return (
    <Ctx.Provider value={{
      hints, toggleHints: () => setHints(h => !h),
      hardMode, toggleHardMode: () => setHardMode(h => !h),
    }}>
      {children}
    </Ctx.Provider>
  );
}
