import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin, Video, Lock, Check, X, Repeat, Navigation, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { modalityLabel, formatDate, mapsUrl, downloadIcs } from '../../utils/calendar';

const API = process.env.REACT_APP_BACKEND_URL;

export const STATUS = {
  pending: { label: 'Aguardando resposta', cls: 'bg-amber-100 text-amber-800' },
  rescheduled: { label: 'Novo horário proposto', cls: 'bg-sky-100 text-sky-800' },
  accepted: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-800' },
  declined: { label: 'Recusado', cls: 'bg-rose-100 text-rose-800' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-200 text-gray-700' },
};

export function AppointmentExtras({ appt, otherName }) {
  if (appt.status !== 'accepted') return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {appt.meeting_url && <a href={appt.meeting_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#2A9D8F] px-3 py-1.5 text-xs font-semibold text-white" data-testid={`appt-join-${appt.id}`}><Video size={14} /> Entrar na chamada</a>}
      {appt.address && <a href={mapsUrl(appt.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-[#2A9D8F] px-3 py-1.5 text-xs font-semibold text-[#1F7A6F]" data-testid={`appt-route-${appt.id}`}><Navigation size={14} /> Abrir rota</a>}
      <button onClick={() => downloadIcs(appt, otherName)} className="flex items-center gap-1.5 rounded-full border border-[#264653] px-3 py-1.5 text-xs font-semibold text-[#264653]" data-testid={`appt-calendar-${appt.id}`}><CalendarPlus size={14} /> Adicionar à agenda</button>
    </div>
  );
}

export default function AppointmentCard({ appt, currentUserId, token, otherName, onChanged, onReschedule }) {
  const [busy, setBusy] = useState(false);
  const st = STATUS[appt.status] || STATUS.pending;
  const myTurn = appt.awaiting_user_id === currentUserId;
  const closed = ['declined', 'cancelled'].includes(appt.status);

  const act = async (action) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/appointments/${appt.id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro');
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#D9E8E5] bg-white p-4 text-left text-[#2C221E] shadow-sm" data-testid={`appointment-card-${appt.id}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold"><CalendarDays size={16} className="text-[#2A9D8F]" /> Encontro</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`} data-testid={`appointment-status-${appt.id}`}>{st.label}</span>
      </div>
      <p className="text-[15px] font-semibold">{formatDate(appt.date)}</p>
      <p className="flex items-center gap-1.5 text-sm text-[#5C524B]"><Clock size={14} /> {appt.start_time} – {appt.end_time}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#5C524B]">{appt.modality === 'video' ? <Video size={14} /> : <MapPin size={14} />} {modalityLabel(appt.modality)}</p>
      {appt.address && <p className="mt-1 text-sm">{appt.address}</p>}
      {appt.notes && <p className="mt-1 whitespace-pre-wrap rounded-lg bg-[#F7F4EE] p-2 text-xs">{appt.notes}</p>}
      {appt.details_hidden && !closed && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8C827A]"><Lock size={12} /> Endereço e detalhes aparecem após aceitar</p>}

      {myTurn && !closed && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button disabled={busy} onClick={() => act('accept')} className="flex items-center justify-center gap-1 rounded-full bg-[#2A9D8F] py-2 text-xs font-semibold text-white" data-testid={`appt-accept-${appt.id}`}><Check size={14} /> Aceitar</button>
          <button disabled={busy} onClick={() => onReschedule(appt)} className="flex items-center justify-center gap-1 rounded-full border border-[#264653] py-2 text-xs font-semibold text-[#264653]" data-testid={`appt-reschedule-${appt.id}`}><Repeat size={14} /> Outro horário</button>
          <button disabled={busy} onClick={() => act('decline')} className="flex items-center justify-center gap-1 rounded-full border border-rose-300 py-2 text-xs font-semibold text-rose-700" data-testid={`appt-decline-${appt.id}`}><X size={14} /> Recusar</button>
        </div>
      )}
      {!myTurn && !closed && appt.status !== 'accepted' && <p className="mt-3 text-xs text-[#8C827A]">Aguardando {otherName} responder…</p>}
      {appt.status === 'accepted' && (
        <button disabled={busy} onClick={() => act('cancel')} className="mt-2 text-xs font-semibold text-rose-700 underline" data-testid={`appt-cancel-${appt.id}`}>Cancelar encontro</button>
      )}
      <AppointmentExtras appt={appt} otherName={otherName} />
    </div>
  );
}
