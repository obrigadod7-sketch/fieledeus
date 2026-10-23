import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Globe, MessageCircle, Search } from 'lucide-react';
import { AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import { getCategory } from '../components/feed/feedConfig';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AssociationsPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`${API}/api/associations`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : [])).then(setItems).catch(() => setItems([]));
  }, [token]);

  const term = q.toLowerCase();
  const list = (items || []).filter((a) => !term || [a.organization, a.name, a.city, a.bio].some((v) => (v || '').toLowerCase().includes(term)));

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24" data-testid="associations-page">
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-white/20" data-testid="associations-back-btn"><ArrowLeft size={22} /></button>
          <h1 className="flex-1 text-xl font-bold">Associações</h1>
          {user?.role !== 'association' && (
            <button onClick={() => navigate('/association-register')} className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25" data-testid="associations-add-btn">+ Cadastrar</button>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <div className="relative mb-5">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou cidade" className="w-full rounded-full border border-[#D9D1C6] bg-white py-3 pl-10 pr-4" data-testid="associations-search-input" />
        </div>
        {items === null ? <p className="text-[#8C827A]">Carregando…</p> : list.length === 0 ? (
          <div className="py-16 text-center text-[#8C827A]" data-testid="associations-empty"><Building2 size={40} className="mx-auto mb-3 text-[#2A9D8F]" />Nenhuma associação encontrada.</div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div key={a.id} className="rounded-2xl border border-[#EFE8DD] bg-white p-5 shadow-sm" data-testid={`association-item-${a.id}`}>
                <div className="flex items-start gap-3">
                  <Avatar userId={a.id} version={a.avatar_version} name={a.organization || a.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#2C221E]">{a.organization || a.name}</p>
                    {(a.location?.address || a.city) && <p className="flex items-center gap-1 text-sm text-[#5C524B]"><MapPin size={13} /> {a.location?.address || a.city}</p>}
                    {a.bio && <p className="mt-2 text-sm text-[#5C524B]">{a.bio}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(a.help_categories || []).map((c) => { const cat = getCategory(c); return cat ? <span key={c} className={`feed-badge ${cat.badge}`}>{cat.label}</span> : null; })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.id !== user?.id && <button onClick={() => navigate(`/direct-chat/${a.id}`)} className="flex items-center gap-1.5 rounded-full bg-[#2A9D8F] px-4 py-2 text-sm font-semibold text-white" data-testid={`association-chat-${a.id}`}><MessageCircle size={15} /> Conversar</button>}
                  {a.phone && <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 rounded-full border border-[#D9D1C6] px-4 py-2 text-sm font-semibold text-[#2C221E]" data-testid={`association-phone-${a.id}`}><Phone size={15} /> Ligar</a>}
                  {a.website && <a href={a.website.startsWith('http') ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-[#D9D1C6] px-4 py-2 text-sm font-semibold text-[#2C221E]" data-testid={`association-site-${a.id}`}><Globe size={15} /> Site</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
