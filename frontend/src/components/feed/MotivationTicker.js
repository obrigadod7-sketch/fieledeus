import React, { useEffect, useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

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

const VERSES = [
  { text: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
  { text: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
  { text: 'Não temas, porque eu sou contigo.', ref: 'Isaías 41:10' },
  { text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', ref: 'Salmos 37:5' },
  { text: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.', ref: 'Mateus 11:28' },
  { text: 'O amor é paciente, o amor é bondoso.', ref: '1 Coríntios 13:4' },
  { text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', ref: 'Salmos 119:105' },
  { text: 'Sede fortes e corajosos; não temais, porque o Senhor teu Deus é contigo.', ref: 'Josué 1:9' },
  { text: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', ref: '1 Pedro 5:7' },
  { text: 'Os que esperam no Senhor renovarão as suas forças.', ref: 'Isaías 40:31' },
  { text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', ref: 'Salmos 46:1' },
  { text: 'Amarás o teu próximo como a ti mesmo.', ref: 'Marcos 12:31' },
];

const INTERVAL_MS = 60 * 1000;

function useRotating(length) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * length));
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [length]);
  return index;
}

function Row({ icon: Icon, kicker, children, testid }) {
  return (
    <div className="flex items-start gap-3" data-testid={testid}>
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#A0703F]/15 text-[#A0703F]">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A0703F]">{kicker}</p>
        {children}
      </div>
    </div>
  );
}

export default function MotivationTicker() {
  const msgIndex = useRotating(MESSAGES.length);
  const verseIndex = useRotating(VERSES.length);
  const verse = VERSES[verseIndex];

  return (
    <section className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-[#FFF8EE] px-4 py-3" aria-live="polite">
      <Row icon={BookOpen} kicker="Versículo do dia" testid="bible-verse">
        <p key={verseIndex} className="fade-up mt-0.5 text-sm font-medium italic text-[#2C221E]" data-testid="bible-verse-text">
          “{verse.text}”
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#8A5A1F]" data-testid="bible-verse-ref">{verse.ref}</p>
      </Row>
      <div className="border-t border-[#E8E2D9]" />
      <Row icon={Sparkles} kicker="Mensagem de motivação" testid="motivation-message">
        <p key={msgIndex} className="fade-up mt-0.5 text-sm font-medium text-[#2C221E]" data-testid="motivation-message-text">
          {MESSAGES[msgIndex]}
        </p>
      </Row>
    </section>
  );
}
