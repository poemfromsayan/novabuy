/**
 * ThemeContext — Maneja el tema (light/dark) de la aplicación.
 *
 * Estrategia de 3 niveles (igual que en los mockups):
 * 1. localStorage → persistencia entre sesiones
 * 2. data-theme en <html> → controla el CSS
 * 3. prefers-color-scheme → preferencia del sistema como fallback
 *
 * ¿Por qué Context y no un simple hook?
 * Porque el tema necesita ser accesible desde cualquier componente
 * (Navbar, páginas, componentes) sin prop-drilling.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'novabuy-theme';

/** Lee la preferencia guardada en localStorage */
function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage no disponible (private browsing, etc.)
  }
  return null;
}

/** Detecta la preferencia del sistema operativo */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return getStoredTheme() ?? getSystemTheme();
  });

  // Sincroniza el atributo data-theme con el estado
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Silenciar error de localStorage
    }
  }, [theme]);

  // Escucha cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      // Solo actualiza si el usuario no ha elegido manualmente
      if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acceder al tema desde cualquier componente.
 * Lanza error si se usa fuera del ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un <ThemeProvider>');
  }
  return context;
}
