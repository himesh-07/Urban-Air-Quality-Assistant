import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AqiGauge } from './components/AqiGauge';
import { AssistantChat } from './components/AssistantChat';
import { ContextControls } from './components/ContextControls';
import { ForecastChart } from './components/ForecastChart';
import { Header } from './components/Header';
import { PollutantGrid } from './components/PollutantGrid';
import { FALLBACK_SNAPSHOTS, PRESET_CITIES } from './data/presets';
import {
  answerAssistantQuery,
  evaluateAirQualityDecision,
} from './engine/decisionEngine';
import { useTheme } from './hooks/useTheme';
import { fetchAirQualityForCity, searchCities } from './services/airQualityApi';
import type {
  AirQualitySnapshot,
  ChatMessage,
  CityLocation,
  UserContext,
} from './types/airQuality';

const DEFAULT_CONTEXT: UserContext = {
  persona: 'general',
  activity: 'light_walk',
  durationMinutes: 30,
  environment: 'outdoor',
};

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedCity, setSelectedCity] = useState<CityLocation>(PRESET_CITIES[0]);
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot>(
    FALLBACK_SNAPSHOTS[PRESET_CITIES[0].id]
  );
  const [context, setContext] = useState<UserContext>(DEFAULT_CONTEXT);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>(PRESET_CITIES);
  const [isLoading, setIsLoading] = useState(false);

  const decision = useMemo(
    () => evaluateAirQualityDecision(snapshot, context),
    [snapshot, context]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I am AeroPulse. Adjust your persona, activity, or city above and ask me anything about air quality, masks, or optimal outdoor timing.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const loadCityData = useCallback(async (city: CityLocation) => {
    setIsLoading(true);
    try {
      const data = await fetchAirQualityForCity(city);
      setSnapshot(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCityData(selectedCity);
  }, [selectedCity, loadCityData]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const results = await searchCities(searchQuery);
      setSearchResults(results);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectCity(city: CityLocation) {
    setSelectedCity(city);
    setSearchQuery('');
  }

  function handleSendMessage(text: string) {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const reply = answerAssistantQuery(text, snapshot, context, decision);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  }

  const riskBarColor =
    decision.riskLevel === 'low'
      ? 'var(--aqi-good)'
      : decision.riskLevel === 'moderate'
      ? 'var(--aqi-moderate)'
      : decision.riskLevel === 'elevated'
      ? 'var(--aqi-sensitive)'
      : 'var(--aqi-unhealthy)';

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="app-shell">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          onSelectCity={handleSelectCity}
          onRefresh={() => void loadCityData(selectedCity)}
          isLoading={isLoading}
        />

        <nav className="preset-bar" aria-label="Quick city presets">
          {PRESET_CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              className={`preset-pill ${selectedCity.id === city.id ? 'active' : ''}`}
              onClick={() => handleSelectCity(city)}
            >
              {city.name}
            </button>
          ))}
        </nav>

        <main id="main-content" className="dashboard-grid">
          <div className="left-column">
            {/* Hero AQI & Personalized Verdict */}
            <section className="card" aria-labelledby="verdict-heading">
              <div className="hero-aqi-layout">
                <AqiGauge aqi={snapshot.aqi} category={decision.category} />

                <div>
                  <div
                    className="aqi-badge"
                    style={{
                      color: decision.category.colorVar,
                      backgroundColor: decision.category.badgeBg,
                    }}
                  >
                    {decision.riskLevel === 'low' ? (
                      <ShieldCheck size={14} aria-hidden="true" />
                    ) : (
                      <ShieldAlert size={14} aria-hidden="true" />
                    )}
                    <span>
                      {decision.category.label} ({decision.category.range})
                    </span>
                  </div>

                  <h2 id="verdict-heading" className="verdict-title">
                    {decision.verdictTitle}
                  </h2>
                  <p className="verdict-summary" aria-live="polite">
                    {decision.verdictSummary}
                  </p>

                  <div className="risk-meter-row">
                    <span>Personalized Exposure Risk</span>
                    <span>{decision.personalizedRiskScore} / 100</span>
                  </div>
                  <div className="risk-bar-track" aria-hidden="true">
                    <div
                      className="risk-bar-fill"
                      style={{
                        width: `${decision.personalizedRiskScore}%`,
                        backgroundColor: riskBarColor,
                      }}
                    />
                  </div>

                  <div className="meta-chips">
                    <span className="meta-chip">
                      <MapPin size={12} aria-hidden="true" />
                      {snapshot.city.name}, {snapshot.city.country}
                    </span>
                    <span className="meta-chip">
                      {snapshot.source === 'offline-fallback' ? (
                        <WifiOff size={12} aria-hidden="true" />
                      ) : (
                        <Wifi size={12} aria-hidden="true" />
                      )}
                      {snapshot.source === 'live'
                        ? 'Live Open-Meteo'
                        : snapshot.source === 'cached'
                        ? 'Cached (15m)'
                        : 'Offline Baseline'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Context Controls */}
            <ContextControls context={context} onChange={setContext} />

            {/* 24-Hour Forecast */}
            <ForecastChart
              hourly={snapshot.hourlyForecast}
              optimalWindow={decision.optimalWindow}
            />
          </div>

          <div className="right-column">
            {/* Actionable Recommendations */}
            <section className="card" aria-labelledby="recommendations-heading">
              <div className="card-header">
                <h2 id="recommendations-heading" className="card-title">
                  <CheckCircle2 size={18} aria-hidden="true" color="var(--accent-primary)" />
                  Tailored Action Plan
                </h2>
              </div>

              <div className="rec-list">
                {decision.recommendations.map((rec) => (
                  <div key={rec.id} className={`rec-item priority-${rec.priority}`}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                      {rec.priority === 'warning' ? (
                        <AlertTriangle size={16} color="var(--aqi-unhealthy)" aria-hidden="true" />
                      ) : (
                        <CheckCircle2
                          size={16}
                          color={
                            rec.priority === 'caution'
                              ? 'var(--aqi-moderate)'
                              : 'var(--aqi-good)'
                          }
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="rec-title">{rec.title}</h3>
                      <p className="rec-detail">{rec.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pollutant Breakdown */}
            <PollutantGrid
              pollutants={snapshot.pollutants}
              dominant={snapshot.dominantPollutant}
            />

            {/* Conversational Assistant */}
            <AssistantChat messages={messages} onSendMessage={handleSendMessage} />
          </div>
        </main>

        <footer className="app-footer">
          AeroPulse • Challenge 6: Urban Air Quality Assistant • Live data via Open-Meteo Air Quality API with automatic offline resilience.
        </footer>
      </div>
    </>
  );
}

export default App;
