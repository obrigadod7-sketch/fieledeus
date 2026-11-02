import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const MESSAGES = [
  'Cada novo começo é corajoso. Você já está no caminho certo.',
  'Pedir ajuda é sinal de força, não de fraqueza.',
  'Você não está sozinho: há pessoas aqui prontas para ajudar.',
  'Um passo de cada vez. O importante é não parar.',
  'Sua história importa e seu futuro pode ser brilhante.',
  'Dias difíceis passam. Pessoas fortes ficam.',
  'Gentileza muda vidas: ajude alguém hoje, mesmo que seja com uma palavra.',
  'Você é capaz de recomeçar quantas vezes for preciso.',
  'Fé, esperança e união: juntos vamos mais longe.',
  'Cada pequena conquista merece ser celebrada.',
];

const INTERVAL_MS = 60 * 1000;

export default function MotivationTicker() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="flex items-start gap-3 rounded-2xl border border-[#E8E2D9] bg-[#FFF8EE] px-4 py-3"
      data-testid="motivation-message"
      aria-live="polite"
    >
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#A0703F]/15 text-[#A0703F]">
        <Sparkles size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A0703F]">Mensagem de motivação</p>
        <p key={index} className="fade-up mt-0.5 text-sm font-medium text-[#2C221E]" data-testid="motivation-message-text">
          {MESSAGES[index]}
        </p>
      </div>
    </section>
  );
}
