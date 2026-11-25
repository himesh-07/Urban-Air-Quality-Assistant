import { useEffect, useRef, useState } from 'react';
import { Moon, RefreshCw, Search, Sun, Wind } from 'lucide-react';
import type { CityLocation } from '../types/airQuality';
import type { ThemeMode } from '../hooks/useTheme';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: CityLocation[];
  onSelectCity: (city: CityLocation) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function Header({
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectCity,
  onRefresh,
  isLoading,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="top-header">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true">
          <Wind size={22} />
        </div>
        <div>
          <h1 className="brand-title">AeroPulse</h1>
          <p className="brand-subtitle">Challenge 6 • Urban Air Quality Assistant</p>
        </div>
      </div>

      <div className="header-controls">
        <div className="search-wrapper" ref={wrapperRef}>
          <div className="search-input-box">
            <Search size={16} aria-hidden="true" color="var(--text-muted)" />
            <input
              type="search"
              className="search-input"
              placeholder="Search any city (e.g., Tokyo, Paris)..."
              aria-label="Search city for air quality"
              value={searchQuery}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setDropdownOpen(true);
              }}
            />
          </div>

          {dropdownOpen && searchResults.length > 0 && (
            <div className="search-dropdown" role="listbox" aria-label="Matching cities">
              {searchResults.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  role="option"
                  className="search-option"
                  onClick={() => {
                    onSelectCity(city);
                    setDropdownOpen(false);
                  }}
                >
                  <span>{city.name}</span>
                  <span className="search-option-sub">
                    {city.admin1 ? `${city.admin1}, ` : ''}
                    {city.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh air quality data"
          title="Refresh air quality data"
        >
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} aria-hidden="true" />
          <span className="hide-mobile">{isLoading ? 'Updating' : 'Refresh'}</span>
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}
