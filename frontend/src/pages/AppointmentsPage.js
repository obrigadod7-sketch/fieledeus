import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MessageCircle } from 'lucide-react';
import { AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { STATUS, AppointmentExtras } from '../components/chat/AppointmentCard';
import { formatDate, modalityLabel } from '../utils/calendar';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AppointmentsPage() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    fetch(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : [])).then(setItems).catch(() => setItems([]));
  }, [token]);

  const today = new Date().toISOString().slice(0, 10);
  const list = (items || []).filter((a) => (tab === 'upcoming' ? a.date >= today && !['declined', 'cancelled'].includes(a.status) : a.date < today || ['declined', 'cancelled'].includes(a.status)));

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24" data-testid="appointments-page">
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-white/20" data-testid="appointments-back-btn"><ArrowLeft size={22} /></button>
          <h1 className="text-xl font-bold">Meus encontros</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <div className="mb-5 flex gap-2">
          {[['upcoming', 'Próximos'], ['past', 'Anteriores']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === k ? 'border-[#264653] bg-[#264653] text-white' : 'border-[#D9D1C6] bg-white text-[#2C221E]'}`} data-testid={`appointments-tab-${k}`}>{l}</button>
          ))}
        </div>
        {items === null ? <p className="text-[#8C827A]">Carregando…</p> : list.length === 0 ? (
          <div className="py-16 text-center text-[#8C827A]" data-testid="appointments-empty"><CalendarDays size={40} className="mx-auto mb-3 text-[#2A9D8F]" />Nenhum encontro aqui ainda.</div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const otherId = a.proposer_id === user.id ? a.invitee_id : a.proposer_id;
              const otherName = a.proposer_id === user.id ? a.invitee_name : a.proposer_name;
              const st = STATUS[a.status] || STATUS.pending;
              return (
                <div key={a.id} className="rounded-2xl border border-[#EFE8DD] bg-white p-4 shadow-sm" data-testid={`appointment-item-${a.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#2C221E]">{otherName}</p>
                      <p className="text-sm text-[#5C524B]">{formatDate(a.date)} · {a.start_time} – {a.end_time}</p>
                      <p className="text-sm text-[#5C524B]">{modalityLabel(a.modality)}{a.address ? ` · ${a.address}` : ''}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <AppointmentExtras appt={a} otherName={otherName} />
                  <button onClick={() => navigate(`/direct-chat/${otherId}`)} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#1F7A6F]" data-testid={`appointment-open-chat-${a.id}`}><MessageCircle size={15} /> Abrir conversa</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
