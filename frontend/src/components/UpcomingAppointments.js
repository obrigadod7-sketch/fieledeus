import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, ChevronRight, Video, MapPin } from 'lucide-react';
import { AuthContext } from '../App';
import { STATUS } from './chat/AppointmentCard';
import { formatDate } from '../utils/calendar';

const API = process.env.REACT_APP_BACKEND_URL;
const today = () => new Date().toLocaleDateString('en-CA');

export const upcoming = (items) => items.filter((a) => a.date >= today() && !['declined', 'cancelled'].includes(a.status));

export function AppointmentRow({ a, userId, onClick }) {
  const other = a.proposer_id === userId ? a.invitee_name : a.proposer_name;
  const st = STATUS[a.status] || STATUS.pending;
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl bg-[#F7F4EE] p-3 text-left transition-colors hover:bg-[#EFE8DD]" data-testid={`upcoming-appointment-${a.id}`}>
      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#2A9D8F] text-white">
        <span className="text-lg font-bold leading-none">{a.date.slice(8, 10)}</span>
        <span className="text-[10px] uppercase">{new Date(`${a.date}T12:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#2C221E]">{other}</p>
        <p className="flex items-center gap-1 text-xs text-[#5C524B]"><Clock size={12} /> {formatDate(a.date)} · {a.start_time} – {a.end_time}</p>
        <p className="flex items-center gap-1 text-xs text-[#8C827A]">{a.modality === 'video' ? <Video size={12} /> : <MapPin size={12} />} <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${st.cls}`}>{st.label}</span></p>
      </div>
      <ChevronRight size={18} className="text-[#8C827A]" />
    </button>
  );
}

export default function UpcomingAppointments() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : [])).then((d) => setItems(upcoming(d))).catch(() => {});
  }, [token]);

  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-[#EFE8DD] bg-white p-4 shadow-sm" data-testid="upcoming-appointments">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold text-[#2C221E]"><CalendarDays size={18} className="text-[#2A9D8F]" /> Próximos encontros</p>
        <button onClick={() => navigate('/appointments')} className="text-sm font-semibold text-[#1F7A6F]" data-testid="upcoming-see-all-btn">Ver todos</button>
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((a) => (
          <AppointmentRow key={a.id} a={a} userId={user.id} onClick={() => navigate(`/direct-chat/${a.proposer_id === user.id ? a.invitee_id : a.proposer_id}`)} />
        ))}
      </div>
    </div>
  );
}
