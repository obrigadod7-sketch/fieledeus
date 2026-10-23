import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

export default function ChurchPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const { user } = useContext(AuthContext);
  return (
    <div className="flex h-screen flex-col bg-[#FDFBF7]" data-testid="church-page">
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] px-4 py-3 text-white">
        <button onClick={() => navigate(user ? '/home' : '/')} className="rounded-full p-2 hover:bg-white/20" data-testid="church-back-btn"><ArrowLeft size={22} /></button>
        <h1 className="flex-1 text-lg font-bold">Igreja</h1>
        <a href="/igreja/" onClick={(e) => { try { e.currentTarget.href = document.querySelector('[data-testid="church-iframe"]').contentWindow.location.href; } catch {} }} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25" data-testid="church-open-new-tab"><ExternalLink size={16} /> <span className="hidden sm:inline">Abrir em nova aba</span></a>
      </div>
      <div className="relative flex-1">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-[#2A9D8F]" size={32} /></div>}
        <iframe src="/igreja/" title="Site da Igreja" onLoad={() => setLoaded(true)} className="h-full w-full border-0" data-testid="church-iframe" />
      </div>
    </div>
  );
}
