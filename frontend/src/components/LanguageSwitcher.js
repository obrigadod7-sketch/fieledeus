import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = (i18n.language || 'pt').slice(0, 2);

  return (
    <div className="fixed bottom-20 left-3 z-[60]" data-no-translate data-testid="global-language-switcher">
      {open && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl" data-testid="language-menu">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${current === l.code ? 'font-bold text-[#2A9D8F]' : 'text-gray-700'}`}
              data-testid={`language-option-${l.code}`}>
              {l.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Language"
        className="flex items-center gap-1.5 rounded-full bg-[#2C221E] px-3 py-2 text-xs font-bold uppercase text-white shadow-lg transition-transform hover:scale-105"
        data-testid="language-switcher-toggle">
        <Globe size={15} /> {current}
      </button>
    </div>
  );
}
