import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('AeroPulse App', () => {
  it('renders brand title, AQI verdict, and toggles dark/light mode', () => {
    render(<App />);
    expect(screen.getByText('AeroPulse')).toBeInTheDocument();
    expect(screen.getByText(/Personalized Exposure Risk/i)).toBeInTheDocument();

    const themeBtn = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    const initialTheme = document.documentElement.getAttribute('data-theme');
    fireEvent.click(themeBtn);
    const nextTheme = document.documentElement.getAttribute('data-theme');
    expect(nextTheme).not.toBe(initialTheme);
  });

  it('updates personalized verdict when switching city preset and persona', () => {
    render(<App />);
    const delhiBtn = screen.getByRole('button', { name: 'New Delhi' });
    fireEvent.click(delhiBtn);

    const personaSelect = screen.getByLabelText(/Health \/ Persona Profile/i);
    fireEvent.change(personaSelect, { target: { value: 'asthma_respiratory' } });

    expect(screen.getByText(/Tailored Action Plan/i)).toBeInTheDocument();
  });

  it('responds to user questions in the assistant chat', () => {
    render(<App />);
    const quickBtn = screen.getByRole('button', { name: /Do I need an N95 mask\?/i });
    fireEvent.click(quickBtn);

    expect(screen.getAllByText(/Do I need an N95 mask\?/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Dominant pollutant right now/i)).toBeInTheDocument();
  });
});
