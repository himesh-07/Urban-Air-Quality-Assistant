import { SlidersHorizontal } from 'lucide-react';
import { ACTIVITY_META, ENVIRONMENT_META, PERSONA_META } from '../engine/decisionEngine';
import type {
  ActivityType,
  DurationOption,
  EnvironmentType,
  UserContext,
  UserPersona,
} from '../types/airQuality';

interface ContextControlsProps {
  context: UserContext;
  onChange: (next: UserContext) => void;
}

const DURATIONS: DurationOption[] = [15, 30, 60, 120];

export function ContextControls({ context, onChange }: ContextControlsProps) {
  return (
    <section className="card" aria-labelledby="context-heading">
      <div className="card-header">
        <h2 id="context-heading" className="card-title">
          <SlidersHorizontal size={18} aria-hidden="true" color="var(--accent-primary)" />
          Your Context & Activity Profile
        </h2>
      </div>

      <div className="controls-grid">
        <div className="control-group">
          <label htmlFor="persona-select" className="control-label">
            Health / Persona Profile
          </label>
          <select
            id="persona-select"
            className="control-select"
            value={context.persona}
            onChange={(e) => onChange({ ...context, persona: e.target.value as UserPersona })}
          >
            {(Object.keys(PERSONA_META) as UserPersona[]).map((key) => (
              <option key={key} value={key}>
                {PERSONA_META[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="activity-select" className="control-label">
            Planned Activity
          </label>
          <select
            id="activity-select"
            className="control-select"
            value={context.activity}
            onChange={(e) => onChange({ ...context, activity: e.target.value as ActivityType })}
          >
            {(Object.keys(ACTIVITY_META) as ActivityType[]).map((key) => (
              <option key={key} value={key}>
                {ACTIVITY_META[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="environment-select" className="control-label">
            Environment
          </label>
          <select
            id="environment-select"
            className="control-select"
            value={context.environment}
            onChange={(e) =>
              onChange({ ...context, environment: e.target.value as EnvironmentType })
            }
          >
            {(Object.keys(ENVIRONMENT_META) as EnvironmentType[]).map((key) => (
              <option key={key} value={key}>
                {ENVIRONMENT_META[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <span className="control-label">Planned Duration</span>
          <div className="duration-pills" role="group" aria-label="Planned duration">
            {DURATIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                className={`duration-pill ${context.durationMinutes === mins ? 'active' : ''}`}
                onClick={() => onChange({ ...context, durationMinutes: mins })}
                aria-pressed={context.durationMinutes === mins}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
