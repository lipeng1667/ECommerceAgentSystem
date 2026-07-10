import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

interface DemoModeContextValue {
  isDemo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  demoLabel: string;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: PropsWithChildren) {
  const [isDemo, setIsDemo] = useState(() => {
    return sessionStorage.getItem('allmall-demo-mode') === 'true';
  });

  const enterDemo = useCallback(() => {
    sessionStorage.setItem('allmall-demo-mode', 'true');
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem('allmall-demo-mode');
    setIsDemo(false);
  }, []);

  const demoLabel = useMemo(() => '演示模式', []);

  return (
    <DemoModeContext.Provider value={{ isDemo, enterDemo, exitDemo, demoLabel }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return ctx;
}
