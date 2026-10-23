import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

const API = process.env.REACT_APP_BACKEND_URL;
const today = () => new Date().toLocaleDateString('en-CA');
const nowPlus = (min) => { const d = new Date(); d.setMinutes(0); const t = Math.min(d.getHours() * 60 + min, 23 * 60 + 30); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

const BENEFITS = ['Compromisso dos dois lados', 'Adicionar à agenda do celular', 'Abrir a rota no mapa', 'Videochamada com um toque', 'Lista com todos os seus encontros'];

const Field = ({ label, icon: Icon, children, right }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-sm font-semibold text-[#2C221E]">{label}{right}</span>
    <div className="relative">{children}{Icon && <Icon size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5C524B]" />}</div>
  </label>
);

function SlotFields({ slot, set }) {
  const input = 'w-full rounded-xl border border-[#D9D1C6] bg-white px-4 py-3 text-[15px] focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20';
  return (
    <>
      <Field label="Data"><input type="date" min={today()} value={slot.date} onChange={(e) => set({ date: e.target.value })} className={input} data-testid="schedule-date-input" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora de início"><input type="time" value={slot.start_time} onChange={(e) => set({ start_time: e.target.value })} className={input} data-testid="schedule-start-input" /></Field>
        <Field label="Hora de fim"><input type="time" value={slot.end_time} onChange={(e) => set({ end_time: e.target.value })} className={input} data-testid="schedule-end-input" /></Field>
      </div>
    </>
  );
}

function ModalityFields({ form, set, otherName, myAddress }) {
  const options = [
    ['video', 'Chamada de voz ou vídeo', null, true],
    ['request_address', 'Endereço da solicitação'],
    ['my_address', 'No meu endereço', myAddress],
    ['other_address', 'Outro endereço'],
  ];
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#2C221E]">Modalidade do encontro</p>
      <div className="space-y-2.5">
        {options.map(([v, label, sub, isNew]) => (
          <label key={v} className="flex cursor-pointer items-start gap-3" data-testid={`schedule-modality-${v}`}>
            <input type="radio" name="modality" checked={form.modality === v} onChange={() => set({ modality: v })} className="mt-1 h-5 w-5 accent-[#2A9D8F]" />
            <span className="text-[15px] text-[#2C221E]">{label}
              {isNew && <span className="ml-2 rounded bg-[#E63946] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>}
              {sub && <span className="block text-xs text-[#8C827A]">{sub}</span>}
            </span>
          </label>
        ))}
      </div>
      {form.modality === 'other_address' && (
        <input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Rua, número, cidade" className="mt-3 w-full rounded-xl border border-[#D9D1C6] px-4 py-3 text-[15px]" data-testid="schedule-address-input" />
      )}
    </div>
  );
}

export default function ScheduleDialog({ open, onOpenChange, token, otherUser, myAddress, appointment, onDone }) {
  const reschedule = !!appointment;
  const initial = () => ({ date: appointment?.date || today(), start_time: appointment?.start_time || nowPlus(60), end_time: appointment?.end_time || nowPlus(150), modality: 'video', address: '', notes: '', agree: false, note: '' });
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const name = otherUser?.name || '';

  const submit = async () => {
    if (form.end_time <= form.start_time) return toast.error('O horário de fim deve ser depois do início');
    if (!reschedule && !form.agree) return toast.error('Confirme que entendeu as condições');
    setBusy(true);
    const url = reschedule ? `${API}/api/appointments/${appointment.id}/reschedule` : `${API}/api/appointments`;
    const body = reschedule
      ? { date: form.date, start_time: form.start_time, end_time: form.end_time, note: form.note || null }
      : { to_user_id: otherUser.id, date: form.date, start_time: form.start_time, end_time: form.end_time, modality: form.modality, address: form.address || null, notes: form.notes || null };
    try {
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Erro ao enviar');
      toast.success(reschedule ? 'Novo horário enviado!' : 'Encontro proposto!');
      setForm(initial());
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-lg flex-col rounded-2xl p-0" data-testid="schedule-dialog">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-[#2C221E]">{reschedule ? 'Propor outro horário' : 'Propor um encontro'}</DialogTitle>
          <DialogDescription className="sr-only">Escolha data, horário e local</DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-2">
          {!reschedule && (
            <div className="rounded-xl bg-[#EEF6F5] p-4 text-sm text-[#2C221E]">
              <p className="mb-1 font-semibold">Vantagens de marcar um encontro:</p>
              <ul className="list-disc space-y-0.5 pl-5">{BENEFITS.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
          <SlotFields slot={form} set={set} />
          {reschedule ? (
            <Field label="Mensagem" right={<span className="text-xs font-normal text-[#8C827A]">Opcional</span>}>
              <input value={form.note} onChange={(e) => set({ note: e.target.value })} maxLength={300} placeholder="Ex.: de manhã fica melhor para mim" className="w-full rounded-xl border border-[#D9D1C6] px-4 py-3 text-[15px]" data-testid="schedule-note-input" />
            </Field>
          ) : (
            <>
              <ModalityFields form={form} set={set} otherName={name} myAddress={myAddress} />
              <Field label="Informações práticas" right={<span className="text-xs font-normal text-[#8C827A]">Opcional</span>}>
                <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value.slice(0, 500) })} rows={4} placeholder="Ex.: Itinerário, andar, código do portão, interfone…" className="w-full resize-none rounded-xl border border-[#D9D1C6] px-4 py-3 text-[15px]" data-testid="schedule-notes-input" />
              </Field>
              <p className="-mt-3 text-right text-xs text-[#8C827A]">{form.notes.length}/500 máx.</p>
              <label className="flex cursor-pointer items-start gap-3 text-[15px] text-[#2C221E]">
                <input type="checkbox" checked={form.agree} onChange={(e) => set({ agree: e.target.checked })} className="mt-1 h-5 w-5 accent-[#2A9D8F]" data-testid="schedule-agree-checkbox" />
                Entendo que o endereço e as informações práticas serão mostrados quando o encontro for aceito por {name}.
              </label>
            </>
          )}
        </div>
        <div className="flex justify-center border-t border-[#EFE8DD] px-6 py-4">
          <button onClick={submit} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#264653] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#1d3640] disabled:opacity-60" data-testid="schedule-submit-btn">
            {busy && <Loader2 size={18} className="animate-spin" />}{reschedule ? 'Enviar novo horário' : 'Propor o encontro'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
