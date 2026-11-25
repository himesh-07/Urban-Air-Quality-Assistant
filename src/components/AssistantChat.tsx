import { useState, type FormEvent } from 'react';
import { Bot, Send } from 'lucide-react';
import type { ChatMessage } from '../types/airQuality';

interface AssistantChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  'Should I go for a run now?',
  'Do I need an N95 mask?',
  'Can I open my windows?',
  'When is the cleanest time today?',
];

export function AssistantChat({ messages, onSendMessage }: AssistantChatProps) {
  const [input, setInput] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  }

  return (
    <section className="card" aria-labelledby="assistant-heading">
      <div className="card-header">
        <h2 id="assistant-heading" className="card-title">
          <Bot size={18} aria-hidden="true" color="var(--accent-primary)" />
          Ask AeroPulse Assistant
        </h2>
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label="Assistant conversation">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="quick-prompts" aria-label="Suggested questions">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="quick-chip"
            onClick={() => onSendMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about masks, windows, workouts..."
          aria-label="Ask AeroPulse a question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
        />
        <button type="submit" className="chat-send-btn" aria-label="Send question">
          <Send size={15} aria-hidden="true" />
          <span>Ask</span>
        </button>
      </form>
    </section>
  );
}
