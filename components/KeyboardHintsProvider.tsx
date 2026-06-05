'use client';

import { createContext, useContext, useState } from 'react';

interface KeyboardHintsCtx {
  hints: boolean;
  toggle: () => void;
}

const Ctx = createContext<KeyboardHintsCtx>({ hints: true, toggle: () => {} });
export const useKeyboardHints = () => useContext(Ctx);

export default function KeyboardHintsProvider({ children }: { children: React.ReactNode }) {
  const [hints, setHints] = useState(true);
  return (
    <Ctx.Provider value={{ hints, toggle: () => setHints(h => !h) }}>
      {children}
    </Ctx.Provider>
  );
}
