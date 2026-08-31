import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

const STORAGE_KEY = 'lcid-theme';

const ThemeContext = createContext({ dark: false, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

const getInitialDark = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch (e) {
    /* localStorage unavailable */
  }
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
};

// Keeps the <html> element in sync with the active theme so the CSS custom
// properties (and the browser's form controls / scrollbars) follow it.
const ThemeSync = ({ dark }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);
  return null;
};

const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(getInitialDark);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch (e) {
        /* localStorage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);

  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <ThemeContext.Provider value={value}>
        <ThemeSync dark={dark} />
        {children}
      </ThemeContext.Provider>
    </ConfigProvider>
  );
};

export default ThemeProvider;
