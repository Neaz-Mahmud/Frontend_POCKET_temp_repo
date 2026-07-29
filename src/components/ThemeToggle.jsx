import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

/**
 * A single toggle used in two places: the sidebar (desktop) and the
 * mobile top bar. `compact` drops the text label for tight spaces.
 */
const ThemeToggle = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb ${isDark ? 'is-dark' : ''}`}>
          {isDark ? <Moon size={12} /> : <Sun size={12} />}
        </span>
      </span>
      {!compact && <span className="theme-toggle-label">{isDark ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  );
};

export default ThemeToggle;
